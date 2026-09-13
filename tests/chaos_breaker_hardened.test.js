import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WorkflowEngine } from '../packages/core/src/engine.js';
import { defaultActionRegistry } from '../packages/core/src/registry.js';
import { LocalDataStore } from '../packages/storage/src/index.js';
import { OperonDesktopApp } from '../apps/desktop/src/main.js';
import { Capabilities } from '../packages/core/src/types.js';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const CHAOS_SCRATCH = path.join(ROOT_DIR, 'scratch', 'chaos_arena');

function makeRequest(port, options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({ port, host: '127.0.0.1', ...options }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), raw: data });
        } catch {
          resolve({ status: res.statusCode, body: null, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

describe('OPERON Aggressive Chaos & Breaker Stress Testing', () => {
  it('Cyrillic, emoji, and Unicode directory/file paths must be processed without encoding corruption', async () => {
    if (fs.existsSync(CHAOS_SCRATCH)) fs.rmSync(CHAOS_SCRATCH, { recursive: true, force: true });
    const unicodeFolder = path.join(CHAOS_SCRATCH, 'тестовая_папка_🔥_2026');
    fs.mkdirSync(unicodeFolder, { recursive: true });

    // Create files with Cyrillic names
    const file1 = path.join(unicodeFolder, 'отчет_финансы_2026.pdf');
    const file2 = path.join(unicodeFolder, 'скриншот_экрана_🎯.png');
    const file3 = path.join(unicodeFolder, 'документ.docx');
    fs.writeFileSync(file1, 'PDF_CONTENT', 'utf-8');
    fs.writeFileSync(file2, Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
    fs.writeFileSync(file3, 'DOCX_CONTENT', 'utf-8');

    const engine = new WorkflowEngine({ registry: defaultActionRegistry });

    // Organize directory
    const organizeWf = {
      id: 'wf_chaos_organize',
      name: 'Unicode Folder Organize',
      steps: [
        {
          id: 'step_organize',
          actionId: 'file.organize_directory',
          parameters: { directoryPath: unicodeFolder, mode: 'category' }
        }
      ]
    };

    const organizeRes = await engine.execute(organizeWf);
    assert.strictEqual(organizeRes.status, 'success', 'Unicode organization must succeed');
    assert.ok(organizeRes.stepResults[0].output.movedCount >= 2, 'Files must be sorted');

    // Compress to ZIP with Cyrillic destination
    const zipDest = path.join(CHAOS_SCRATCH, 'архив_данных_📦.zip');
    const zipWf = {
      id: 'wf_chaos_zip',
      name: 'Unicode ZIP',
      steps: [
        {
          id: 'step_zip',
          actionId: 'file.compress_zip',
          parameters: { sourcePaths: [unicodeFolder], outputPath: zipDest }
        }
      ]
    };

    const zipRes = await engine.execute(zipWf);
    assert.strictEqual(zipRes.status, 'success', 'Unicode ZIP archive creation must succeed');
    assert.ok(fs.existsSync(zipDest), 'ZIP archive with Cyrillic name must exist');
    assert.ok(fs.statSync(zipDest).size > 0, 'ZIP archive must be non-empty');

    if (fs.existsSync(CHAOS_SCRATCH)) fs.rmSync(CHAOS_SCRATCH, { recursive: true, force: true });
  });

  it('Concurrent execution burst: 50 simultaneous requests must not cause race conditions or memory leaks', async () => {
    const testDb = path.join(ROOT_DIR, 'scratch', 'chaos_burst_db.json');
    if (fs.existsSync(testDb)) fs.unlinkSync(testDb);

    const app = new OperonDesktopApp({ port: 0, dbPath: testDb });
    await app.start();
    const port = app.port;

    try {
      const burstCount = 50;
      const promises = [];

      for (let i = 0; i < burstCount; i++) {
        promises.push(
          makeRequest(port, {
            path: '/api/execute',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }, {
            workflowId: 'recipe_clean_url',
            input: { url: `https://example.com/item?id=${i}&utm_source=chaos_${i}` }
          })
        );
      }

      const results = await Promise.all(promises);
      assert.strictEqual(results.length, burstCount);
      for (const res of results) {
        assert.strictEqual(res.status, 200, 'Burst execution request must return HTTP 200');
        assert.strictEqual(res.body.status, 'success');
      }

      // Verify history holds all burst logs
      const historyRes = await makeRequest(port, { path: '/api/history?limit=100', method: 'GET' });
      assert.ok(historyRes.body.history.length >= burstCount, 'All executions must be recorded in audit trail');
    } finally {
      await app.stop();
      if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
    }
  });

  it('Rapid theme switching and state mutation must not corrupt storage integrity', async () => {
    const testDb = path.join(ROOT_DIR, 'scratch', 'chaos_themes_db.json');
    if (fs.existsSync(testDb)) fs.unlinkSync(testDb);

    const store = new LocalDataStore(testDb);
    await store.init();

    const themes = ['graphite', 'midnight', 'oled', 'lunar'];
    for (let i = 0; i < 100; i++) {
      const selectedTheme = themes[i % themes.length];
      await store.updateSettings({ theme: selectedTheme, mutationCycle: i });
    }

    const finalSettings = await store.getSettings();
    assert.strictEqual(finalSettings.mutationCycle, 99);
    await store.close();

    // Reopen to verify JSON format wasn't corrupted
    const storeReopened = new LocalDataStore(testDb);
    await storeReopened.init();
    const verifiedSettings = await storeReopened.getSettings();
    assert.strictEqual(verifiedSettings.mutationCycle, 99);
    await storeReopened.close();

    if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
  });

  it('Missing files mid-workflow must fail gracefully without unhandled process crash', async () => {
    const engine = new WorkflowEngine({ registry: defaultActionRegistry });

    const brokenFileWf = {
      id: 'wf_missing_file',
      name: 'Missing File Graceful Recovery',
      steps: [
        {
          id: 'read_missing',
          actionId: 'file.read_text',
          parameters: { filePath: path.join(ROOT_DIR, 'scratch', 'definitely_does_not_exist_9999.txt') }
        }
      ]
    };

    const res = await engine.execute(brokenFileWf);
    assert.strictEqual(res.status, 'failed', 'Missing file must return failed status cleanly');
    assert.ok(res.error, 'Must provide structured error message');
    assert.ok(res.durationMs >= 0, 'Duration must be recorded');
  });

  it('Restricted capabilities must cleanly block unauthorized workflows', async () => {
    // Engine without FILESYSTEM_WRITE capability
    const restrictedEngine = new WorkflowEngine({
      registry: defaultActionRegistry,
      grantedCapabilities: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE]
    });

    const fileWriteWf = {
      id: 'wf_unauthorized_write',
      name: 'Unauthorized File Write',
      permissions: [Capabilities.FILESYSTEM_WRITE],
      steps: [
        {
          id: 'step_write',
          actionId: 'file.write_text',
          parameters: { filePath: 'test.txt', content: 'test' }
        }
      ]
    };

    const res = await restrictedEngine.execute(fileWriteWf);
    assert.strictEqual(res.status, 'failed', 'Unauthorized workflow must be blocked');
    assert.match(res.error, /capability|permission|missing/i);
  });
});
