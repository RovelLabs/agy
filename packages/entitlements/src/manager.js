/**
 * OPERON Centralized EntitlementManager
 * Central authority for capability-based permission checks across desktop and mobile
 */
import { EntitlementTier, ProductCapability, TIER_CAPABILITY_MAP } from './constants.js';
import { LicenseVerifier } from './license.js';

export class EntitlementManager {
  constructor(options = {}) {
    this.store = options.store || null;
    this.currentTier = EntitlementTier.FREE;
    this.licenseData = null;
    this.trialStartTimestamp = null;
    this.trialDurationDays = 14;
  }

  /**
   * Initializes the manager and restores entitlements from storage
   */
  async init() {
    if (this.store) {
      const settings = await this.store.getSettings();
      if (settings?.licenseKey) {
        const verify = LicenseVerifier.verifyLicense(settings.licenseKey);
        if (verify.valid) {
          this.currentTier = verify.tier;
          this.licenseData = verify;
          return;
        }
      }

      if (settings?.trialStartedAt) {
        this.trialStartTimestamp = settings.trialStartedAt;
        if (this.isTrialActive()) {
          this.currentTier = EntitlementTier.PRO_TRIAL;
          return;
        }
      }
    }

    this.currentTier = EntitlementTier.FREE;
  }

  /**
   * Primary API: Checks if a specific feature capability is available
   */
  hasCapability(capability) {
    const granted = TIER_CAPABILITY_MAP[this.currentTier];
    if (!granted) return false;
    return granted.has(capability);
  }

  /**
   * Returns current tier
   */
  getTier() {
    // Check if trial has expired
    if (this.currentTier === EntitlementTier.PRO_TRIAL && !this.isTrialActive()) {
      this.currentTier = EntitlementTier.FREE;
    }
    return this.currentTier;
  }

  /**
   * Checks if installation is on an active trial
   */
  isTrial() {
    return this.getTier() === EntitlementTier.PRO_TRIAL;
  }

  isTrialActive() {
    if (!this.trialStartTimestamp) return false;
    const elapsedMs = Date.now() - this.trialStartTimestamp;
    const maxMs = this.trialDurationDays * 24 * 60 * 60 * 1000;
    return elapsedMs < maxMs;
  }

  getTrialDaysRemaining() {
    if (!this.isTrialActive()) return 0;
    const elapsedMs = Date.now() - this.trialStartTimestamp;
    const maxMs = this.trialDurationDays * 24 * 60 * 60 * 1000;
    const remainingMs = Math.max(0, maxMs - elapsedMs);
    return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  }

  /**
   * Starts a 14-day zero-card trial
   */
  async startTrial(days = 14) {
    if (this.trialStartTimestamp) {
      throw new Error('A trial has already been initiated on this device.');
    }
    this.trialDurationDays = days;
    this.trialStartTimestamp = Date.now();
    this.currentTier = EntitlementTier.PRO_TRIAL;

    if (this.store) {
      await this.store.updateSettings({
        trialStartedAt: this.trialStartTimestamp,
        trialDurationDays: days
      });
    }

    return {
      success: true,
      tier: this.currentTier,
      daysRemaining: days
    };
  }

  /**
   * Activates a purchased offline or online license key
   */
  async activateLicense(licenseKey) {
    const result = LicenseVerifier.verifyLicense(licenseKey);
    if (!result.valid) {
      throw new Error(result.error || 'Failed to verify license key.');
    }

    this.currentTier = result.tier;
    this.licenseData = result;

    if (this.store) {
      await this.store.updateSettings({
        licenseKey,
        licensedTier: result.tier,
        licenseId: result.licenseId,
        licensedTo: result.email
      });
    }

    return {
      success: true,
      tier: this.currentTier,
      isPermanent: result.isPermanent,
      expiresAt: result.expiresAt
    };
  }

  /**
   * Returns metadata about the current entitlement state
   */
  getStatus() {
    return {
      tier: this.getTier(),
      isTrial: this.isTrial(),
      trialDaysRemaining: this.getTrialDaysRemaining(),
      isPermanent: this.licenseData?.isPermanent ?? false,
      expiresAt: this.licenseData?.expiresAt ?? null,
      licensedTo: this.licenseData?.email ?? null,
      capabilitiesCount: (TIER_CAPABILITY_MAP[this.getTier()] || new Set()).size
    };
  }
}
