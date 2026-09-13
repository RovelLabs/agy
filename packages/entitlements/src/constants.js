/**
 * OPERON Entitlement & Capability Constants
 */

export const EntitlementTier = {
  FREE: 'free',
  PRO_TRIAL: 'pro_trial',
  PRO_ANNUAL: 'pro_annual',
  PRO_LIFETIME: 'pro_lifetime',
  PLUS_CLOUD: 'plus_cloud'
};

export const ProductCapability = {
  // Free capabilities
  CORE_RECIPES_EXECUTE: 'core.recipes.execute',
  QUICK_HUD_ACCESS: 'quick.hud.access',
  CLIPBOARD_BASIC: 'clipboard.basic',
  STANDARD_THEMES: 'standard.themes',
  LOCAL_STORAGE_BASIC: 'local.storage.basic',

  // Pro Local capabilities
  WORKFLOWS_UNLIMITED: 'workflows.unlimited',
  ADVANCED_BUILDER: 'advanced.builder',
  BATCH_LARGE_SCALE: 'batch.large_scale',
  DEVELOPER_PACK: 'developer.pack',
  LOCAL_AI_COMPILER: 'local.ai.compiler',
  UNLIMITED_HISTORY: 'unlimited.history',
  CUSTOM_THEMES: 'custom.themes',
  ADVANCED_TRIGGERS: 'advanced.triggers',

  // Future Cloud capabilities
  CLOUD_E2EE_SYNC: 'cloud.e2ee.sync',
  REMOTE_TRIGGERS: 'remote.triggers',
  CLOUD_HEAVY_AI: 'cloud.heavy.ai'
};

/**
 * Mapping of tiers to their granted capability sets
 */
export const TIER_CAPABILITY_MAP = {
  [EntitlementTier.FREE]: new Set([
    ProductCapability.CORE_RECIPES_EXECUTE,
    ProductCapability.QUICK_HUD_ACCESS,
    ProductCapability.CLIPBOARD_BASIC,
    ProductCapability.STANDARD_THEMES,
    ProductCapability.LOCAL_STORAGE_BASIC
  ]),

  [EntitlementTier.PRO_TRIAL]: new Set([
    ProductCapability.CORE_RECIPES_EXECUTE,
    ProductCapability.QUICK_HUD_ACCESS,
    ProductCapability.CLIPBOARD_BASIC,
    ProductCapability.STANDARD_THEMES,
    ProductCapability.LOCAL_STORAGE_BASIC,
    ProductCapability.WORKFLOWS_UNLIMITED,
    ProductCapability.ADVANCED_BUILDER,
    ProductCapability.BATCH_LARGE_SCALE,
    ProductCapability.DEVELOPER_PACK,
    ProductCapability.LOCAL_AI_COMPILER,
    ProductCapability.UNLIMITED_HISTORY,
    ProductCapability.CUSTOM_THEMES,
    ProductCapability.ADVANCED_TRIGGERS
  ]),

  [EntitlementTier.PRO_ANNUAL]: new Set([
    ProductCapability.CORE_RECIPES_EXECUTE,
    ProductCapability.QUICK_HUD_ACCESS,
    ProductCapability.CLIPBOARD_BASIC,
    ProductCapability.STANDARD_THEMES,
    ProductCapability.LOCAL_STORAGE_BASIC,
    ProductCapability.WORKFLOWS_UNLIMITED,
    ProductCapability.ADVANCED_BUILDER,
    ProductCapability.BATCH_LARGE_SCALE,
    ProductCapability.DEVELOPER_PACK,
    ProductCapability.LOCAL_AI_COMPILER,
    ProductCapability.UNLIMITED_HISTORY,
    ProductCapability.CUSTOM_THEMES,
    ProductCapability.ADVANCED_TRIGGERS
  ]),

  [EntitlementTier.PRO_LIFETIME]: new Set([
    ProductCapability.CORE_RECIPES_EXECUTE,
    ProductCapability.QUICK_HUD_ACCESS,
    ProductCapability.CLIPBOARD_BASIC,
    ProductCapability.STANDARD_THEMES,
    ProductCapability.LOCAL_STORAGE_BASIC,
    ProductCapability.WORKFLOWS_UNLIMITED,
    ProductCapability.ADVANCED_BUILDER,
    ProductCapability.BATCH_LARGE_SCALE,
    ProductCapability.DEVELOPER_PACK,
    ProductCapability.LOCAL_AI_COMPILER,
    ProductCapability.UNLIMITED_HISTORY,
    ProductCapability.CUSTOM_THEMES,
    ProductCapability.ADVANCED_TRIGGERS
  ]),

  [EntitlementTier.PLUS_CLOUD]: new Set([
    ProductCapability.CORE_RECIPES_EXECUTE,
    ProductCapability.QUICK_HUD_ACCESS,
    ProductCapability.CLIPBOARD_BASIC,
    ProductCapability.STANDARD_THEMES,
    ProductCapability.LOCAL_STORAGE_BASIC,
    ProductCapability.WORKFLOWS_UNLIMITED,
    ProductCapability.ADVANCED_BUILDER,
    ProductCapability.BATCH_LARGE_SCALE,
    ProductCapability.DEVELOPER_PACK,
    ProductCapability.LOCAL_AI_COMPILER,
    ProductCapability.UNLIMITED_HISTORY,
    ProductCapability.CUSTOM_THEMES,
    ProductCapability.ADVANCED_TRIGGERS,
    ProductCapability.CLOUD_E2EE_SYNC,
    ProductCapability.REMOTE_TRIGGERS,
    ProductCapability.CLOUD_HEAVY_AI
  ])
};
