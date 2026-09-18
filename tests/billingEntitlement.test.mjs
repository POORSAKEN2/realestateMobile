import assert from 'node:assert/strict';
import test from 'node:test';
import load from './helpers/loadTs.cjs';
const { toApiError, entitlementLimitDetails, decodeApiErrorPayload } = load('../../api/errors.ts');
const { blockerMessage, billingStatusMessage, formatUsage, usagePercentage } = load('../../utils/billing/entitlementPresentation.ts');

test('quota payload keeps backend error key, plan, dimension and upgrade path', () => {
  const details = { dimension: 'storage_bytes', limit: 1024, current: 1000, requested: 100,
    current_plan: { key: 'free', label: 'Free' }, required_plan: { key: 'tier1', label: 'Tier 1' }, upgrade_path: '/api/billing/checkout' };
  const error = toApiError(403, { error: 'entitlement_limit_reached', message: 'Storage is full.', errors: details });
  assert.equal(error.code, 'entitlement_limit_reached');
  assert.deepEqual(entitlementLimitDetails(error), details);
  assert.equal(entitlementLimitDetails(toApiError(403, { message: 'Forbidden' })), null);
});
test('structured validation values never become non-string error messages', () => {
  assert.equal(typeof toApiError(422, { errors: { current: 4, required_plan: {} } }).message, 'string');
  assert.equal(toApiError(422, { errors: { tier: ['Unknown tier.'] } }).message, 'Unknown tier.');
});
test('PDF binary responses preserve JSON error messages and quota metadata', () => {
  const payload = { error: 'entitlement_limit_reached', message: 'Upgrade for PDF.', errors: { dimension: 'reports_level', excess: 1 } };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  assert.deepEqual(decodeApiErrorPayload(bytes.buffer), payload);
  assert.deepEqual(entitlementLimitDetails(toApiError(403, decodeApiErrorPayload(bytes))), payload.errors);
  assert.equal(decodeApiErrorPayload(new TextEncoder().encode('%PDF-1.4')), undefined);
});
test('downgrade blockers name dimension, usage, ceiling and excess', () => {
  assert.equal(blockerMessage({ dimension: 'properties', current: 7, target_limit: 5, excess: 2 }), 'Properties: using 7, target allows 5. Reduce by 2.');
  assert.equal(formatUsage('storage_bytes', 2 * 1024 ** 3), '2 GB');
  assert.equal(formatUsage('storage_bytes', 0), '0 B');
});
test('billing distinguishes grace, cancellation, expired access and healthy subscription', () => {
  assert.match(billingStatusMessage({ in_grace_period: true, grace_ends_at: '2026-09-09' }), /Payment needs attention/);
  assert.match(billingStatusMessage({ status: 'canceled', effective_tier: 'tier1' }), /Paid access continues/);
  assert.match(billingStatusMessage({ status: 'canceled', effective_tier: 'free' }), /Subscribe to resume changes/);
  assert.match(billingStatusMessage({ status: 'expired', effective_tier: 'free' }), /inactive/);
  assert.equal(billingStatusMessage({ status: 'active' }), 'Active subscription');
});

test('usage display handles unlimited, zero and exceeded quotas', () => {
  assert.equal(usagePercentage({ used: 50, limit: null }), 0);
  assert.equal(usagePercentage({ used: 0, limit: 0 }), 0);
  assert.equal(usagePercentage({ used: 1, limit: 0 }), 100);
  assert.equal(usagePercentage({ used: 15, limit: 10 }), 100);
  assert.equal(usagePercentage({ used: 3, limit: 10 }), 30);
});
