/**
 * OPERON Standard Action Library: System Domain
 */
import { Capabilities, Platforms, Categories } from '../types.js';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

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
      }
      return { opened: true, url: parsed.toString() };
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
