/**
 * OPERON LocalDataStore Implementation
 */
import { ILocalDataStore } from './interfaces.js';
import path from 'node:path';
import fs from 'node:fs/promises';

export class LocalDataStore extends ILocalDataStore {
  constructor(options = {}) {
    super();
    const opts = typeof options === 'string' ? { storagePath: options } : (options || {});
    this.storagePath = opts.storagePath || null;
    this.isMemoryOnly = !this.storagePath;
    this.version = 1;

    this.state = {
      version: 1,
      workflows: new Map(),
      executionHistory: [],
      settings: {
        theme: 'graphite',
        accentColor: '#38BDF8',
        globalHotkey: 'Alt+Space',
        reducedMotion: false,
        developerMode: false,
        telemetryEnabled: false
      }
    };
  }

  async init() {
    if (!this.isMemoryOnly && this.storagePath) {
      try {
        await fs.mkdir(path.dirname(this.storagePath), { recursive: true });
        const raw = await fs.readFile(this.storagePath, 'utf8');
        const loaded = JSON.parse(raw);
        if (loaded && loaded.version) {
          this.state.version = loaded.version;
          this.state.settings = { ...this.state.settings, ...loaded.settings };
          if (Array.isArray(loaded.workflows)) {
            for (const wf of loaded.workflows) {
              this.state.workflows.set(wf.id, wf);
            }
          }
          this.state.executionHistory = loaded.executionHistory || [];
        }
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.warn(`[LocalDataStore] Warning loading store: ${err.message}. Starting fresh.`);
        }
        await this.persist();
      }
    }
  }

  async persist() {
    if (this.isMemoryOnly || !this.storagePath) return;

    // Sequential write queue to prevent Windows NTFS EPERM / EBUSY rename race conditions
    if (this._persistPromise) {
      this._hasPendingPersist = true;
      return this._persistPromise;
    }

    this._persistPromise = (async () => {
      try {
        do {
          this._hasPendingPersist = false;
          const payload = {
            version: this.state.version,
            updatedAt: new Date().toISOString(),
            settings: this.state.settings,
            workflows: Array.from(this.state.workflows.values()),
            executionHistory: this.state.executionHistory.slice(-500) // Keep last 500
          };

          const tempPath = `${this.storagePath}.tmp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await fs.writeFile(tempPath, JSON.stringify(payload, null, 2), 'utf8');
          try {
            await fs.rename(tempPath, this.storagePath);
          } catch (renameErr) {
            // Fallback for Windows file lock
            await fs.copyFile(tempPath, this.storagePath);
            await fs.unlink(tempPath).catch(() => {});
          }
        } while (this._hasPendingPersist);
      } finally {
        this._persistPromise = null;
      }
    })();

    return this._persistPromise;
  }

  async close() {
    await this.persist();
  }

  async getWorkflows() {
    return Array.from(this.state.workflows.values());
  }

  async getWorkflowById(id) {
    return this.state.workflows.get(id) || null;
  }

  async saveWorkflow(workflow) {
    if (!workflow.id || !workflow.name) {
      throw new Error('Workflow must possess id and name');
    }
    const updated = {
      ...workflow,
      updatedAt: new Date().toISOString()
    };
    this.state.workflows.set(workflow.id, updated);
    await this.persist();
    return updated;
  }

  async deleteWorkflow(id) {
    const deleted = this.state.workflows.delete(id);
    if (deleted) await this.persist();
    return deleted;
  }

  async logExecution(entry) {
    const record = {
      id: entry.id || `exec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      workflowId: entry.workflowId,
      status: entry.status,
      durationMs: entry.durationMs,
      output: entry.output,
      error: entry.error || null,
      executedAt: entry.executedAt || new Date().toISOString()
    };

    this.state.executionHistory.unshift(record);
    if (this.state.executionHistory.length > 500) {
      this.state.executionHistory.pop();
    }

    await this.persist();
    return record;
  }

  async getExecutionHistory(limit = 50, offset = 0) {
    return this.state.executionHistory.slice(offset, offset + limit);
  }

  async getSettings() {
    return { ...this.state.settings };
  }

  async updateSettings(delta) {
    this.state.settings = { ...this.state.settings, ...delta };
    await this.persist();
    return { ...this.state.settings };
  }

  async createBackup() {
    return {
      version: this.state.version,
      exportedAt: new Date().toISOString(),
      workflows: await this.getWorkflows(),
      settings: await this.getSettings()
    };
  }

  async restoreBackup(backupData) {
    if (!backupData || !backupData.workflows) {
      throw new Error('Invalid backup payload');
    }
    for (const wf of backupData.workflows) {
      this.state.workflows.set(wf.id, wf);
    }
    if (backupData.settings) {
      this.state.settings = { ...this.state.settings, ...backupData.settings };
    }
    await this.persist();
    return true;
  }
}
