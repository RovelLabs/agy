/**
 * OPERON Multilingual AI Intent Evaluation Benchmark Dataset
 * 40 annotated prompt-to-intent evaluation pairs (20 English, 20 Russian)
 */

export const EvaluationDataset = [
  // ENGLISH DATASET (20 Cases)
  { prompt: 'Clean all tracking parameters from copied link', expectedCategory: 'text', expectedAction: 'text.clean_url' },
  { prompt: 'Strip utm parameters and fbclid from URL', expectedCategory: 'text', expectedAction: 'text.clean_url' },
  { prompt: 'Remove tracking tokens and copy clean link', expectedCategory: 'text', expectedAction: 'text.clean_url' },
  { prompt: 'Format and indent messy JSON from clipboard', expectedCategory: 'developer', expectedAction: 'text.format_json' },
  { prompt: 'Validate JSON syntax and pretty print with 2 spaces', expectedCategory: 'developer', expectedAction: 'text.format_json' },
  { prompt: 'Organize downloads folder by file types', expectedCategory: 'file', expectedAction: 'file.organize_directory' },
  { prompt: 'Clean desktop and sort files into folders', expectedCategory: 'file', expectedAction: 'file.organize_directory' },
  { prompt: 'Sort folder into documents images and code', expectedCategory: 'file', expectedAction: 'file.organize_directory' },
  { prompt: 'Zip files into a compressed archive', expectedCategory: 'file', expectedAction: 'file.compress_zip' },
  { prompt: 'Create zip archive from selected items', expectedCategory: 'file', expectedAction: 'file.compress_zip' },
  { prompt: 'Bundle files into zip archive', expectedCategory: 'file', expectedAction: 'file.compress_zip' },
  { prompt: 'Batch rename files with timestamp counter', expectedCategory: 'file', expectedAction: 'file.batch_rename' },
  { prompt: 'Rename screenshots sequentially by date', expectedCategory: 'file', expectedAction: 'file.batch_rename' },
  { prompt: 'Strip exif metadata and gps location from photos', expectedCategory: 'image', expectedAction: 'image.strip_metadata' },
  { prompt: 'Remove gps tags from images before sharing', expectedCategory: 'image', expectedAction: 'image.strip_metadata' },
  { prompt: 'Convert photos to webp at 85% quality', expectedCategory: 'image', expectedAction: 'image.convert_format' },
  { prompt: 'Compress images to webp format', expectedCategory: 'image', expectedAction: 'image.convert_format' },
  { prompt: 'Strip formatting and HTML markup from clipboard', expectedCategory: 'text', expectedAction: 'text.strip_formatting' },
  { prompt: 'Count words and estimate reading time in text', expectedCategory: 'text', expectedAction: 'text.word_count' },
  { prompt: 'Copy system hardware specs and cpu memory info', expectedCategory: 'system', expectedAction: 'system.get_info' },

  // RUSSIAN DATASET (20 Cases)
  { prompt: 'Очисти ссылку от utm меток и трекинга', expectedCategory: 'text', expectedAction: 'text.clean_url' },
  { prompt: 'Убери utm параметры и fbclid из скопированной ссылки', expectedCategory: 'text', expectedAction: 'text.clean_url' },
  { prompt: 'Сделай чистую ссылку без хвостов отслеживания', expectedCategory: 'text', expectedAction: 'text.clean_url' },
  { prompt: 'Форматировать json с отступами в 2 пробела', expectedCategory: 'developer', expectedAction: 'text.format_json' },
  { prompt: 'Валидация json и красивый вывод', expectedCategory: 'developer', expectedAction: 'text.format_json' },
  { prompt: 'Разобрать загрузки по категориям файлов', expectedCategory: 'file', expectedAction: 'file.organize_directory' },
  { prompt: 'Отсортировать папку на рабочем столе', expectedCategory: 'file', expectedAction: 'file.organize_directory' },
  { prompt: 'Наведи порядок в папке загрузок', expectedCategory: 'file', expectedAction: 'file.organize_directory' },
  { prompt: 'Заархивировать выбранные файлы в zip', expectedCategory: 'file', expectedAction: 'file.compress_zip' },
  { prompt: 'Создать zip архив из файлов', expectedCategory: 'file', expectedAction: 'file.compress_zip' },
  { prompt: 'Сжать в архив папку с документами', expectedCategory: 'file', expectedAction: 'file.compress_zip' },
  { prompt: 'Переименовать файлы с добавлением даты и счетчика', expectedCategory: 'file', expectedAction: 'file.batch_rename' },
  { prompt: 'Пакетное переименование файлов с таймстемпом', expectedCategory: 'file', expectedAction: 'file.batch_rename' },
  { prompt: 'Очистить exif и геопозицию с фотографий', expectedCategory: 'image', expectedAction: 'image.strip_metadata' },
  { prompt: 'Удалить геопозицию и метаданные с фото', expectedCategory: 'image', expectedAction: 'image.strip_metadata' },
  { prompt: 'Убрать метаданные с картинок перед отправкой', expectedCategory: 'image', expectedAction: 'image.strip_metadata' },
  { prompt: 'Конвертировать в webp и сжать картинки', expectedCategory: 'image', expectedAction: 'image.convert_format' },
  { prompt: 'Сжать фото в формат webp', expectedCategory: 'image', expectedAction: 'image.convert_format' },
  { prompt: 'Убрать форматирование и html теги из буфера', expectedCategory: 'text', expectedAction: 'text.strip_formatting' },
  { prompt: 'Посчитать слова и статистику чтения для текста', expectedCategory: 'text', expectedAction: 'text.word_count' }
];
