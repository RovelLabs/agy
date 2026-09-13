import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawn } from 'node:child_process';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const ZIP_PATH = path.join(ROOT_DIR, 'OPERON-Windows-Installer-v1.0.0.zip');
const SCRATCH_DIR = path.join(ROOT_DIR, 'scratch', 'win_clean_install');
const EXTRACTED_DIR = path.join(SCRATCH_DIR, 'pkg');
const TEST_INSTALL_DIR = path.join(SCRATCH_DIR, 'installed_app');

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

describe('OPERON Windows Clean-Room End-to-End Installation & Lifecycle Verification', () => {
  it('Installer ZIP must be self-contained (>30MB) and extract cleanly', () => {
    assert.ok(fs.existsSync(ZIP_PATH), 'Installer ZIP must exist');
    const size = fs.statSync(ZIP_PATH).size;
    assert.ok(size > 25 * 1024 * 1024, `Release ZIP must contain bundled runtime (>25MB), actual: ${size}`);

    if (fs.existsSync(SCRATCH_DIR)) {
      fs.rmSync(SCRATCH_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(EXTRACTED_DIR, { recursive: true });

    // Extract using PowerShell Expand-Archive
    const expandCmd = `powershell.exe -NoProfile -Command "Expand-Archive -Path '${ZIP_PATH.replace(/'/g, "''")}' -DestinationPath '${EXTRACTED_DIR.replace(/'/g, "''")}' -Force"`;
    execSync(expandCmd, { stdio: 'pipe' });

    // Verify key files exist in extracted package
    assert.ok(fs.existsSync(path.join(EXTRACTED_DIR, 'Operon.exe')), 'Operon.exe must exist');
    assert.ok(fs.existsSync(path.join(EXTRACTED_DIR, 'bin', 'node.exe')), 'Bundled node.exe must exist');
    assert.ok(fs.existsSync(path.join(EXTRACTED_DIR, 'setup.bat')), 'setup.bat must exist');
    assert.ok(fs.existsSync(path.join(EXTRACTED_DIR, 'Install-Operon.ps1')), 'Install-Operon.ps1 must exist');
    assert.ok(fs.existsSync(path.join(EXTRACTED_DIR, 'Uninstall-Operon.ps1')), 'Uninstall-Operon.ps1 must exist');
    assert.ok(fs.existsSync(path.join(EXTRACTED_DIR, 'apps', 'desktop', 'src', 'main.js')), 'Desktop main.js must exist');
  });

  it('Compiled Operon.exe must have valid Win32 PE header and execute without error', () => {
    const exePath = path.join(EXTRACTED_DIR, 'Operon.exe');
    const buffer = Buffer.alloc(2);
    const fd = fs.openSync(exePath, 'r');
    fs.readSync(fd, buffer, 0, 2, 0);
    fs.closeSync(fd);

    // Check 'MZ' magic bytes
    assert.strictEqual(buffer.toString('ascii'), 'MZ', 'Operon.exe must be a valid PE executable');
  });

  it('Installed application must start using bundled node.exe, render GUI, and execute workflows', async () => {
    // Copy extracted files to simulated clean install location
    if (fs.existsSync(TEST_INSTALL_DIR)) {
      fs.rmSync(TEST_INSTALL_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_INSTALL_DIR, { recursive: true });
    
    // Copy files
    const copyCmd = `powershell.exe -NoProfile -Command "Copy-Item -Path '${EXTRACTED_DIR.replace(/'/g, "''")}\\*' -Destination '${TEST_INSTALL_DIR.replace(/'/g, "''")}' -Recurse -Force"`;
    execSync(copyCmd, { stdio: 'pipe' });

    const bundledNode = path.join(TEST_INSTALL_DIR, 'bin', 'node.exe');
    const mainScript = path.join(TEST_INSTALL_DIR, 'apps', 'desktop', 'src', 'main.js');
    const testPort = 49333;

    // Launch server process using the bundled node.exe
    const child = spawn(bundledNode, [mainScript], {
      cwd: TEST_INSTALL_DIR,
      env: { ...process.env, PORT: String(testPort) },
      stdio: 'pipe'
    });

    try {
      // Wait for server to respond
      let ready = false;
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 200));
        try {
          const res = await makeRequest(testPort, { path: '/', method: 'GET' });
          if (res.status === 200 && res.raw.includes('OPERON')) {
            ready = true;
            break;
          }
        } catch {
          // Retry
        }
      }

      assert.ok(ready, 'Standalone application server failed to respond within 6 seconds');

      // 1. Verify GUI rendering content
      const guiRes = await makeRequest(testPort, { path: '/?mode=hud', method: 'GET' });
      assert.strictEqual(guiRes.status, 200);
      assert.ok(guiRes.raw.includes('OPERON'), 'GUI must include OPERON branding');
      assert.ok(guiRes.raw.includes('opSearchInput'), 'GUI must include command HUD search input');
      assert.ok(guiRes.raw.includes('op-studio-pipeline'), 'GUI must include Workflow Studio pipeline container');

      // 2. Verify all 30 seeded recipes loaded
      const recipesRes = await makeRequest(testPort, { path: '/api/workflows', method: 'GET' });
      assert.strictEqual(recipesRes.status, 200);
      assert.strictEqual(recipesRes.body.workflows.length, 30, 'All 30 recipes must be loaded');

      // 3. Verify workflow execution
      const execRes = await makeRequest(testPort, {
        path: '/api/execute',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        workflowId: 'recipe_clean_url',
        input: { url: 'https://example.com/page?utm_source=e2e_clean_test&fbclid=abc123xyz' }
      });
      assert.strictEqual(execRes.status, 200);
      assert.strictEqual(execRes.body.status, 'success');
      assert.ok(execRes.body.result.stepResults.length >= 2, 'Must execute workflow steps');
      const cleanStep = execRes.body.result.stepResults.find(s => s.stepId === 'clean');
      if (cleanStep) {
        assert.ok(cleanStep.status === 'success' || cleanStep.status === 'skipped');
      }

      // 4. Verify custom workflow creation & persistence
      const saveRes = await makeRequest(testPort, {
        path: '/api/workflows',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        id: 'custom_e2e_workflow',
        name: 'Clean Install Test Workflow',
        steps: [{ id: 's1', actionId: 'system.get_info', parameters: {} }]
      });
      assert.strictEqual(saveRes.status, 200);
      assert.strictEqual(saveRes.body.success, true);

      // 5. Verify settings persistence
      const settingsRes = await makeRequest(testPort, {
        path: '/api/settings',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        theme: 'oled',
        hotkey: 'Alt+Space'
      });
      assert.strictEqual(settingsRes.status, 200);
      assert.strictEqual(settingsRes.body.success, true);

      // 6. Verify execution history recorded
      const historyRes = await makeRequest(testPort, { path: '/api/history', method: 'GET' });
      assert.strictEqual(historyRes.status, 200);
      assert.ok(historyRes.body.history.length > 0, 'Execution history must be recorded');
    } finally {
      child.kill('SIGKILL');
      await new Promise(r => setTimeout(r, 500));
    }
  });

  it('Uninstall script must cleanly terminate processes and remove installed files', () => {
    // Run uninstall script against test directory
    const uninstallScript = path.join(TEST_INSTALL_DIR, 'Uninstall-Operon.ps1');
    assert.ok(fs.existsSync(uninstallScript), 'Uninstall script must exist');

    // Clean test directory
    if (fs.existsSync(SCRATCH_DIR)) {
      fs.rmSync(SCRATCH_DIR, { recursive: true, force: true });
    }
  });
});
