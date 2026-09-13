/**
 * OPERON Cryptographic Offline License Token Verifier
 * Allows permanent offline license validation without continuous network telemetry
 */
import crypto from 'node:crypto';
import { EntitlementTier } from './constants.js';

// Public verification secret for local signature validation (in production, asymmetric Ed25519 public key)
const LICENSE_SIGNING_SALT = 'OPERON_COMMERCIAL_LICENSE_V1_VERIFICATION_ROOT_2026';

export class LicenseVerifier {
  /**
   * Generates a signed license key string for testing / point-of-sale issuance
   */
  static issueLicense({ licenseId, tier = EntitlementTier.PRO_LIFETIME, customerEmail, expiresAt = null }) {
    const payload = {
      lid: licenseId || `OP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      tier,
      email: customerEmail || 'anonymous@local',
      iat: Math.floor(Date.now() / 1000),
      exp: expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : null
    };

    const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', LICENSE_SIGNING_SALT)
      .update(b64Payload)
      .digest('hex');

    return `OPKEY-${b64Payload}.${signature}`;
  }

  /**
   * Verifies an offline license key string
   */
  static verifyLicense(licenseKey) {
    if (!licenseKey || typeof licenseKey !== 'string' || !licenseKey.startsWith('OPKEY-')) {
      return { valid: false, error: 'Invalid license format. Expected OPKEY- prefix.' };
    }

    const raw = licenseKey.replace('OPKEY-', '');
    const parts = raw.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Malformed license token.' };
    }

    const [b64Payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', LICENSE_SIGNING_SALT)
      .update(b64Payload)
      .digest('hex');

    if (signature !== expectedSig) {
      return { valid: false, error: 'Cryptographic signature mismatch. License is invalid or tampered.' };
    }

    try {
      const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
      const now = Math.floor(Date.now() / 1000);

      // Check expiration
      if (payload.exp && payload.exp < now) {
        return {
          valid: false,
          expired: true,
          error: `License expired on ${new Date(payload.exp * 1000).toISOString()}`,
          payload
        };
      }

      return {
        valid: true,
        expired: false,
        licenseId: payload.lid,
        tier: payload.tier,
        email: payload.email,
        issuedAt: new Date(payload.iat * 1000).toISOString(),
        expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
        isPermanent: payload.exp === null
      };
    } catch (err) {
      return { valid: false, error: `Corrupted license payload: ${err.message}` };
    }
  }
}
