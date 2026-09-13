import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const ZIP_PATH = path.join(ROOT_DIR, 'OPERON-Windows-Installer-v1.0.0.zip');
const DIST_DIR = path.join(ROOT_DIR, 'dist', 'windows-installer');

describe('OPERON Windows Installer & Portable Package Verification', () => {
  it('Release archive OPERON-Windows-Installer-v1.0.0.zip must exist and be valid', () => {
    assert.ok(fs.existsSync(ZIP_PATH), 'Installer ZIP must exist');
    const stats = fs.statSync(ZIP_PATH);
    assert.ok(stats.size > 20000, `ZIP size must be > 20KB, was ${stats.size}`);
  });

  it('Staged distribution directory must contain all mandatory runtime components', () => {
    assert.ok(fs.existsSync(DIST_DIR), 'dist/windows-installer directory must exist');

    const expectedFiles = [
      'operon.cmd',
      'setup.bat',
      'Install-Operon.ps1',
      'Uninstall-Operon.ps1',
      'package.json',
      path.join('apps', 'desktop', 'src', 'main.js'),
      path.join('apps', 'desktop', 'src', 'hud', 'index.html'),
      path.join('apps', 'desktop', 'src', 'hud', 'hud.js'),
      path.join('apps', 'desktop', 'src', 'hud', 'hud.css'),
      path.join('apps', 'desktop', 'src', 'windows', 'win_tray.ps1'),
      path.join('apps', 'desktop', 'src', 'windows', 'tray_host.js'),
      path.join('packages', 'core', 'src', 'engine.js'),
      path.join('packages', 'core', 'src', 'recipes.js'),
      path.join('ai', 'src', 'compiler.js'),
      path.join('ai', 'src', 'taxonomy.js')
    ];

    for (const relFile of expectedFiles) {
      const fullPath = path.join(DIST_DIR, relFile);
      assert.ok(fs.existsSync(fullPath), `Expected file missing in installer dist: ${relFile}`);
    }
  });

  it('PowerShell installer scripts must pass AST syntax parsing without errors', () => {
    const installPs1 = path.join(DIST_DIR, 'Install-Operon.ps1');
    const uninstallPs1 = path.join(DIST_DIR, 'Uninstall-Operon.ps1');

    for (const scriptPath of [installPs1, uninstallPs1]) {
      const escapedPath = scriptPath.replace(/\\/g, '\\\\');
      const cmd = `powershell.exe -NoProfile -Command "$content = Get-Content -Raw -Path '${escapedPath}'; $tokens = $null; $errors = $null; [System.Management.Automation.Language.Parser]::ParseInput($content, [ref]$tokens, [ref]$errors) | Out-Null; if ($errors.Count -gt 0) { exit 1 } else { exit 0 }"`;
      
      try {
        execSync(cmd, { stdio: 'pipe' });
      } catch (err) {
        assert.fail(`PowerShell script ${scriptPath} has syntax errors: ${err.message}`);
      }
    }
  });

  it('Launcher scripts operon.cmd and setup.bat must have correct directives and flags', () => {
    const operonCmdContent = fs.readFileSync(path.join(DIST_DIR, 'operon.cmd'), 'utf-8');
    assert.ok(operonCmdContent.includes('win_tray.ps1'), 'operon.cmd must launch system tray icon');
    assert.ok(operonCmdContent.includes('"%~dp0apps\\desktop\\src\\main.js"'), 'operon.cmd must launch desktop server');

    const setupBatContent = fs.readFileSync(path.join(DIST_DIR, 'setup.bat'), 'utf-8');
    assert.ok(setupBatContent.includes('Install-Operon.ps1'), 'setup.bat must execute installer script');
    assert.ok(setupBatContent.includes('-ExecutionPolicy Bypass'), 'setup.bat must bypass execution policy');
  });

  it('Installer PowerShell script must target LOCALAPPDATA and register clean uninstall keys', () => {
    const installContent = fs.readFileSync(path.join(DIST_DIR, 'Install-Operon.ps1'), 'utf-8');
    assert.ok(installContent.includes('$env:LOCALAPPDATA\\Operon'), 'Must install to LOCALAPPDATA');
    assert.ok(installContent.includes('HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Operon'), 'Must register in registry for Add/Remove Programs');
    assert.ok(installContent.includes('OPERON.lnk'), 'Must create desktop shortcut');

    const uninstallContent = fs.readFileSync(path.join(DIST_DIR, 'Uninstall-Operon.ps1'), 'utf-8');
    assert.ok(uninstallContent.includes('Remove-Item'), 'Uninstaller must remove files and shortcuts');
    assert.ok(uninstallContent.includes('Uninstall\\Operon'), 'Uninstaller must remove registry key');
  });
});
