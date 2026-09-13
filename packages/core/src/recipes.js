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
  },

  {
    id: 'recipe_organize_folder',
    version: 1,
    name: 'Organize Folder into Categorized Subdirectories',
    description: 'Sorts messy folders (Downloads, Desktop) into clean subfolders (Images, Documents, Archives, Code, Media).',
    icon: 'FolderTree',
    category: Categories.FILE,
    platforms: [Platforms.WINDOWS, Platforms.MACOS],
    permissions: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'manual' },
    steps: [
      {
        id: 'organize',
        actionId: 'file.organize_directory',
        parameters: {
          directory: '${input.directory}',
          strategy: 'category',
          dryRun: false
        }
      },
      {
        id: 'notify',
        actionId: 'system.notify',
        parameters: {
          title: 'Folder Organized',
          message: 'Successfully sorted files into categorized folders.'
        }
      }
    ]
  },

  {
    id: 'recipe_compress_folder_zip',
    version: 1,
    name: 'Bundle Files into ZIP Archive',
    description: 'Compresses a list of selected files or dropped items into a compact ZIP archive.',
    icon: 'Archive',
    category: Categories.FILE,
    platforms: [Platforms.WINDOWS, Platforms.MACOS],
    permissions: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'file_drop' },
    steps: [
      {
        id: 'zip',
        actionId: 'file.compress_zip',
        parameters: {
          files: '${input.files}',
          outputPath: '${input.outputPath}'
        }
      },
      {
        id: 'notify',
        actionId: 'system.notify',
        parameters: {
          title: 'Archive Created',
          message: 'ZIP archive created successfully.'
        }
      }
    ]
  },

  {
    id: 'recipe_strip_formatting',
    version: 1,
    name: 'Strip Formatting & HTML to Plain Text',
    description: 'Cleans rich text, HTML markup, entities, and Markdown syntax from clipboard to pure text.',
    icon: 'FileText',
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
        actionId: 'text.strip_formatting',
        parameters: { text: '${steps.read_clip.text}' }
      },
      {
        id: 'write_clip',
        actionId: 'clipboard.write',
        parameters: { text: '${steps.clean.plainText}' }
      }
    ]
  },

  {
    id: 'recipe_slugify_clipboard',
    version: 1,
    name: 'Generate URL Slug from Clipboard',
    description: 'Converts heading or title text into a normalized, hyphen-separated URL slug.',
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
        id: 'slug',
        actionId: 'text.slugify',
        parameters: { text: '${steps.read_clip.text}', separator: '-' }
      },
      {
        id: 'write_clip',
        actionId: 'clipboard.write',
        parameters: { text: '${steps.slug.slug}' }
      }
    ]
  },

  {
    id: 'recipe_word_count_stats',
    version: 1,
    name: 'Calculate Word & Reading Stats',
    description: 'Counts words, characters, sentences, and estimates reading minutes from clipboard.',
    icon: 'BarChart',
    category: Categories.TEXT,
    platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    permissions: [Capabilities.CLIPBOARD_READ, Capabilities.NOTIFICATIONS_SEND],
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
        id: 'stats',
        actionId: 'text.word_count',
        parameters: { text: '${steps.read_clip.text}' }
      },
      {
        id: 'notify',
        actionId: 'system.notify',
        parameters: {
          title: 'Text Statistics',
          message: 'Words: ${steps.stats.words} | Characters: ${steps.stats.characters} | Reading: ${steps.stats.readingMinutes} min'
        }
      }
    ]
  },

  {
    id: 'recipe_extract_emails',
    version: 1,
    name: 'Extract All Emails from Text',
    description: 'Parses text, emails, or notes and extracts an audit-ready, unique list of email addresses.',
    icon: 'Mail',
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
        parameters: { text: '${steps.read_clip.text}', preset: 'email' }
      }
    ]
  },

  {
    id: 'recipe_extract_ips',
    version: 1,
    name: 'Extract IP Addresses from Text/Logs',
    description: 'Scans logs or terminal outputs and extracts IPv4 addresses for inspection.',
    icon: 'Network',
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
        id: 'extract',
        actionId: 'text.extract_regex',
        parameters: { text: '${steps.read_clip.text}', preset: 'ip' }
      }
    ]
  },

  {
    id: 'recipe_system_info_clipboard',
    version: 1,
    name: 'Copy System Hardware Info to Clipboard',
    description: 'Retrieves OS, CPU architecture, RAM, and uptime and copies a diagnostics report to clipboard.',
    icon: 'Cpu',
    category: Categories.SYSTEM,
    platforms: [Platforms.WINDOWS, Platforms.MACOS],
    permissions: [Capabilities.CLIPBOARD_WRITE],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'manual' },
    steps: [
      {
        id: 'info',
        actionId: 'system.get_info',
        parameters: {}
      },
      {
        id: 'format',
        actionId: 'text.template_render',
        parameters: {
          template: 'OS: {{platform}} {{release}} ({{arch}})\nCPU: {{cpuModel}} ({{cpuCount}} cores)\nRAM: {{freeMemoryMB}}MB free / {{totalMemoryMB}}MB total\nUptime: {{uptimeSeconds}}s',
          variables: '${steps.info}'
        }
      },
      {
        id: 'write_clip',
        actionId: 'clipboard.write',
        parameters: { text: '${steps.format.result}' }
      },
      {
        id: 'notify',
        actionId: 'system.notify',
        parameters: {
          title: 'System Info Copied',
          message: 'Hardware metrics written to clipboard.'
        }
      }
    ]
  },

  {
    id: 'recipe_quick_note',
    version: 1,
    name: 'Append Clipboard to Quick Notes',
    description: 'Appends current clipboard text with a timestamp to .operon/quick_notes.md.',
    icon: 'Notebook',
    category: Categories.TEXT,
    platforms: [Platforms.WINDOWS, Platforms.MACOS],
    permissions: [Capabilities.CLIPBOARD_READ, Capabilities.FILESYSTEM_WRITE],
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
        id: 'append',
        actionId: 'file.write_text',
        parameters: {
          filePath: '.operon/quick_notes.md',
          content: '\n\n---\n*Captured:* ${input.timestamp}\n${steps.read_clip.text}',
          append: true
        }
      },
      {
        id: 'notify',
        actionId: 'system.notify',
        parameters: {
          title: 'Quick Note Saved',
          message: 'Appended note to .operon/quick_notes.md'
        }
      }
    ]
  },

  {
    id: 'recipe_snake_case',
    version: 1,
    name: 'Convert Text to snake_case',
    description: 'Transforms words and phrases into lowercase snake_case notation.',
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
        parameters: { text: '${steps.read_clip.text}', targetCase: 'snake' }
      },
      {
        id: 'write_clip',
        actionId: 'clipboard.write',
        parameters: { text: '${steps.transform.result}' }
      }
    ]
  },

  {
    id: 'recipe_pascal_case',
    version: 1,
    name: 'Convert Text to PascalCase',
    description: 'Transforms words and phrases into PascalCase notation.',
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
        parameters: { text: '${steps.read_clip.text}', targetCase: 'pascal' }
      },
      {
        id: 'write_clip',
        actionId: 'clipboard.write',
        parameters: { text: '${steps.transform.result}' }
      }
    ]
  },

  {
    id: 'recipe_uppercase',
    version: 1,
    name: 'Convert Text to UPPERCASE',
    description: 'Transforms text to all uppercase characters.',
    icon: 'CaseUpper',
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
        parameters: { text: '${steps.read_clip.text}', targetCase: 'upper' }
      },
      {
        id: 'write_clip',
        actionId: 'clipboard.write',
        parameters: { text: '${steps.transform.result}' }
      }
    ]
  },

  {
    id: 'recipe_lowercase',
    version: 1,
    name: 'Convert Text to lowercase',
    description: 'Transforms text to all lowercase characters.',
    icon: 'CaseLower',
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
        parameters: { text: '${steps.read_clip.text}', targetCase: 'lower' }
      },
      {
        id: 'write_clip',
        actionId: 'clipboard.write',
        parameters: { text: '${steps.transform.result}' }
      }
    ]
  },

  {
    id: 'recipe_image_dimensions',
    version: 1,
    name: 'Inspect Image Dimensions & Format',
    description: 'Extracts resolution (width, height), aspect ratio, and binary format from an image file.',
    icon: 'Image',
    category: Categories.IMAGE,
    platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    permissions: [Capabilities.FILESYSTEM_READ, Capabilities.NOTIFICATIONS_SEND],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'file_drop' },
    steps: [
      {
        id: 'info',
        actionId: 'image.get_dimensions',
        parameters: { filePath: '${input.filePath}' }
      },
      {
        id: 'notify',
        actionId: 'system.notify',
        parameters: {
          title: 'Image Dimensions',
          message: 'Format: ${steps.info.format} | ${steps.info.width}x${steps.info.height} (Aspect: ${steps.info.aspectRatio})'
        }
      }
    ]
  },

  {
    id: 'recipe_open_docs',
    version: 1,
    name: 'Open Operon Documentation & Hub',
    description: 'Safely launches official local or web documentation hub in default browser.',
    icon: 'BookOpen',
    category: Categories.SYSTEM,
    platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    permissions: [Capabilities.SYSTEM_APP_LAUNCH],
    isBuiltIn: true,
    enabled: true,
    trigger: { type: 'manual' },
    steps: [
      {
        id: 'open',
        actionId: 'system.open_url',
        parameters: { url: 'https://operon.run/docs' }
      }
    ]
  }
];
