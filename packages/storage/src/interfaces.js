/**
 * OPERON Storage & Sync Interfaces
 * Strictly separates LocalDataStore from future SyncProvider and IdentityProvider per Directive Section 8
 */

/**
 * Interface contract for local persistent storage
 */
export class ILocalDataStore {
  async init() { throw new Error('Not implemented'); }
  async close() { throw new Error('Not implemented'); }
  async getWorkflows() { throw new Error('Not implemented'); }
  async saveWorkflow(workflow) { throw new Error('Not implemented'); }
  async deleteWorkflow(id) { throw new Error('Not implemented'); }
  async logExecution(entry) { throw new Error('Not implemented'); }
  async getExecutionHistory(limit, offset) { throw new Error('Not implemented'); }
  async getSettings() { throw new Error('Not implemented'); }
  async updateSettings(delta) { throw new Error('Not implemented'); }
}

/**
 * Interface contract for future End-to-End Encrypted Sync Provider
 */
export class ISyncProvider {
  async connect(credentials) { throw new Error('Not implemented'); }
  async pushChanges(changes) { throw new Error('Not implemented'); }
  async pullChanges(sinceTimestamp) { throw new Error('Not implemented'); }
  async resolveConflict(local, remote) { throw new Error('Not implemented'); }
}

/**
 * Interface contract for future Identity & Entitlement Provider
 */
export class IIdentityProvider {
  async authenticate() { throw new Error('Not implemented'); }
  async getEntitlements() { throw new Error('Not implemented'); }
  async signOut() { throw new Error('Not implemented'); }
}
