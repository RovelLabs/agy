/**
 * OPERON Standard Action Library: Clipboard Domain
 */
import { Capabilities, Platforms, Categories } from '../types.js';

export const clipboardActions = [
  {
    id: 'clipboard.read',
    name: 'Read System Clipboard',
    description: 'Retrieves current text payload from system clipboard.',
    category: Categories.CLIPBOARD,
    requiredCapabilities: [Capabilities.CLIPBOARD_READ],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    schema: {
      type: 'object',
      properties: {}
    },
    async execute(_params, context) {
      if (context && context.clipboard && typeof context.clipboard.readText === 'function') {
        const text = await context.clipboard.readText();
        return { text: text || '', length: (text || '').length };
      }
      return { text: '', length: 0 };
    }
  },

  {
    id: 'clipboard.write',
    name: 'Write to System Clipboard',
    description: 'Writes transformed text directly to system clipboard.',
    category: Categories.CLIPBOARD,
    requiredCapabilities: [Capabilities.CLIPBOARD_WRITE],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string' }
      },
      required: ['text']
    },
    async execute({ text }, context) {
      const content = String(text ?? '');
      if (context && context.clipboard && typeof context.clipboard.writeText === 'function') {
        await context.clipboard.writeText(content);
      }
      return { success: true, text: content, length: content.length };
    }
  }
];
