/**
 * OPERON Standard Action Library: Developer Domain
 */
import { Capabilities, Platforms, Categories } from '../types.js';
import crypto from 'node:crypto';

export const developerActions = [
  {
    id: 'dev.base64',
    name: 'Base64 Encode / Decode',
    description: 'Encodes or decodes text to/from Base64 encoding.',
    category: Categories.DEVELOPER,
    requiredCapabilities: [],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        mode: { type: 'string', enum: ['encode', 'decode'], default: 'encode' },
        urlSafe: { type: 'boolean', default: false }
      },
      required: ['text']
    },
    async execute({ text, mode = 'encode', urlSafe = false }) {
      if (!text) return { result: '' };

      if (mode === 'encode') {
        let b64 = Buffer.from(text, 'utf8').toString('base64');
        if (urlSafe) {
          b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        }
        return { result: b64, originalLength: text.length, encodedLength: b64.length };
      } else {
        let b64 = text.trim();
        if (urlSafe) {
          b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
          while (b64.length % 4) b64 += '=';
        }
        try {
          const decoded = Buffer.from(b64, 'base64').toString('utf8');
          return { result: decoded, originalLength: text.length, decodedLength: decoded.length };
        } catch (err) {
          throw new Error(`Failed to decode Base64 string: ${err.message}`);
        }
      }
    }
  },

  {
    id: 'dev.hash',
    name: 'Cryptographic Hash Generator',
    description: 'Calculates cryptographic hashes (SHA-256, SHA-512, MD5).',
    category: Categories.DEVELOPER,
    requiredCapabilities: [],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        algorithm: { type: 'string', enum: ['sha256', 'sha512', 'md5'], default: 'sha256' }
      },
      required: ['text']
    },
    async execute({ text, algorithm = 'sha256' }) {
      const algo = algorithm.toLowerCase();
      const hash = crypto.createHash(algo).update(text || '', 'utf8').digest('hex');
      return { hash, algorithm: algo, inputLength: (text || '').length };
    }
  },

  {
    id: 'dev.jwt_decode',
    name: 'Offline JWT Inspector',
    description: 'Decodes JSON Web Token header and payload locally without transmitting secrets.',
    category: Categories.DEVELOPER,
    requiredCapabilities: [],
    supportedPlatforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' }
      },
      required: ['token']
    },
    async execute({ token }) {
      if (!token || typeof token !== 'string') {
        throw new Error('JWT token must be a non-empty string');
      }

      const parts = token.trim().split('.');
      if (parts.length !== 3) {
        throw new Error(`Invalid JWT format: expected 3 dot-separated parts, received ${parts.length}`);
      }

      const decodePart = (str) => {
        let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        const json = Buffer.from(b64, 'base64').toString('utf8');
        return JSON.parse(json);
      };

      try {
        const header = decodePart(parts[0]);
        const payload = decodePart(parts[1]);

        let expirationHuman = null;
        let isExpired = false;

        if (payload.exp && typeof payload.exp === 'number') {
          const expDate = new Date(payload.exp * 1000);
          expirationHuman = expDate.toISOString();
          isExpired = Date.now() > expDate.getTime();
        }

        return {
          validFormat: true,
          header,
          payload,
          isExpired,
          expiration: expirationHuman,
          signaturePresent: parts[2].length > 0
        };
      } catch (err) {
        throw new Error(`Failed to parse JWT payload: ${err.message}`);
      }
    }
  }
];
