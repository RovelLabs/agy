/**
 * OPERON Standard Action Library: Text Domain
 */
import { Capabilities, Platforms, Categories } from '../types.js';

export const textActions = [
  {
    id: 'text.clean_url',
    name: 'Clean URL Tracking Parameters',
    description: 'Strips UTM tokens, tracking IDs (fbclid, gclid, etc.), and clean redirects.',
    category: Categories.TEXT,
    requiredCapabilities: [],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Input URL or text containing URLs' }
      },
      required: ['text']
    },
    async execute({ text }) {
      if (!text || typeof text !== 'string') return { cleanedText: '', modified: false };
      
      const trackingParams = new Set([
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'gclsrc', 'dclid', 'zanpid', 'msclkid', 'mc_eid',
        '_hsenc', '_hsmi', 'mkt_tok', 'igshid', 'si', 'feature', 'ref_src'
      ]);

      const urlRegex = /(https?:\/\/[^\s]+)/g;
      let modified = false;

      const cleaned = text.replace(urlRegex, (urlStr) => {
        try {
          const url = new URL(urlStr);
          let changed = false;
          for (const param of Array.from(url.searchParams.keys())) {
            if (trackingParams.has(param.toLowerCase())) {
              url.searchParams.delete(param);
              changed = true;
            }
          }
          if (changed) {
            modified = true;
            return url.toString();
          }
          return urlStr;
        } catch {
          return urlStr;
        }
      });

      return { cleanedText: cleaned, modified };
    }
  },

  {
    id: 'text.format_json',
    name: 'Format & Validate JSON',
    description: 'Validates and formats JSON with custom indent or minification.',
    category: Categories.TEXT,
    requiredCapabilities: [],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Raw JSON string' },
        indent: { type: 'number', default: 2 },
        minify: { type: 'boolean', default: false }
      },
      required: ['text']
    },
    async execute({ text, indent = 2, minify = false }) {
      try {
        const parsed = JSON.parse(text);
        const formatted = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);
        return {
          success: true,
          formattedText: formatted,
          byteSize: Buffer.byteLength(formatted, 'utf8'),
          keyCount: typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 1
        };
      } catch (err) {
        throw new Error(`Invalid JSON syntax: ${err.message}`);
      }
    }
  },

  {
    id: 'text.change_case',
    name: 'Change Text Case',
    description: 'Transforms text case to camelCase, snake_case, kebab-case, Title Case, UPPERCASE, or lowercase.',
    category: Categories.TEXT,
    requiredCapabilities: [],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        targetCase: {
          type: 'string',
          enum: ['camel', 'snake', 'kebab', 'title', 'upper', 'lower', 'pascal']
        }
      },
      required: ['text', 'targetCase']
    },
    async execute({ text, targetCase }) {
      if (!text) return { result: '' };

      const words = text
        .trim()
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[-_]+/g, ' ')
        .split(/\s+/);

      let result = '';
      switch (targetCase) {
        case 'upper':
          result = text.toUpperCase();
          break;
        case 'lower':
          result = text.toLowerCase();
          break;
        case 'title':
          result = words
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
          break;
        case 'camel':
          result = words
            .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join('');
          break;
        case 'pascal':
          result = words
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join('');
          break;
        case 'snake':
          result = words.map(w => w.toLowerCase()).join('_');
          break;
        case 'kebab':
          result = words.map(w => w.toLowerCase()).join('-');
          break;
        default:
          result = text;
      }

      return { result };
    }
  },

  {
    id: 'text.markdown_table',
    name: 'Convert TSV/CSV to Markdown Table',
    description: 'Converts tab-separated or comma-separated tabular text into a formatted Markdown table.',
    category: Categories.TEXT,
    requiredCapabilities: [],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        delimiter: { type: 'string', default: 'auto' }
      },
      required: ['text']
    },
    async execute({ text, delimiter = 'auto' }) {
      if (!text || !text.trim()) return { markdown: '' };

      const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length === 0) return { markdown: '' };

      let delim = delimiter;
      if (delim === 'auto') {
        const firstLine = lines[0];
        if (firstLine.includes('\t')) delim = '\t';
        else if (firstLine.includes(';')) delim = ';';
        else if (firstLine.includes(',')) delim = ',';
        else delim = /\s{2,}/;
      }

      const rows = lines.map(line => 
        (typeof delim === 'string' ? line.split(delim) : line.split(delim)).map(c => c.trim())
      );

      const colCount = Math.max(...rows.map(r => r.length));
      if (colCount === 0) return { markdown: '' };

      // Normalize row widths
      const normalizedRows = rows.map(row => {
        while (row.length < colCount) row.push('');
        return row;
      });

      const header = `| ${normalizedRows[0].join(' | ')} |`;
      const separator = `| ${new Array(colCount).fill('---').join(' | ')} |`;
      const dataRows = normalizedRows.slice(1).map(r => `| ${r.join(' | ')} |`);

      const markdown = [header, separator, ...dataRows].join('\n');
      return { markdown, rowCount: rows.length, columnCount: colCount };
    }
  },

  {
    id: 'text.extract_regex',
    name: 'Extract Pattern Matches',
    description: 'Extracts emails, URLs, IP addresses, or custom regex patterns from input text.',
    category: Categories.TEXT,
    requiredCapabilities: [],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        preset: { type: 'string', enum: ['email', 'url', 'ip', 'custom'], default: 'url' },
        customPattern: { type: 'string' }
      },
      required: ['text']
    },
    async execute({ text, preset = 'url', customPattern }) {
      if (!text) return { matches: [], count: 0 };

      let regex;
      switch (preset) {
        case 'email':
          regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          break;
        case 'url':
          regex = /https?:\/\/[^\s"'<>]+/g;
          break;
        case 'ip':
          regex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
          break;
        case 'custom':
          if (!customPattern) throw new Error('customPattern is required when preset is custom');
          regex = new RegExp(customPattern, 'g');
          break;
        default:
          regex = /https?:\/\/[^\s]+/g;
      }

      const matches = Array.from(new Set(text.match(regex) || []));
      return { matches, count: matches.length };
    }
  },

  {
    id: 'text.summarize_local',
    name: 'Local Heuristic Text Summarizer',
    description: 'Deterministic offline text summary extracting key salient sentences and readability metrics.',
    category: Categories.TEXT,
    requiredCapabilities: [],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        maxSentences: { type: 'number', default: 3 }
      },
      required: ['text']
    },
    async execute({ text, maxSentences = 3 }) {
      if (!text || text.trim().length === 0) {
        return { summary: '', sentenceCount: 0, wordCount: 0, readingTimeSeconds: 0 };
      }

      const rawSentences = text
        .split(/(?<=[.?!])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 15);

      const words = text.toLowerCase().match(/\b[a-zA-Zа-яА-Я0-9_]{3,}\b/g) || [];
      const wordCount = words.length;

      // Frequency map (skipping common stopwords)
      const stopWords = new Set([
        'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but', 'his', 'from', 'they', 'say',
        'her', 'she', 'will', 'one', 'all', 'would', 'there', 'their', 'what', 'out', 'about', 'who', 'get', 'which',
        'это', 'как', 'так', 'для', 'что', 'или', 'если', 'все', 'его', 'был', 'при', 'том', 'только', 'после'
      ]);

      const freq = {};
      for (const w of words) {
        if (!stopWords.has(w)) {
          freq[w] = (freq[w] || 0) + 1;
        }
      }

      // Score sentences based on word salience
      const scored = rawSentences.map((sentence, index) => {
        const sentenceWords = sentence.toLowerCase().match(/\b[a-zA-Zа-яА-Я0-9_]{3,}\b/g) || [];
        let score = 0;
        for (const sw of sentenceWords) {
          score += freq[sw] || 0;
        }
        // Normalize by sentence length to avoid bias towards run-ons
        const normalizedScore = sentenceWords.length > 0 ? score / Math.sqrt(sentenceWords.length) : 0;
        return { sentence, index, score: normalizedScore };
      });

      // Sort by score descending and take top N
      scored.sort((a, b) => b.score - a.score);
      const topSentences = scored.slice(0, maxSentences);
      // Re-order chronologically
      topSentences.sort((a, b) => a.index - b.index);

      const summary = topSentences.map(s => s.sentence).join(' ');
      const readingTimeSeconds = Math.ceil(wordCount / 3.3); // ~200 WPM

      return {
        summary,
        sentenceCount: rawSentences.length,
        wordCount,
        readingTimeSeconds
      };
    }
  }
];
