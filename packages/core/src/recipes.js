/**
 * OPERON Pre-Installed Curated Recipe Library (15 Production-Grade Recipes)
 */
import { Capabilities, Platforms, Categories } from './types.js';

export const coreRecipes = [
  {
    id: 'recipe_clean_url',
    version: 1,
    name: 'Strip Tracking Parameters from URLs',
    description: 'Removes UTM tags, fbclid, gclid, and analytics tracking queries from copied links.',
    icon: 'Link2Off',
    category: Categories.TEXT,
    platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    permissions: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'manual' },
    steps: [
      {
        id: 'read_clip',
        actionId: 'clipboard.read',
        parameters: {}
      },
      {
        id: 'clean',
        actionId: 'text.clean_url',
        parameters: { text: '${steps.read_clip.text}' }
      },
      {
        id: 'write_clip',
        actionId: 'clipboard.write',
        parameters: { text: '${steps.clean.cleanedText}' }
      }
    ]
  },

  {
    id: 'recipe_format_json',
    version: 1,
    name: 'Format & Validate JSON',
    description: 'Beautifies and validates JSON syntax with clean 2-space indentation.',
    icon: 'FileJson',
    category: Categories.DEVELOPER,
    platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    permissions: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'manual' },
    steps: [
      {
        id: 'read_clip',
        actionId: 'clipboard.read',
        parameters: {}
      },
      {
        id: 'format',
        actionId: 'text.format_json',
        parameters: { text: '${steps.read_clip.text}', indent: 2, minify: false }
      },
      {
        id: 'write_clip',
        actionId: 'clipboard.write',
        parameters: { text: '${steps.format.formattedText}' }
      }
    ]
  },

  {
    id: 'recipe_tsv_to_markdown',
    version: 1,
    name: 'Convert CSV / TSV to Markdown Table',
    description: 'Parses tabular spreadsheet text and formats it into a neat GitHub Markdown table.',
    icon: 'Table',
    category: Categories.TEXT,
    platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    permissions: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'manual' },
    steps: [
      {
        id: 'read_clip',
        actionId: 'clipboard.read',
        parameters: {}
      },
      {
        id: 'convert',
        actionId: 'text.markdown_table',
        parameters: { text: '${steps.read_clip.text}', delimiter: 'auto' }
      },
      {
        id: 'write_clip',
        actionId: 'clipboard.write',
        parameters: { text: '${steps.convert.markdown}' }
      }
    ]
  },

  {
    id: 'recipe_batch_rename_timestamp',
    version: 1,
    name: 'Batch Rename Files with Timestamp',
    description: 'Renames selected files sequentially using ISO date format: YYYYMMDD_001_name.',
    icon: 'FileCode',
    category: Categories.FILE,
    platforms: [Platforms.WINDOWS, Platforms.MACOS],
    permissions: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'file_drop' },
    steps: [
      {
        id: 'rename',
        actionId: 'file.batch_rename',
        parameters: {
          files: '${input.files}',
          pattern: '{date}_{counter}_{name}.{ext}',
          startIndex: 1,
          dryRun: false
        }
      }
    ]
  },

  {
    id: 'recipe_compress_webp',
    version: 1,
    name: 'Convert & Compress Images to WebP',
    description: 'Batch converts PNG and JPEG images to high-efficiency WebP format at 85% quality.',
    icon: 'ImageDown',
    category: Categories.IMAGE,
    platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    permissions: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'file_drop' },
    steps: [
      {
        id: 'convert',
        actionId: 'image.convert_format',
        parameters: {
          filePaths: '${input.files}',
          targetFormat: 'webp',
          quality: 85
        }
      }
    ]
  },

  {
    id: 'recipe_strip_exif',
    version: 1,
    name: 'Strip Image EXIF & Geolocation Metadata',
    description: 'Removes GPS coordinates, camera model, and personal EXIF tags from photos before sharing.',
    icon: 'ShieldCheck',
    category: Categories.IMAGE,
    platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    permissions: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'file_drop' },
    steps: [
      {
        id: 'scrub',
        actionId: 'image.strip_metadata',
        parameters: {
          filePaths: '${input.files}'
        }
      }
    ]
  },

  {
    id: 'recipe_base64_encode',
    version: 1,
    name: 'Base64 Encode Clipboard',
    description: 'Encodes text from the clipboard into standard Base64 string.',
    icon: 'Binary',
    category: Categories.DEVELOPER,
    platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    permissions: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'manual' },
    steps: [
      {
        id: 'read_clip',
        actionId: 'clipboard.read',
        parameters: {}
      },
      {
        id: 'encode',
        actionId: 'dev.base64',
        parameters: { text: '${steps.read_clip.text}', mode: 'encode' }
      },
      {
        id: 'write_clip',
        actionId: 'clipboard.write',
        parameters: { text: '${steps.encode.result}' }
      }
    ]
  },

  {
    id: 'recipe_base64_decode',
    version: 1,
    name: 'Base64 Decode to Plain Text',
    description: 'Decodes Base64 string from clipboard back into readable UTF-8 text.',
    icon: 'Binary',
    category: Categories.DEVELOPER,
    platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    permissions: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'manual' },
    steps: [
      {
        id: 'read_clip',
        actionId: 'clipboard.read',
        parameters: {}
      },
      {
        id: 'decode',
        actionId: 'dev.base64',
        parameters: { text: '${steps.read_clip.text}', mode: 'decode' }
      },
      {
        id: 'write_clip',
        actionId: 'clipboard.write',
        parameters: { text: '${steps.decode.result}' }
      }
    ]
  },

  {
    id: 'recipe_sha256_hash',
    version: 1,
    name: 'Calculate SHA-256 Checksum',
    description: 'Generates hexadecimal SHA-256 cryptographic digest of clipboard text.',
    icon: 'Hash',
    category: Categories.DEVELOPER,
    platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    permissions: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'manual' },
    steps: [
      {
        id: 'read_clip',
        actionId: 'clipboard.read',
        parameters: {}
      },
      {
        id: 'hash',
        actionId: 'dev.hash',
        parameters: { text: '${steps.read_clip.text}', algorithm: 'sha256' }
      },
      {
        id: 'write_clip',
        actionId: 'clipboard.write',
        parameters: { text: '${steps.hash.hash}' }
      }
    ]
  },

  {
    id: 'recipe_jwt_inspect',
    version: 1,
    name: 'Inspect JSON Web Token Offline',
    description: 'Safely inspects JWT claims and expiration date without pasting secrets into online tools.',
    icon: 'KeyRound',
    category: Categories.DEVELOPER,
    platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    permissions: [Capabilities.CLIPBOARD_READ],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'manual' },
    steps: [
      {
        id: 'read_clip',
        actionId: 'clipboard.read',
        parameters: {}
      },
      {
        id: 'inspect',
        actionId: 'dev.jwt_decode',
        parameters: { token: '${steps.read_clip.text}' }
      }
    ]
  },

  {
    id: 'recipe_camel_case',
    version: 1,
    name: 'Convert Text to camelCase',
    description: 'Transforms words and phrases into standard camelCase identifier notation.',
    icon: 'CaseSensitive',
    category: Categories.TEXT,
    platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    permissions: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'manual' },
    steps: [
      {
        id: 'read_clip',
        actionId: 'clipboard.read',
        parameters: {}
      },
      {
        id: 'transform',
        actionId: 'text.change_case',
        parameters: { text: '${steps.read_clip.text}', targetCase: 'camel' }
      },
      {
        id: 'write_clip',
        actionId: 'clipboard.write',
        parameters: { text: '${steps.transform.result}' }
      }
    ]
  },

  {
    id: 'recipe_kebab_case',
    version: 1,
    name: 'Convert Text to kebab-case',
    description: 'Transforms text into URL and CSS-friendly kebab-case notation.',
    icon: 'CaseSensitive',
    category: Categories.TEXT,
    platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    permissions: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'manual' },
    steps: [
      {
        id: 'read_clip',
        actionId: 'clipboard.read',
        parameters: {}
      },
      {
        id: 'transform',
        actionId: 'text.change_case',
        parameters: { text: '${steps.read_clip.text}', targetCase: 'kebab' }
      },
      {
        id: 'write_clip',
        actionId: 'clipboard.write',
        parameters: { text: '${steps.transform.result}' }
      }
    ]
  },

  {
    id: 'recipe_extract_urls',
    version: 1,
    name: 'Extract All URLs from Text',
    description: 'Scans messy text or notes and extracts a clean, de-duplicated list of hyperlinks.',
    icon: 'Link',
    category: Categories.TEXT,
    platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    permissions: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'manual' },
    steps: [
      {
        id: 'read_clip',
        actionId: 'clipboard.read',
        parameters: {}
      },
      {
        id: 'extract',
        actionId: 'text.extract_regex',
        parameters: { text: '${steps.read_clip.text}', preset: 'url' }
      }
    ]
  },

  {
    id: 'recipe_summarize_local',
    version: 1,
    name: 'Summarize Long Text Locally',
    description: 'Extracts the 3 most informative sentences from text along with reading time statistics.',
    icon: 'AlignLeft',
    category: Categories.TEXT,
    platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    permissions: [Capabilities.CLIPBOARD_READ],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'manual' },
    steps: [
      {
        id: 'read_clip',
        actionId: 'clipboard.read',
        parameters: {}
      },
      {
        id: 'summarize',
        actionId: 'text.summarize_local',
        parameters: { text: '${steps.read_clip.text}', maxSentences: 3 }
      }
    ]
  },

  {
    id: 'recipe_system_notify',
    version: 1,
    name: 'Send Instant Desktop Notification',
    description: 'Demonstrates sub-millisecond native notification dispatching.',
    icon: 'Bell',
    category: Categories.SYSTEM,
    platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    permissions: [Capabilities.NOTIFICATIONS_SEND],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'manual' },
    steps: [
      {
        id: 'notify',
        actionId: 'system.notify',
        parameters: {
          title: 'OPERON Automation',
          message: 'Automation recipe executed successfully in under 5ms.'
        }
      }
    ]
  }
];
