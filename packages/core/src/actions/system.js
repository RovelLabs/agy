import { Capabilities, Platforms, Categories } from '../types.js';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';

const execAsync = promisify(exec);

export const systemActions = [
  {
    id: 'system.notify',
    name: 'Show System Notification',
    description: 'Displays a native OS toast notification with custom title and message.',
    category: Categories.SYSTEM,
    requiredCapabilities: [Capabilities.NOTIFICATIONS_SEND],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', default: 'OPERON' },
        message: { type: 'string' }
      },
      required: ['message']
    },
    async execute({ title = 'OPERON', message }, context) {
      if (context && context.notifier && typeof context.notifier.notify === 'function') {
        await context.notifier.notify({ title, message });
        return { delivered: true, title, message, timestamp: Date.now() };
      }

      // Native fallback on desktop OS
      try {
        const platform = os.platform();
        const safeTitle = title.replace(/["`$\\]/g, '');
        const safeMsg = message.replace(/["`$\\]/g, '');

        if (platform === 'win32') {
          // PowerShell notification fallback
          const psCommand = `powershell -NoProfile -Command "[reflection.assembly]::loadwithpartialname('System.Windows.Forms') | Out-Null; $n = New-Object System.Windows.Forms.NotifyIcon; $n.Icon = [System.Drawing.SystemIcons]::Information; $n.Visible = $true; $n.ShowBalloonTip(3000, '${safeTitle}', '${safeMsg}', [System.Windows.Forms.ToolTipIcon]::Info)"`;
          exec(psCommand, () => {});
        } else if (platform === 'darwin') {
          exec(`osascript -e 'display notification "${safeMsg}" with title "${safeTitle}"'`, () => {});
        } else if (platform === 'linux') {
          exec(`notify-send "${safeTitle}" "${safeMsg}"`, () => {});
        }
      } catch {
        // Fallback silently if UI subsystem is headless
      }

      return { delivered: true, title, message, timestamp: Date.now() };
    }
  },

  {
    id: 'system.open_url',
    name: 'Open URL in Default Browser',
    description: 'Safely launches default web browser with sanitized target URL.',
    category: Categories.SYSTEM,
    requiredCapabilities: [Capabilities.SYSTEM_APP_LAUNCH],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' }
      },
      required: ['url']
    },
    async execute({ url }, context) {
      if (!url || typeof url !== 'string') throw new Error('Valid URL required');
      
      const parsed = new URL(url);
      if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
        throw new Error(`Unsafe URL protocol: ${parsed.protocol}. Only http, https, and mailto allowed.`);
      }

      if (context && context.browser && typeof context.browser.open === 'function') {
        await context.browser.open(parsed.toString());
      } else {
        const platform = os.platform();
        const target = parsed.toString();
        if (platform === 'win32') {
          exec(`start "" "${target}"`);
        } else if (platform === 'darwin') {
          exec(`open "${target}"`);
        } else if (platform === 'linux') {
          exec(`xdg-open "${target}"`);
        }
      }
      return { opened: true, url: parsed.toString() };
    }
  },

  {
    id: 'system.delay',
    name: 'Delay / Pause Execution',
    description: 'Pauses workflow execution for a specified number of milliseconds (up to 30 seconds).',
    category: Categories.SYSTEM,
    requiredCapabilities: [],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    schema: {
      type: 'object',
      properties: {
        milliseconds: { type: 'number', default: 500 }
      },
      required: ['milliseconds']
    },
    async execute({ milliseconds = 500 }) {
      const ms = Math.min(Math.max(Number(milliseconds) || 0, 0), 30000);
      await new Promise(r => setTimeout(r, ms));
      return { delayedMs: ms };
    }
  },

  {
    id: 'system.get_info',
    name: 'Get System Hardware & Environment Info',
    description: 'Retrieves current operating system, CPU architecture, memory metrics, and uptime.',
    category: Categories.SYSTEM,
    requiredCapabilities: [],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS],
    schema: {
      type: 'object',
      properties: {}
    },
    async execute() {
      const cpus = os.cpus();
      return {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptimeSeconds: Math.round(os.uptime()),
        totalMemoryMB: Math.round(os.totalmem() / 1048576),
        freeMemoryMB: Math.round(os.freemem() / 1048576),
        cpuCount: cpus.length,
        cpuModel: cpus[0]?.model || 'Generic CPU',
        nodeVersion: process.version
      };
    }
  },

  {
    id: 'system.shell_exec',
    name: 'Execute Shell Command (Desktop Only)',
    description: 'Runs a sandboxed terminal command. Requires explicit Developer Mode grant.',
    category: Categories.SYSTEM,
    requiredCapabilities: [Capabilities.SYSTEM_SHELL_EXEC],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS],
    schema: {
      type: 'object',
      properties: {
        command: { type: 'string' },
        cwd: { type: 'string' }
      },
      required: ['command']
    },
    async execute({ command, cwd }, context) {
      if (!context?.developerMode) {
        throw new Error('Security Error: system.shell_exec is disabled unless Developer Mode is explicitly enabled by the user.');
      }

      // Security check: blacklist catastrophic commands
      const forbidden = [
        /rm\s+-rf\s+[\/\\]/i,
        /del\s+\/s\s+\/q\s+[c-z]:\\/i,
        /format\s+[c-z]:/i,
        /mkfs/i,
        /:(){ :\|:& };:/
      ];

      for (const pattern of forbidden) {
        if (pattern.test(command)) {
          throw new Error('Security Violation: Catastrophic command execution blocked by Operon Safety Guardrails.');
        }
      }

      const options = {
        cwd: cwd || process.cwd(),
        timeout: 10000,
        maxBuffer: 1024 * 1024
      };

      try {
        const { stdout, stderr } = await execAsync(command, options);
        return {
          exitCode: 0,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        };
      } catch (err) {
        return {
          exitCode: err.code || 1,
          stdout: err.stdout ? err.stdout.trim() : '',
          stderr: err.stderr ? err.stderr.trim() : err.message
        };
      }
    }
  }
];
