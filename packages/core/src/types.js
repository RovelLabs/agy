/**
 * OPERON: Universal Personal Automation Layer
 * Core Type Definitions & Security Capability Tokens
 */

/**
 * Capability tokens required by workflows
 */
export const Capabilities = {
  CLIPBOARD_READ: 'clipboard.read',
  CLIPBOARD_WRITE: 'clipboard.write',
  FILESYSTEM_READ: 'filesystem.read',
  FILESYSTEM_WRITE: 'filesystem.write',
  FILESYSTEM_RECYCLE: 'filesystem.recycle',
  NETWORK_REQUEST: 'network.request',
  NOTIFICATIONS_SEND: 'notifications.send',
  SYSTEM_APP_LAUNCH: 'system.app_launch',
  SYSTEM_SHELL_EXEC: 'system.shell_exec'
};

/**
 * Supported platforms
 */
export const Platforms = {
  WINDOWS: 'windows',
  MACOS: 'macos',
  ANDROID: 'android',
  IOS: 'ios'
};

/**
 * Categories for workflows and actions
 */
export const Categories = {
  TEXT: 'text',
  CLIPBOARD: 'clipboard',
  FILE: 'file',
  IMAGE: 'image',
  DEVELOPER: 'developer',
  SYSTEM: 'system',
  CUSTOM: 'custom'
};

/**
 * Execution status enum
 */
export const ExecutionStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  DRY_RUN: 'dry_run'
};
