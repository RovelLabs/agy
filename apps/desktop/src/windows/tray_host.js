/**
 * OPERON Windows Native Host & System Tray Supervisor
 */
import { spawn, exec } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { OperonDesktopApp } from '../main.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WindowsHostSupervisor {
  constructor(options = {}) {
    this.port = options.port || 49210;
    this.app = null;
    this.trayProcess = null;
    this.isShuttingDown = false;
    this.restartAttempts = 0;
    this.maxRestarts = 5;
  }

  async start() {
    console.log('[Windows Host] Launching Operon Desktop Service on Windows...');
    await this.startAppServer();
    await this.startTrayIcon();
    this.registerProcessHandlers();
  }

  async startAppServer() {
    try {
      this.app = new OperonDesktopApp({ port: this.port });
      const hostUrl = await this.app.start();
      console.log(`[Windows Host] Core API Server running at: ${hostUrl}`);
      this.restartAttempts = 0;
    } catch (err) {
      console.error('[Windows Host] App server failure:', err);
      if (!this.isShuttingDown && this.restartAttempts < this.maxRestarts) {
        this.restartAttempts++;
        console.log(`[Windows Host] Watchdog restarting app server (attempt ${this.restartAttempts})...`);
        setTimeout(() => this.startAppServer(), 1000);
      }
    }
  }

  async startTrayIcon() {
    const psScript = path.join(__dirname, 'win_tray.ps1');
    const exists = await fs.stat(psScript).then(() => true).catch(() => false);
    if (!exists) {
      console.log('[Windows Host] Tray script not yet present, skipping tray launch.');
      return;
    }

    console.log('[Windows Host] Spawning native Windows System Tray process...');
    // Launch PowerShell in background without window
    this.trayProcess = spawn('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-WindowStyle', 'Hidden',
      '-File', psScript,
      '-Port', String(this.port)
    ], {
      detached: true,
      stdio: 'ignore'
    });

    this.trayProcess.unref();
  }

  async setStartupEnabled(enabled) {
    const runKey = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
    const appPath = `"${process.execPath}" "${path.join(__dirname, 'tray_host.js')}"`;

    return new Promise((resolve, reject) => {
      if (enabled) {
        const cmd = `powershell -Command "Set-ItemProperty -Path '${runKey}' -Name 'Operon' -Value '${appPath}'"`;
        exec(cmd, (err) => (err ? reject(err) : resolve(true)));
      } else {
        const cmd = `powershell -Command "Remove-ItemProperty -Path '${runKey}' -Name 'Operon' -ErrorAction SilentlyContinue"`;
        exec(cmd, (err) => (err ? reject(err) : resolve(false)));
      }
    });
  }

  registerProcessHandlers() {
    const cleanup = async () => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      console.log('\n[Windows Host] Gracefully shutting down Operon...');
      if (this.app) await this.app.stop();
      if (this.trayProcess) {
        try { this.trayProcess.kill(); } catch {}
      }
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }
}

if (process.argv[1] === __filename) {
  const supervisor = new WindowsHostSupervisor();
  supervisor.start().catch(err => {
    console.error('[Windows Host] Fatal error:', err);
    process.exit(1);
  });
}
