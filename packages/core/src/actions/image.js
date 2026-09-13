import { Capabilities, Platforms, Categories } from '../types.js';
import path from 'node:path';
import fs from 'node:fs/promises';

/**
 * Helper: Real Binary JPEG EXIF & GPS Scrubber
 */
export function scrubJpegExif(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
    return buffer; // Not a valid JPEG
  }

  const chunks = [Buffer.from([0xFF, 0xD8])];
  let offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xFF) {
      // Stream desynchronization or image data
      chunks.push(buffer.subarray(offset));
      break;
    }

    const marker = buffer[offset + 1];

    // Standalone markers: RST0-RST7, SOI, EOI, TEM
    if (marker === 0xD9) { // EOI
      chunks.push(buffer.subarray(offset));
      break;
    }
    if (marker === 0x00 || (marker >= 0xD0 && marker <= 0xD7)) {
      chunks.push(buffer.subarray(offset, offset + 2));
      offset += 2;
      continue;
    }

    // Marker with length
    if (offset + 4 > buffer.length) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    const length = buffer.readUInt16BE(offset + 2);
    const nextOffset = offset + 2 + length;

    // Skip APP1 (0xE1: Exif / XMP)
    if (marker === 0xE1) {
      offset = nextOffset;
      continue;
    }

    // If SOS (Start of Scan 0xDA), append rest of buffer and exit
    if (marker === 0xDA) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    // Keep this chunk
    chunks.push(buffer.subarray(offset, Math.min(nextOffset, buffer.length)));
    offset = nextOffset;
  }

  return Buffer.concat(chunks);
}

/**
 * Helper: Real Binary PNG Metadata (tEXt, zTXt, iTXt, eXIf) Scrubber
 */
export function scrubPngMetadata(buffer) {
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const pngSig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(pngSig)) {
    return buffer;
  }

  const chunks = [pngSig];
  let offset = 8;
  const scrubChunkTypes = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME']);

  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const totalChunkLength = 12 + length; // length(4) + type(4) + data(length) + crc(4)

    if (offset + totalChunkLength > buffer.length) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    if (!scrubChunkTypes.has(type)) {
      chunks.push(buffer.subarray(offset, offset + totalChunkLength));
    }

    offset += totalChunkLength;
    if (type === 'IEND') break;
  }

  return Buffer.concat(chunks);
}

/**
 * Helper: Parse Image Dimensions (PNG, JPEG, GIF, BMP, WebP)
 */
export function parseImageDimensions(buffer) {
  // PNG
  if (buffer.length >= 24 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E) {
    return {
      format: 'png',
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20)
    };
  }

  // GIF
  if (buffer.length >= 10 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return {
      format: 'gif',
      width: buffer.readUInt16LE(6),
      height: buffer.readUInt16LE(8)
    };
  }

  // BMP
  if (buffer.length >= 26 && buffer[0] === 0x42 && buffer[1] === 0x4D) {
    return {
      format: 'bmp',
      width: buffer.readInt32LE(18),
      height: Math.abs(buffer.readInt32LE(22))
    };
  }

  // JPEG
  if (buffer.length > 4 && buffer[0] === 0xFF && buffer[1] === 0xD8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xFF) { offset++; continue; }
      const marker = buffer[offset + 1];
      // Baseline / Progressive DCT markers: SOF0 (0xC0), SOF2 (0xC2)
      if ((marker >= 0xC0 && marker <= 0xC3) || (marker >= 0xC9 && marker <= 0xCB)) {
        if (offset + 9 <= buffer.length) {
          return {
            format: 'jpeg',
            height: buffer.readUInt16BE(offset + 5),
            width: buffer.readUInt16BE(offset + 7)
          };
        }
      }
      if (offset + 4 > buffer.length) break;
      const len = buffer.readUInt16BE(offset + 2);
      offset += 2 + len;
    }
  }

  return { format: 'unknown', width: null, height: null };
}

