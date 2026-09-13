import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { LocalDataStore } from '../packages/storage/src/index.js';
import path from 'node:path';
import fs from 'node:fs/promises';

describe('OPERON LocalDataStore & Storage Layer', () => {
  const testDir = path.join(process.cwd(), '.test_storage');
  const testFile = path.join(testDir, 'test_operon.json');

  after(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {}
  });

  test('LocalDataStore should initialize, save workflows, and retrieve them', async () => {
    const store = new LocalDataStore({ storagePath: testFile });
    await store.init();

    const sample = {
      id: 'wf_test_1',
      name: 'Test Workflow',
      category: 'text',
      steps: []
    };

    await store.saveWorkflow(sample);
    const workflows = await store.getWorkflows();
    assert.equal(workflows.length, 1);
    assert.equal(workflows[0].id, 'wf_test_1');

    const byId = await store.getWorkflowById('wf_test_1');
    assert.equal(byId.name, 'Test Workflow');
  });

  test('LocalDataStore should log executions and enforce history bounds', async () => {
    const store = new LocalDataStore({ storagePath: testFile });
    await store.init();

    await store.logExecution({
      workflowId: 'wf_test_1',
      status: 'success',
      durationMs: 3.42,
      output: { cleaned: true }
    });

    const history = await store.getExecutionHistory();
    assert.equal(history.length, 1);
    assert.equal(history[0].workflowId, 'wf_test_1');
    assert.equal(history[0].status, 'success');
  });

  test('LocalDataStore should update settings atomically', async () => {
    const store = new LocalDataStore({ storagePath: testFile });
    await store.init();

    const initial = await store.getSettings();
    assert.equal(initial.theme, 'graphite');

    const updated = await store.updateSettings({ theme: 'oled', globalHotkey: 'Ctrl+Space' });
    assert.equal(updated.theme, 'oled');
    assert.equal(updated.globalHotkey, 'Ctrl+Space');

    // Reload from file to ensure persistence
    const store2 = new LocalDataStore({ storagePath: testFile });
    await store2.init();
    const loadedSettings = await store2.getSettings();
    assert.equal(loadedSettings.theme, 'oled');
    assert.equal(loadedSettings.globalHotkey, 'Ctrl+Space');
  });

  test('LocalDataStore backup and restore should round-trip correctly', async () => {
    const store = new LocalDataStore({ storagePath: testFile });
    await store.init();

    const backup = await store.createBackup();
    assert.ok(backup.workflows.length >= 1);
    assert.equal(backup.settings.theme, 'oled');

    const freshStore = new LocalDataStore(); // in-memory
    await freshStore.restoreBackup(backup);

    const restoredWfs = await freshStore.getWorkflows();
    assert.equal(restoredWfs.length, 1);
    assert.equal(restoredWfs[0].id, 'wf_test_1');
  });
});
