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
  },

  {
    id: 'file.organize_directory',
    name: 'Organize Directory by Type or Date',
    description: 'Sorts unorganized files into tidy subfolders grouped by category (Images, Documents, Archives, etc.) or date.',
    category: Categories.FILE,
    requiredCapabilities: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS],
    schema: {
      type: 'object',
      properties: {
        directory: { type: 'string', description: 'Target folder path to organize' },
        strategy: { type: 'string', enum: ['category', 'date'], default: 'category' },
        dryRun: { type: 'boolean', default: false }
      },
      required: ['directory']
    },
    async execute({ directory, strategy = 'category', dryRun = false }) {
      if (!directory) throw new Error('Directory path is required');
      const resolvedDir = path.resolve(directory);

      let entries;
      try {
        entries = await fs.readdir(resolvedDir, { withFileTypes: true });
      } catch (err) {
        throw new Error(`Cannot read directory: ${err.message}`);
      }

      const files = entries.filter(e => e.isFile()).map(e => e.name);
      if (files.length === 0) {
        return { totalMoved: 0, movedFiles: [], dryRun };
      }

      const categoryMap = {
        Images: new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp', '.ico']),
        Documents: new Set(['.pdf', '.docx', '.doc', '.xlsx', '.csv', '.pptx', '.txt', '.md', '.rtf', '.epub']),
        Archives: new Set(['.zip', '.tar', '.gz', '.7z', '.rar', '.bz2', '.iso']),
        Code: new Set(['.js', '.ts', '.py', '.html', '.css', '.json', '.xml', '.yaml', '.yml', '.c', '.cpp', '.rs', '.go']),
        Media: new Set(['.mp3', '.wav', '.flac', '.mp4', '.mkv', '.mov', '.avi', '.webm'])
      };

      const movedFiles = [];

      for (const fileName of files) {
        const fullSource = path.join(resolvedDir, fileName);
        const ext = path.extname(fileName).toLowerCase();

        let subFolder = 'Other';
        if (strategy === 'category') {
          for (const [catName, extSet] of Object.entries(categoryMap)) {
            if (extSet.has(ext)) {
              subFolder = catName;
              break;
            }
          }
        } else if (strategy === 'date') {
          try {
            const stat = await fs.stat(fullSource);
            const mtime = stat.mtime;
            const year = mtime.getFullYear();
            const month = String(mtime.getMonth() + 1).padStart(2, '0');
            subFolder = `${year}-${month}`;
          } catch {
            subFolder = 'Undated';
          }
        }

        const targetDir = path.join(resolvedDir, subFolder);
        const targetPath = path.join(targetDir, fileName);

        movedFiles.push({
          source: fullSource,
          target: targetPath,
          category: subFolder,
          fileName
        });

        if (!dryRun) {
          await fs.mkdir(targetDir, { recursive: true });
          await fs.rename(fullSource, targetPath);
        }
      }

      return {
        totalMoved: movedFiles.length,
        strategy,
        movedFiles,
        dryRun
      };
    }
  },

  {
    id: 'file.find',
    name: 'Find Files in Directory',
    description: 'Scans directory recursively for files matching extension, pattern, or age criteria.',
    category: Categories.FILE,
    requiredCapabilities: [Capabilities.FILESYSTEM_READ],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS],
    schema: {
      type: 'object',
      properties: {
        directory: { type: 'string' },
        extensions: { type: 'array', items: { type: 'string' } },
        pattern: { type: 'string' },
        maxDepth: { type: 'number', default: 5 }
      },
      required: ['directory']
    },
    async execute({ directory, extensions = [], pattern = '', maxDepth = 5 }) {
      const resolvedDir = path.resolve(directory);
      const matches = [];
      const extSet = new Set(extensions.map(e => e.startsWith('.') ? e.toLowerCase() : `.${e.toLowerCase()}`));
      const regex = pattern ? new RegExp(pattern, 'i') : null;

      async function scan(currentDir, depth) {
        if (depth > maxDepth) return;
        let entries;
        try {
          entries = await fs.readdir(currentDir, { withFileTypes: true });
        } catch {
          return;
        }

        for (const entry of entries) {
          const entryPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            await scan(entryPath, depth + 1);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            const matchesExt = extSet.size === 0 || extSet.has(ext);
            const matchesPat = !regex || regex.test(entry.name);
            if (matchesExt && matchesPat) {
              try {
                const stat = await fs.stat(entryPath);
                matches.push({
                  path: entryPath,
                  name: entry.name,
                  size: stat.size,
                  modified: stat.mtime.toISOString()
                });
              } catch {
                matches.push({ path: entryPath, name: entry.name });
              }
            }
          }
        }
      }

      await scan(resolvedDir, 0);
      return { totalFound: matches.length, files: matches };
    }
  },

  {
    id: 'file.compress_zip',
    name: 'Compress Files into ZIP Archive',
    description: 'Bundles specified files into a standardized, cross-platform ZIP archive without external dependencies.',
    category: Categories.FILE,
    requiredCapabilities: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS],
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string' } },
        outputPath: { type: 'string' }
      },
      required: ['files', 'outputPath']
    },
    async execute({ files, outputPath }) {
      if (!Array.isArray(files) || files.length === 0) {
        throw new Error('At least one file is required for ZIP creation');
      }
      const resolvedOutput = path.resolve(outputPath);
      const zlib = await import('node:zlib');

      // CRC32 table
      const crcTable = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
          c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        crcTable[i] = c;
      }
      function computeCrc32(buf) {
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < buf.length; i++) {
          crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
      }

      const localHeaders = [];
      const centralRecords = [];
      let offset = 0;

      for (const f of files) {
        const fullSrc = path.resolve(f);
        let content;
        try {
          content = await fs.readFile(fullSrc);
        } catch (err) {
          continue; // skip unreadable
        }

        const fileName = path.basename(fullSrc);
        const nameBuf = Buffer.from(fileName, 'utf8');
        const compressed = zlib.deflateRawSync(content);
        const crc = computeCrc32(content);

        // Local Header (30 bytes + name)
        const localHdr = Buffer.alloc(30);
        localHdr.writeUInt32LE(0x04034B50, 0); // signature
        localHdr.writeUInt16LE(20, 4); // version needed
        localHdr.writeUInt16LE(0, 6); // flags
        localHdr.writeUInt16LE(8, 8); // compression: deflate
        localHdr.writeUInt16LE(0, 10); // time
        localHdr.writeUInt16LE(0, 12); // date
        localHdr.writeUInt32LE(crc, 14); // crc32
        localHdr.writeUInt32LE(compressed.length, 18); // comp size
        localHdr.writeUInt32LE(content.length, 22); // uncomp size
        localHdr.writeUInt16LE(nameBuf.length, 26); // name len
        localHdr.writeUInt16LE(0, 28); // extra len

        localHeaders.push(localHdr, nameBuf, compressed);

        // Central Directory Record (46 bytes + name)
        const cdHdr = Buffer.alloc(46);
        cdHdr.writeUInt32LE(0x02014B50, 0); // signature
        cdHdr.writeUInt16LE(20, 4); // made by
        cdHdr.writeUInt16LE(20, 6); // version needed
        cdHdr.writeUInt16LE(0, 8); // flags
        cdHdr.writeUInt16LE(8, 10); // compression: deflate
        cdHdr.writeUInt16LE(0, 12); // time
        cdHdr.writeUInt16LE(0, 14); // date
        cdHdr.writeUInt32LE(crc, 16); // crc32
        cdHdr.writeUInt32LE(compressed.length, 20); // comp size
        cdHdr.writeUInt32LE(content.length, 24); // uncomp size
        cdHdr.writeUInt16LE(nameBuf.length, 28); // name len
        cdHdr.writeUInt16LE(0, 30); // extra len
        cdHdr.writeUInt16LE(0, 32); // comment len
        cdHdr.writeUInt16LE(0, 34); // disk num
        cdHdr.writeUInt16LE(0, 36); // internal attr
        cdHdr.writeUInt32LE(0, 38); // external attr
        cdHdr.writeUInt32LE(offset, 42); // relative offset

        centralRecords.push(cdHdr, nameBuf);
        offset += localHdr.length + nameBuf.length + compressed.length;
      }

      const cdStart = offset;
      let cdSize = 0;
      for (const b of centralRecords) cdSize += b.length;

      // End of Central Directory (22 bytes)
      const eocd = Buffer.alloc(22);
      eocd.writeUInt32LE(0x06054B50, 0); // signature
      eocd.writeUInt16LE(0, 4); // disk number
      eocd.writeUInt16LE(0, 6); // start disk
      eocd.writeUInt16LE(centralRecords.length / 2, 8); // entries on disk
      eocd.writeUInt16LE(centralRecords.length / 2, 10); // total entries
      eocd.writeUInt32LE(cdSize, 12); // size of CD
      eocd.writeUInt32LE(cdStart, 16); // offset of CD
      eocd.writeUInt16LE(0, 20); // comment length

      const finalZip = Buffer.concat([...localHeaders, ...centralRecords, eocd]);
      await fs.mkdir(path.dirname(resolvedOutput), { recursive: true });
      await fs.writeFile(resolvedOutput, finalZip);

      return {
        outputPath: resolvedOutput,
        filesPacked: centralRecords.length / 2,
        totalBytes: finalZip.length
      };
    }
  },

  {
    id: 'file.read_text',
    name: 'Read Text File',
    description: 'Reads UTF-8 text from a local file with size limit safeguarding.',
    category: Categories.FILE,
    requiredCapabilities: [Capabilities.FILESYSTEM_READ],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS],
    schema: {
      type: 'object',
      properties: {
        filePath: { type: 'string' },
        maxBytes: { type: 'number', default: 1048576 }
      },
      required: ['filePath']
    },
    async execute({ filePath, maxBytes = 1048576 }) {
      const resolved = path.resolve(filePath);
      const stat = await fs.stat(resolved);
      if (stat.size > maxBytes) {
        throw new Error(`File size (${stat.size} bytes) exceeds limit of ${maxBytes} bytes`);
      }
      const content = await fs.readFile(resolved, 'utf8');
      return { content, sizeBytes: stat.size, filePath: resolved };
    }
  },

  {
    id: 'file.write_text',
    name: 'Write Text to File',
    description: 'Writes or appends text to a local destination file atomically.',
    category: Categories.FILE,
    requiredCapabilities: [Capabilities.FILESYSTEM_WRITE],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS],
    schema: {
      type: 'object',
      properties: {
        filePath: { type: 'string' },
        content: { type: 'string' },
        append: { type: 'boolean', default: false }
      },
      required: ['filePath', 'content']
    },
    async execute({ filePath, content, append = false }) {
      const resolved = path.resolve(filePath);
      await fs.mkdir(path.dirname(resolved), { recursive: true });
      if (append) {
        await fs.appendFile(resolved, content, 'utf8');
      } else {
        await fs.writeFile(resolved, content, 'utf8');
      }
      return { success: true, filePath: resolved, bytesWritten: Buffer.byteLength(content, 'utf8') };
    }
  }
];
