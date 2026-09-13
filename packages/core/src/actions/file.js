/**
 * OPERON Standard Action Library: File Domain
 */
import { Capabilities, Platforms, Categories } from '../types.js';
import path from 'node:path';
import fs from 'node:fs/promises';

export const fileActions = [
  {
    id: 'file.batch_rename',
    name: 'Batch Rename Files',
    description: 'Renames files using dynamic tokens: {counter}, {date}, {name}, {ext}. Supports dry run preview.',
    category: Categories.FILE,
    requiredCapabilities: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS],
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string' } },
        pattern: { type: 'string', default: '{date}_{counter}_{name}.{ext}' },
        startIndex: { type: 'number', default: 1 },
        dryRun: { type: 'boolean', default: false }
      },
      required: ['files', 'pattern']
    },
    async execute({ files, pattern = '{date}_{counter}_{name}.{ext}', startIndex = 1, dryRun = false }) {
      if (!Array.isArray(files) || files.length === 0) {
        return { totalProcessed: 0, renames: [] };
      }

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const renames = [];

      let counter = startIndex;
      for (const filePath of files) {
        const dir = path.dirname(filePath);
        const ext = path.extname(filePath).replace(/^\./, '');
        const name = path.basename(filePath, path.extname(filePath));

        const counterStr = String(counter).padStart(3, '0');
        const newFileName = pattern
          .replace(/{date}/g, dateStr)
          .replace(/{counter}/g, counterStr)
          .replace(/{name}/g, name)
          .replace(/{ext}/g, ext);

        const targetPath = path.join(dir, newFileName);

        renames.push({
          source: filePath,
          target: targetPath,
          oldName: path.basename(filePath),
          newName: newFileName
        });

        if (!dryRun) {
          try {
            await fs.rename(filePath, targetPath);
          } catch (err) {
            // Record error on specific item
            renames[renames.length - 1].error = err.message;
          }
        }

        counter++;
      }

      return {
        dryRun,
        totalProcessed: renames.length,
        renames
      };
    }
  },

  {
    id: 'file.recycle',
    name: 'Safe Recycle / Trash Files',
    description: 'Moves files safely to a quarantine or trash location with undo rollback capability.',
    category: Categories.FILE,
    requiredCapabilities: [Capabilities.FILESYSTEM_RECYCLE],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS],
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string' } },
        dryRun: { type: 'boolean', default: false }
      },
      required: ['files']
    },
    async execute({ files, dryRun = false }, context) {
      if (!Array.isArray(files) || files.length === 0) {
        return { recycledCount: 0, items: [] };
      }

      const items = [];
      const quarantineDir = context?.quarantineDir || path.join(process.cwd(), '.operon_trash');

      if (!dryRun) {
        await fs.mkdir(quarantineDir, { recursive: true });
      }

      for (const f of files) {
        const fileName = path.basename(f);
        const targetPath = path.join(quarantineDir, `${Date.now()}_${fileName}`);
        items.push({ original: f, destination: targetPath });

        if (!dryRun) {
          try {
            await fs.rename(f, targetPath);
            items[items.length - 1].success = true;
          } catch (err) {
            items[items.length - 1].success = false;
            items[items.length - 1].error = err.message;
          }
        }
      }

      return {
        dryRun,
        recycledCount: items.filter(i => dryRun || i.success).length,
        items
      };
    }
  }
];
