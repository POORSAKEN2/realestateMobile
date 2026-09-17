import assert from 'node:assert/strict';
import test from 'node:test';
import load from './helpers/loadTs.cjs';
const { authorizeBillingPurchase } = load('../../utils/billing/billingPurchasePolicy.ts');
const { REVENUECAT_PRODUCT_IDS } = load('../../constants/revenueCat.ts');
const { isBillingTierActivated } = load('../../utils/billing/billingSync.ts');
const { retentionDescription } = load('../../utils/billing/entitlementCapabilities.ts');
const { getActiveRevenueCatTier } = load('../../utils/billing/revenueCatCustomer.ts');

test('store actions reject members, spoofed owner permission and revoked permission', () => {
  for (const user of [null, { role: 'MANAGER' }, { role: 'MANAGER', permissions: ['billing.checkout'] }, { role: 'ADMIN', permissions: [] }]) {
    assert.throws(() => authorizeBillingPurchase(user), /administrators/);
    assert.throws(() => authorizeBillingPurchase(user, REVENUECAT_PRODUCT_IDS.starter_monthly), /administrators/);
  }
  assert.doesNotThrow(() => authorizeBillingPurchase({ role: 'ADMIN' }));
});

test('administrators can purchase only the six new catalog products', () => {
  for (const [key, identifier] of Object.entries(REVENUECAT_PRODUCT_IDS)) {
    if (/^(starter|professional|portfolio)_/.test(key)) {
      assert.doesNotThrow(() => authorizeBillingPurchase({ role: 'ADMIN' }, identifier));
    } else {
      assert.throws(() => authorizeBillingPurchase({ role: 'ADMIN' }, identifier), /no longer available/);
    }
  }
  assert.throws(() => authorizeBillingPurchase({ role: 'ADMIN' }, 'unknown'), /no longer available/);
});

test('trial and read-only server access never confirm a store purchase', () => {
  assert.equal(isBillingTierActivated({ effective_tier: 'professional', entitlement_source: 'trial', access_mode: 'active' }, 'starter'), false);
  assert.equal(isBillingTierActivated({ effective_tier: 'portfolio', access_mode: 'read_only' }, 'starter'), false);
  assert.equal(isBillingTierActivated({ effective_tier: 'all_in', access_mode: 'active' }, 'starter'), false);
  assert.equal(isBillingTierActivated({ effective_tier: 'portfolio', access_mode: 'active' }, 'professional'), true);
});

test('new calendar retention takes precedence over compatibility day fields', () => {
  assert.equal(retentionDescription({ limits: { retention_months: { months: 12 }, retention_days: { days: 365 } } }), 'History available for 12 calendar months');
  assert.equal(retentionDescription({ limits: { retention_months: { months: null }, retention_days: { days: null } } }), 'Full history available');
});

test('store entitlement mapping preserves legacy recognition and explicit new-plan selection', () => {
  const info = { entitlements: { active: { all_in_access: {}, starter_access: {} } } };
  assert.equal(getActiveRevenueCatTier(info), 'starter');
  delete info.entitlements.active.starter_access;
  assert.equal(getActiveRevenueCatTier(info), 'all_in');
});
