/**
 * OPERON Intent Taxonomy & Training Dataset Schemas
 * Standardized intent definitions for Local SLM & Deterministic NLP Rules
 */
import { Categories, Capabilities, Platforms } from '../../packages/core/src/types.js';

export const IntentTaxonomy = {
  // 1. Text & Clipboard Intents
  URL_CLEAN: {
    id: 'intent.url.clean',
    name: 'Clean URL Tracking Tokens',
    category: Categories.TEXT,
    requiredCapabilities: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
    targetRecipe: 'recipe_clean_url',
    keywords: [
      'clean url', 'clean link', 'clean all tracking', 'strip tracking', 'remove utm',
      'remove tracking tokens', 'tracking parameters', 'tracking tokens', 'utm',
      'очистить ссылку', 'очисти ссылку', 'убрать utm', 'убери utm', 'чистая ссылка', 'чистую ссылку'
    ]
  },
  FORMAT_JSON: {
    id: 'intent.text.format_json',
    name: 'Format and Beautify JSON',
    category: Categories.DEVELOPER,
    requiredCapabilities: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
    targetRecipe: 'recipe_format_json',
    keywords: [
      'format json', 'beautify json', 'pretty json', 'validate json', 'indent json',
      'форматировать json', 'исправить json', 'валидация json', 'структурировать json'
    ]
  },
  CHANGE_CASE: {
    id: 'intent.text.change_case',
    name: 'Transform Text Case',
    category: Categories.TEXT,
    requiredCapabilities: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
    targetRecipe: 'recipe_camel_case',
    keywords: [
      'camelcase', 'snake_case', 'kebab-case', 'uppercase', 'lowercase',
      'в верблюжий регистр', 'в змеиный регистр'
    ]
  },
  STRIP_FORMATTING: {
    id: 'intent.text.strip_formatting',
    name: 'Strip Rich Text and HTML Formatting',
    category: Categories.TEXT,
    requiredCapabilities: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
    targetRecipe: 'recipe_strip_formatting',
    keywords: [
      'strip formatting', 'remove html', 'plain text only', 'plain text',
      'убрать форматирование', 'очистить html', 'простой текст'
    ]
  },
  WORD_COUNT: {
    id: 'intent.text.word_count',
    name: 'Count Words and Reading Time',
    category: Categories.TEXT,
    requiredCapabilities: [Capabilities.CLIPBOARD_READ, Capabilities.NOTIFICATIONS_SEND],
    targetRecipe: 'recipe_word_count_stats',
    keywords: [
      'word count', 'count words', 'how many words', 'reading time',
      'посчитать слова', 'статистика текста', 'время чтения'
    ]
  },

  // 2. File & Directory Intents
  ORGANIZE_DOWNLOADS: {
    id: 'intent.file.organize_downloads',
    name: 'Organize Downloads or Target Folder',
    category: Categories.FILE,
    requiredCapabilities: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE],
    targetRecipe: 'recipe_organize_folder',
    keywords: [
      'organize downloads', 'sort folder', 'clean desktop',
      'разобрать загрузки', 'отсортировать папку', 'навести порядок', 'порядок в папке'
    ]
  },
  COMPRESS_ZIP: {
    id: 'intent.file.compress_zip',
    name: 'Compress Files into ZIP Archive',
    category: Categories.FILE,
    requiredCapabilities: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE],
    targetRecipe: 'recipe_compress_folder_zip',
    keywords: [
      'zip files', 'zip archive', 'compress to archive', 'bundle files into zip',
      'заархивировать', 'создать zip', 'сжать файлы', 'сжать в архив'
    ]
  },
  RENAME_SCREENSHOTS: {
    id: 'intent.file.rename_screenshots',
    name: 'Batch Rename Screenshots by Date',
    category: Categories.FILE,
    requiredCapabilities: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE],
    targetRecipe: 'recipe_batch_rename_timestamp',
    keywords: [
      'rename screenshots', 'timestamp files', 'batch rename', 'rename files',
      'переименовать файлы', 'добавить дату к файлам', 'переименование файлов'
    ]
  },

  // 3. Image Intents
  STRIP_EXIF: {
    id: 'intent.image.strip_exif',
    name: 'Scrub Photo EXIF and GPS Geolocation',
    category: Categories.IMAGE,
    requiredCapabilities: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE],
    targetRecipe: 'recipe_strip_exif',
    keywords: [
      'strip exif', 'remove gps', 'scrub metadata', 'scrub photo metadata',
      'очистить exif', 'удалить геопозицию', 'убрать метаданные'
    ]
  },
  CONVERT_WEBP: {
    id: 'intent.image.convert_webp',
    name: 'Convert Images to WebP',
    category: Categories.IMAGE,
    requiredCapabilities: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE],
    targetRecipe: 'recipe_compress_webp',
    keywords: [
      'convert to webp', 'convert photos to webp', 'compress images to webp', 'png to webp', 'webp',
      'конвертировать в webp', 'сжать картинки', 'сжать фото'
    ]
  },

  // 4. Developer & System Intents
  JWT_INSPECT: {
    id: 'intent.dev.jwt_inspect',
    name: 'Inspect JWT Offline',
    category: Categories.DEVELOPER,
    requiredCapabilities: [Capabilities.CLIPBOARD_READ],
    targetRecipe: 'recipe_jwt_inspect',
    keywords: [
      'inspect jwt', 'decode token', 'jwt claims', 'декодировать jwt', 'проверить токен'
    ]
  },
  SYSTEM_DIAGNOSTICS: {
    id: 'intent.system.diagnostics',
    name: 'Copy Hardware System Info',
    category: Categories.SYSTEM,
    requiredCapabilities: [Capabilities.CLIPBOARD_WRITE],
    targetRecipe: 'recipe_system_info_clipboard',
    keywords: [
      'system info', 'hardware specs', 'cpu memory', 'cpu stats',
      'системная информация', 'характеристики пк'
    ]
  }
};
