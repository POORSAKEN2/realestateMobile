import assert from 'node:assert/strict';
import test from 'node:test';
import load from './helpers/loadTs.cjs';
const { createStaffService, canAddManager } = load('../../services/staff/staffService.ts');
const { createHttpStaffGateway, normalizeStaffRoster } = load('../../services/staff/httpStaffGateway.ts');
const { normalizeAccess } = load('../../utils/auth/accessAdapter.ts');
const { staffApiContract } = load('../../api/staffContract.ts');
const owner = normalizeAccess({ role: 'ADMIN' });
const manager = { id: 'm1', name: 'Manager', email: 'manager@example.test', role: 'MANAGER', status: 'active', propertyIds: [], permissions: null };
const details = { name: 'Manager', email: 'manager@example.test', password: 'test-password' };
function fixture() {
  const calls = [];
  const gateway = {
    creationMode: 'account', supportsAssignments: true, supportsPermissions: true,
    create: async (...args) => { calls.push(['create', ...args]); return manager; },
    list: async () => ({ managers: [manager], total: 1, complete: true }),
    update: async (...args) => { calls.push(['update', ...args]); return manager; },
    setEnabled: async (...args) => { calls.push(['setEnabled', ...args]); return manager; },
    remove: async (...args) => { calls.push(['remove', ...args]); },
  };
  return { calls, gateway };
}
test('every staff operation rejects a manager, including bypassed form submissions', async () => {
  const { gateway, calls } = fixture();
  const service = createStaffService(gateway, () => normalizeAccess({ role: 'MANAGER' }));
  for (const operation of [() => service.list(), () => service.create(details), () => service.update('m1', details), () => service.setEnabled('m1', false), () => service.remove('m1')]) {
    await assert.rejects(operation, /Only account owners/);
  }
  assert.deepEqual(calls, []);
});
test('owner workflows dispatch through injected gateway', async () => {
  const { gateway, calls } = fixture(); const service = createStaffService(gateway, () => owner, 'token');
  await service.create(details); await service.update('m1', details); await service.setEnabled('m1', false); await service.remove('m1');
  assert.deepEqual(calls.map(call => call[0]), ['create', 'update', 'setEnabled', 'remove']);
});
test('fresh server count blocks creation even when cached count is below two', async () => {
  const { gateway, calls } = fixture(); gateway.list = async () => ({ managers: [], total: 2, complete: false });
  await assert.rejects(() => createStaffService(gateway, () => owner).create(details, { managers: [], total: 0, complete: true }), /maximum 2/);
  assert.deepEqual(calls, []); assert.equal(canAddManager({ total: 2 }), false);
});
test('disabled and pending managers still consume the limit', () => {
  const roster = normalizeStaffRoster({ data: [manager, { ...manager, id: 'm2', status: 'disabled' }] });
  assert.equal(canAddManager(roster), false);
});
test('revoked owner permission during count refresh prevents creation', async () => {
  const { gateway, calls } = fixture(); let access = owner;
  gateway.list = async () => { access = normalizeAccess({ role: 'MANAGER' }); return { managers: [], total: 0, complete: true }; };
  await assert.rejects(() => createStaffService(gateway, () => access).create(details), /Only account owners/);
  assert.deepEqual(calls, []);
});
test('unconfigured lifecycle operations never call guessed endpoints', async () => {
  const calls = [];
  const gateway = createHttpStaffGateway({ post: async (...args) => { calls.push(args); return manager; } }, staffApiContract);
  assert.equal(gateway.list, undefined); assert.equal(gateway.update, undefined); assert.equal(gateway.remove, undefined);
  await assert.rejects(() => createStaffService(gateway, () => owner).remove('m1'), /not available/);
  assert.deepEqual(calls, []);
});
test('legacy creation sends only supported fields and fixes MANAGER role', async () => {
  const calls = []; const gateway = createHttpStaffGateway({ post: async (...args) => { calls.push(args); return manager; } }, staffApiContract);
  await gateway.create({ ...details, name: ' Manager ', email: ' MANAGER@example.test ', role: 'ADMIN', tenant_id: 'other', propertyIds: ['p1'], permissions: ['staff.manage'] });
  assert.deepEqual(calls[0][1], { name: 'Manager', email: 'manager@example.test', password: 'test-password', role: 'MANAGER' });
});
test('invitation and editing adapters omit passwords and role editing', async () => {
  const calls = []; const transport = { post: async (...args) => { calls.push(args); return manager; }, patch: async (...args) => { calls.push(args); return manager; } };
  const gateway = createHttpStaffGateway(transport, { ...staffApiContract, creationMode: 'invitation', supportsAssignments: true, supportsPermissions: true, update: id => `/test-managers/${id}` });
  const payload = { ...details, propertyIds: ['p1'], permissions: ['properties.view'], role: 'ADMIN' };
  await gateway.create(payload); await gateway.update('m/1', payload);
  assert.equal(calls[0][1].password, undefined); assert.equal(calls[1][1].role, undefined);
  assert.equal(calls[1][0], '/test-managers/m%2F1'); assert.deepEqual(calls[1][1].assigned_property_ids, ['p1']);
});
test('partial and invalid rosters cannot disguise the manager limit', () => {
  assert.equal(normalizeStaffRoster({ data: { data: [manager], total: 2, last_page: 2 } }).complete, false);
  assert.throws(() => normalizeStaffRoster({ data: 'invalid' }));
  assert.throws(() => normalizeStaffRoster([{ ...manager, role: 'ADMIN' }]));
});
