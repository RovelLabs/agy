import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  EntitlementManager,
  LicenseVerifier,
  EntitlementTier,
  ProductCapability
} from '../packages/entitlements/src/index.js';
import { LocalDataStore } from '../packages/storage/src/index.js';

describe('OPERON Entitlements & License Verification Subsystem', () => {
  test('Free tier should grant core capabilities and deny Pro capabilities', async () => {
    const manager = new EntitlementManager();
    await manager.init();

    assert.equal(manager.getTier(), EntitlementTier.FREE);
    assert.equal(manager.isTrial(), false);

    // Free capabilities granted
    assert.equal(manager.hasCapability(ProductCapability.CORE_RECIPES_EXECUTE), true);
    assert.equal(manager.hasCapability(ProductCapability.QUICK_HUD_ACCESS), true);
    assert.equal(manager.hasCapability(ProductCapability.STANDARD_THEMES), true);

    // Pro capabilities blocked
    assert.equal(manager.hasCapability(ProductCapability.WORKFLOWS_UNLIMITED), false);
    assert.equal(manager.hasCapability(ProductCapability.ADVANCED_BUILDER), false);
    assert.equal(manager.hasCapability(ProductCapability.CUSTOM_THEMES), false);
    assert.equal(manager.hasCapability(ProductCapability.LOCAL_AI_COMPILER), false);
  });

  test('Start zero-card trial should grant Pro capabilities and calculate days remaining', async () => {
    const manager = new EntitlementManager();
    await manager.init();

    const trial = await manager.startTrial(14);
    assert.equal(trial.success, true);
    assert.equal(manager.isTrial(), true);
    assert.equal(manager.getTier(), EntitlementTier.PRO_TRIAL);
    assert.equal(manager.getTrialDaysRemaining(), 14);

    // Pro capabilities now granted
    assert.equal(manager.hasCapability(ProductCapability.WORKFLOWS_UNLIMITED), true);
    assert.equal(manager.hasCapability(ProductCapability.ADVANCED_BUILDER), true);
    assert.equal(manager.hasCapability(ProductCapability.CUSTOM_THEMES), true);

    // Cannot start a second trial on same installation
    await assert.rejects(
      async () => manager.startTrial(7),
      /A trial has already been initiated/
    );
  });

  test('LicenseVerifier should issue and verify cryptographically signed lifetime keys', () => {
    const key = LicenseVerifier.issueLicense({
      customerEmail: 'alex@company.dev',
      tier: EntitlementTier.PRO_LIFETIME
    });

    assert.ok(key.startsWith('OPKEY-'));

    const verification = LicenseVerifier.verifyLicense(key);
    assert.equal(verification.valid, true);
    assert.equal(verification.tier, EntitlementTier.PRO_LIFETIME);
    assert.equal(verification.isPermanent, true);
    assert.equal(verification.email, 'alex@company.dev');
  });

  test('LicenseVerifier should reject tampered or corrupted license keys', () => {
    const key = LicenseVerifier.issueLicense({ customerEmail: 'test@local' });
    const tampered = key.slice(0, -4) + 'abcd';

    const check = LicenseVerifier.verifyLicense(tampered);
    assert.equal(check.valid, false);
    assert.ok(check.error.includes('signature mismatch'));
  });

  test('EntitlementManager should restore license from LocalDataStore across restarts', async () => {
    const store = new LocalDataStore();
    await store.init();

    const key = LicenseVerifier.issueLicense({
      customerEmail: 'founder@operon.dev',
      tier: EntitlementTier.PRO_LIFETIME
    });

    // Session 1: Activate license
    const session1 = new EntitlementManager({ store });
    await session1.init();
    await session1.activateLicense(key);
    assert.equal(session1.getTier(), EntitlementTier.PRO_LIFETIME);

    // Session 2: Fresh instance restoring from store
    const session2 = new EntitlementManager({ store });
    await session2.init();
    assert.equal(session2.getTier(), EntitlementTier.PRO_LIFETIME);
    assert.equal(session2.hasCapability(ProductCapability.WORKFLOWS_UNLIMITED), true);
    assert.equal(session2.getStatus().licensedTo, 'founder@operon.dev');
  });
});
