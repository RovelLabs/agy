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
      'remove tracking tokens', 'tracking parameters', 'tracking tokens', 'utm', 'fbclid',
      'clean copied link', 'strip query', 'cleen url', 'clean urll', 'yeet tracking',
      'очистить ссылку', 'очисти ссылку', 'убрать utm', 'убери utm', 'чистая ссылка', 'чистую ссылку',
      'очисти сцылку', 'выкинь мусор из ссылки', 'очистить трекинг', 'удали трекеры', 'ссылку без меток',
      'чистую сылку', 'трекинг', 'трекеры'
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
      'pretty-print json', 'fomrat jsn', 'json formatter', 'pretty print', 'minify json',
      'форматировать json', 'исправить json', 'валидация json', 'структурировать json',
      'расчеши jsonчик', 'форматни json', 'красивый json', 'выровняй json', 'json'
    ]
  },
  CHANGE_CASE: {
    id: 'intent.text.change_case',
    name: 'Transform Text Case',
    category: Categories.TEXT,
    requiredCapabilities: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
    targetRecipe: 'recipe_camel_case',
    keywords: [
      'camelcase', 'snake_case', 'kebab-case', 'uppercase', 'lowercase', 'change case', 'pascalcase',
      'convert to camelcase', 'convert to uppercase', 'capital letters',
      'в верблюжий регистр', 'в змеиный регистр', 'капсом', 'строчными буквами', 'все заглавные',
      'буквы заглавными', 'заглавными'
    ]
  },
  STRIP_FORMATTING: {
    id: 'intent.text.strip_formatting',
    name: 'Strip Rich Text and HTML Formatting',
    category: Categories.TEXT,
    requiredCapabilities: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
    targetRecipe: 'recipe_strip_formatting',
    keywords: [
      'strip formatting', 'remove html', 'plain text only', 'plain text', 'clean formatting',
      'strip tags', 'remove styles', 'clear formatting', 'strip markup',
      'убрать форматирование', 'очистить html', 'простой текст', 'удали разметку', 'только текст'
    ]
  },
  WORD_COUNT: {
    id: 'intent.text.word_count',
    name: 'Count Words and Reading Time',
    category: Categories.TEXT,
    requiredCapabilities: [Capabilities.CLIPBOARD_READ, Capabilities.NOTIFICATIONS_SEND],
    targetRecipe: 'recipe_word_count_stats',
    keywords: [
      'word count', 'count words', 'how many words', 'reading time', 'character count',
      'text stats', 'count characters', 'word stats',
      'посчитать слова', 'статистика текста', 'время чтения', 'сколько слов', 'посчитать символы',
      'подсчет знаков', 'посчитай букавы', 'статистика статьи'
    ]
  },
  SLUGIFY: {
    id: 'intent.text.slugify',
    name: 'Generate URL Slug',
    category: Categories.TEXT,
    requiredCapabilities: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
    targetRecipe: 'recipe_slugify_clipboard',
    keywords: [
      'slugify', 'generate slug', 'url slug', 'kebab slug', 'title to slug',
      'сделать слаг', 'слаг для статьи', 'ссылочный слаг', 'превратить в слаг',
      'слаг для заголовка', 'слаг'
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
      'organize downloads', 'sort folder', 'clean desktop', 'tidy folder', 'organize folder',
      'sort downloads', 'clean up desktop', 'sort files by category', 'organise folder',
      'messy desktop', 'tidy up',
      'разобрать загрузки', 'отсортировать папку', 'навести порядок', 'порядок в папке',
      'раскидай файлы', 'разложи по папкам', 'уберись на рабочем столе', 'сортировка файлов',
      'на рабочем столе'
    ]
  },
  COMPRESS_ZIP: {
    id: 'intent.file.compress_zip',
    name: 'Compress Files into ZIP Archive',
    category: Categories.FILE,
    requiredCapabilities: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE],
    targetRecipe: 'recipe_compress_folder_zip',
    keywords: [
      'zip files', 'zip archive', 'compress to archive', 'bundle files into zip', 'create zip',
      'make zip', 'zip up folder', 'compress directory',
      'заархивировать', 'создать zip', 'сжать файлы', 'сжать в архив', 'заархивируй',
      'заверни в zipчик', 'упаковать в архив', 'сделай архив', 'зазипуй'
    ]
  },
  RENAME_SCREENSHOTS: {
    id: 'intent.file.rename_screenshots',
    name: 'Batch Rename Screenshots by Date',
    category: Categories.FILE,
    requiredCapabilities: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE],
    targetRecipe: 'recipe_batch_rename_timestamp',
    keywords: [
      'rename screenshots', 'timestamp files', 'batch rename', 'rename files', 'sequential rename',
      'add date to files', 'batch rename photos',
      'переименовать файлы', 'добавить дату к файлам', 'переименование файлов', 'переименуй скриншоты',
      'пакетное переименование', 'пронумеруй файлы', 'скриншоты по дате', 'переименовать скриншоты'
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
      'strip exif', 'remove gps', 'scrub metadata', 'scrub photo metadata', 'remove camera data',
      'clean photo privacy', 'strip metadata from photos', 'delete geotags', 'nuke exif', 'exif tags',
      'очистить exif', 'удалить геопозицию', 'убрать метаданные', 'очистить геолокацию с фото',
      'сотри метаданные', 'убери геометки', 'очисти фото от геолокации', 'фотак', 'геометки'
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
      'compress pictures', 'shrink images', 'image compressor',
      'конвертировать в webp', 'сжать картинки', 'сжать фото', 'переведи в webp',
      'сожми пикчи', 'уменьши размер фото', 'оптимизируй картинки'
    ]
  },
  IMAGE_DIMENSIONS: {
    id: 'intent.image.dimensions',
    name: 'Inspect Image Dimensions',
    category: Categories.IMAGE,
    requiredCapabilities: [Capabilities.FILESYSTEM_READ],
    targetRecipe: 'recipe_image_dimensions',
    keywords: [
      'image dimensions', 'photo size', 'resolution of image', 'width height image',
      'размер картинки', 'разрешение фото', 'ширина и высота', 'разрешение картинки'
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
      'inspect jwt', 'decode token', 'jwt claims', 'decode jwt', 'jwt payload',
      'декодировать jwt', 'проверить токен', 'расшифруй jwt', 'посмотреть jwt токен',
      'jwt токена', 'токен jwt', 'jwt'
    ]
  },
  SHA256_HASH: {
    id: 'intent.dev.hash',
    name: 'Calculate SHA-256 Checksum',
    category: Categories.DEVELOPER,
    requiredCapabilities: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
    targetRecipe: 'recipe_sha256_hash',
    keywords: [
      'sha256', 'hash text', 'checksum', 'calculate hash', 'hash clipboard',
      'хэш sha256', 'вычислить хэш', 'посчитать чексумму', 'контрольная сумма'
    ]
  },
  SYSTEM_DIAGNOSTICS: {
    id: 'intent.system.diagnostics',
    name: 'Copy Hardware System Info',
    category: Categories.SYSTEM,
    requiredCapabilities: [Capabilities.CLIPBOARD_WRITE],
    targetRecipe: 'recipe_system_info_clipboard',
    keywords: [
      'system info', 'hardware specs', 'cpu memory', 'cpu stats', 'pc specs',
      'системная информация', 'характеристики пк', 'инфо о системе', 'параметры компа'
    ]
  }
};
