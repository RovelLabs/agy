import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WorkflowEngine } from '../packages/core/src/engine.js';
import { LicenseVerifier } from '../packages/entitlements/src/license.js';
import { EntitlementTier } from '../packages/entitlements/src/constants.js';
import { OperonDesktopApp } from '../apps/desktop/src/main.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

function makeRequest(port, options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({ port, host: '127.0.0.1', ...options }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), raw: data });
        } catch {
          resolve({ status: res.statusCode, body: null, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

describe('OPERON Security Audit & Red Team Hardening', () => {
  it('Variable interpolation must be immune to prototype pollution', () => {
    const engine = new WorkflowEngine();
    const maliciousScope = {
      user: { name: 'Alice' }
    };

    // Try accessing __proto__ or constructor
    const interpolatedProto = engine.interpolate('${__proto__.polluted}', maliciousScope);
    const interpolatedConstructor = engine.interpolate('${constructor.prototype.evil}', maliciousScope);

    assert.strictEqual(interpolatedProto, '', 'Prototype traversal must return empty string');
    assert.strictEqual(interpolatedConstructor, '', 'Constructor traversal must return empty string');
    assert.strictEqual(Object.prototype.polluted, undefined, 'Object prototype must remain unpolluted');
    assert.strictEqual(Object.prototype.evil, undefined, 'Object prototype must remain unpolluted');
  });

  it('Engine condition evaluator must safely handle invalid or malicious regular expressions', () => {
    const engine = new WorkflowEngine();
    const condition = {
      left: 'test input',
      operator: 'matches_regex',
      right: '[invalid(regex'
    };

    const result = engine.evaluateCondition(condition, {});
    assert.strictEqual(result, false, 'Invalid regex condition must fail safely without throwing');
  });

  it('Offline LicenseVerifier must reject all forms of signature tampering and payload forgery', () => {
    // Generate valid license
    const validKey = LicenseVerifier.issueLicense({
      tier: EntitlementTier.PRO_LIFETIME,
      customerEmail: 'security-tester@operon.dev',
      expiresAt: null
    });

    assert.ok(validKey.startsWith('OPKEY-'), 'Key format must start with OPKEY-');
    const validVerification = LicenseVerifier.verifyLicense(validKey);
    assert.strictEqual(validVerification.valid, true, 'Original key must be valid');

    // Attack 1: Modify signature segment
    const dotIndex = validKey.lastIndexOf('.');
    const prefixAndPayload = validKey.substring(0, dotIndex);
    const signature = validKey.substring(dotIndex + 1);
    const forgedSig = signature.slice(0, -1) + (signature.slice(-1) === 'a' ? 'b' : 'a');
    const forgedKey = `${prefixAndPayload}.${forgedSig}`;

    const forgedVerification = LicenseVerifier.verifyLicense(forgedKey);
    assert.strictEqual(forgedVerification.valid, false, 'Forged signature must be rejected');

    // Attack 2: Payload tamper (change payload base64)
    const rawPayloadPart = validKey.replace('OPKEY-', '').substring(0, dotIndex - 6);
    const decodedPayload = JSON.parse(Buffer.from(rawPayloadPart, 'base64url').toString('utf-8'));
    decodedPayload.tier = 'ENTERPRISE_UNLIMITED';
    const reEncodedPayload = Buffer.from(JSON.stringify(decodedPayload)).toString('base64url');
    const tamperedPayloadKey = `OPKEY-${reEncodedPayload}.${signature}`;

    const tamperedVerification = LicenseVerifier.verifyLicense(tamperedPayloadKey);
    assert.strictEqual(tamperedVerification.valid, false, 'Tampered payload must fail signature check');

    // Attack 3: Expired trial key replay
    const expiredKey = LicenseVerifier.issueLicense({
      tier: EntitlementTier.PRO_TRIAL,
      customerEmail: 'expired@operon.dev',
      expiresAt: new Date(Date.now() - 10000).toISOString()
    });
    const expiredVerification = LicenseVerifier.verifyLicense(expiredKey);
    assert.strictEqual(expiredVerification.valid, false, 'Expired license key must be rejected');
    assert.match(expiredVerification.error, /expired/i);
  });

  it('Desktop REST API must reject path traversal and invalid workflow IDs', async () => {
    const testDbPath = path.join(ROOT_DIR, 'scratch', 'sec_test_db.json');
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

    const app = new OperonDesktopApp({ port: 0, dbPath: testDbPath });
    await app.start();
    const port = app.port;

    try {
      // 1. Path traversal in workflow ID
      const traversalAttempts = [
        '../../etc/passwd',
        '..\\..\\Windows\\System32',
        'bad/slash',
        'evil\\backslash',
        '<script>alert(1)</script>',
        ' '
      ];

      for (const badId of traversalAttempts) {
        const res = await makeRequest(port, {
          path: '/api/workflows',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, { id: badId, name: 'Malicious Workflow', steps: [] });

        assert.strictEqual(res.status, 400, `Bad ID '${badId}' must receive HTTP 400`);
      }

      // 2. Path traversal in DELETE id param
      const delRes = await makeRequest(port, {
        path: '/api/workflows?id=../../dangerous',
        method: 'DELETE'
      });
      assert.strictEqual(delRes.status, 400, 'Traversal in DELETE param must receive HTTP 400');
    } finally {
      await app.stop();
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    }
  });
});