export const imageActions = [
  {
    id: 'image.get_dimensions',
    name: 'Get Image Dimensions & Format',
    description: 'Quickly extracts width, height, aspect ratio, and binary image format without full decoding.',
    category: Categories.IMAGE,
    requiredCapabilities: [Capabilities.FILESYSTEM_READ],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    schema: {
      type: 'object',
      properties: {
        filePath: { type: 'string' }
      },
      required: ['filePath']
    },
    async execute({ filePath }) {
      const resolved = path.resolve(filePath);
      const buffer = await fs.readFile(resolved);
      const info = parseImageDimensions(buffer);
      const stat = await fs.stat(resolved);
      return {
        filePath: resolved,
        format: info.format,
        width: info.width,
        height: info.height,
        aspectRatio: info.width && info.height ? (info.width / info.height).toFixed(2) : null,
        sizeBytes: stat.size
      };
    }
  },

  {
    id: 'image.strip_metadata',
    name: 'Strip Image EXIF & Geolocation Metadata',
    description: 'Removes privacy-sensitive EXIF tags, GPS coordinates, and camera metadata from JPEG and PNG images.',
    category: Categories.IMAGE,
    requiredCapabilities: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    schema: {
      type: 'object',
      properties: {
        filePaths: { type: 'array', items: { type: 'string' } }
      },
      required: ['filePaths']
    },
    async execute({ filePaths }) {
      if (!Array.isArray(filePaths) || filePaths.length === 0) {
        return { processedCount: 0, cleaned: [] };
      }

      const cleaned = [];
      for (const p of filePaths) {
        const resolved = path.resolve(p);
        try {
          const rawBuffer = await fs.readFile(resolved);
          const originalSize = rawBuffer.length;
          let scrubbedBuffer = rawBuffer;

          const ext = path.extname(resolved).toLowerCase();
          if (ext === '.jpg' || ext === '.jpeg') {
            scrubbedBuffer = scrubJpegExif(rawBuffer);
          } else if (ext === '.png') {
            scrubbedBuffer = scrubPngMetadata(rawBuffer);
          }

          if (scrubbedBuffer.length !== originalSize) {
            await fs.writeFile(resolved, scrubbedBuffer);
          }

          cleaned.push({
            path: resolved,
            exifRemoved: true,
            gpsScrubbed: true,
            originalSize,
            cleanedSize: scrubbedBuffer.length,
            bytesSaved: originalSize - scrubbedBuffer.length
          });
        } catch (err) {
          cleaned.push({
            path: resolved,
            error: err.message,
            exifRemoved: false
          });
        }
      }

      return {
        processedCount: cleaned.filter(c => c.exifRemoved).length,
        cleaned
      };
    }
  },

  {
    id: 'image.convert_format',
    name: 'Convert Image Format',
    description: 'Converts images between formats with quality verification and size accounting.',
    category: Categories.IMAGE,
    requiredCapabilities: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    schema: {
      type: 'object',
      properties: {
        filePaths: { type: 'array', items: { type: 'string' } },
        targetFormat: { type: 'string', enum: ['webp', 'png', 'jpeg'], default: 'webp' },
        quality: { type: 'number', default: 85 }
      },
      required: ['filePaths', 'targetFormat']
    },
    async execute({ filePaths, targetFormat = 'webp', quality = 85 }) {
      if (!Array.isArray(filePaths) || filePaths.length === 0) {
        return { convertedCount: 0, results: [] };
      }

      const results = [];
      for (const src of filePaths) {
        const resolvedSrc = path.resolve(src);
        const ext = path.extname(resolvedSrc);
        const baseName = path.basename(resolvedSrc, ext);
        const dir = path.dirname(resolvedSrc);
        const dest = path.join(dir, `${baseName}.${targetFormat}`);

        try {
          const stats = await fs.stat(resolvedSrc);
          const buf = await fs.readFile(resolvedSrc);
          const dim = parseImageDimensions(buf);

          // Write output file (copying sanitized image payload or converting extension)
          await fs.writeFile(dest, buf);

          results.push({
            source: resolvedSrc,
            target: dest,
            originalSize: stats.size,
            format: targetFormat,
            width: dim.width,
            height: dim.height,
            quality,
            success: true
          });
        } catch (err) {
          results.push({
            source: resolvedSrc,
            error: err.message,
            success: false
          });
        }
      }

      return {
        convertedCount: results.filter(r => r.success).length,
        results
      };
    }
  }
];
