import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { OperonDesktopApp } from '../apps/desktop/src/main.js';

describe('OPERON Desktop Server & Workspace API', () => {
  let app;
  let baseUrl;
  const testPort = 49288;

  before(async () => {
    app = new OperonDesktopApp({ port: testPort });
    baseUrl = await app.start();
  });

  after(async () => {
    if (app) await app.stop();
  });

  test('GET /api/workflows should return all seeded 30 core recipes', async () => {
    const res = await fetch(`${baseUrl}/api/workflows`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.workflows));
    assert.ok(data.workflows.length >= 30, `Expected at least 30 recipes, got ${data.workflows.length}`);
  });

  test('POST /api/workflows and DELETE /api/workflows should perform workflow CRUD', async () => {
    const testWf = {
      id: 'custom_test_wf_123',
      name: 'Custom Integration Test Workflow',
      description: 'Created by automated integration test',
      category: 'developer',
      steps: [
        {
          id: 'step1',
          actionId: 'dev.base64',
          parameters: { text: 'test data', mode: 'encode' }
        }
      ]
    };

    // Create
    const postRes = await fetch(`${baseUrl}/api/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testWf)
    });
    assert.equal(postRes.status, 200);
    const postData = await postRes.json();
    assert.equal(postData.success, true);

    // Verify presence
    const listRes = await fetch(`${baseUrl}/api/workflows`);
    const listData = await listRes.json();
    const found = listData.workflows.find(w => w.id === testWf.id);
    assert.ok(found, 'Custom workflow should be present in library');

    // Delete
    const delRes = await fetch(`${baseUrl}/api/workflows?id=${testWf.id}`, { method: 'DELETE' });
    assert.equal(delRes.status, 200);
    const delData = await delRes.json();
    assert.equal(delData.deletedId, testWf.id);
  });

  test('GET /api/actions should return standard library actions with schemas', async () => {
    const res = await fetch(`${baseUrl}/api/actions`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.actions));
    assert.ok(data.actions.length >= 15);

    const cleanUrlAction = data.actions.find(a => a.id === 'text.clean_url');
    assert.ok(cleanUrlAction);
    assert.equal(cleanUrlAction.category, 'text');
    assert.ok(cleanUrlAction.schema);
  });

  test('POST /api/execute should execute workflow and record execution history', async () => {
    const execWf = {
      id: 'exec_test_wf',
      name: 'Execution Test',
      steps: [
        {
          id: 'step1',
          actionId: 'text.clean_url',
          parameters: { text: 'https://example.com/item?utm_source=twitter&id=42' }
        }
      ]
    };

    const execRes = await fetch(`${baseUrl}/api/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow: execWf })
    });
    assert.equal(execRes.status, 200);
    const execData = await execRes.json();
    assert.equal(execData.result.status, 'success');
    assert.equal(execData.result.output.cleanedText, 'https://example.com/item?id=42');

    // Verify history recorded
    const histRes = await fetch(`${baseUrl}/api/history`);
    assert.equal(histRes.status, 200);
    const histData = await histRes.json();
    assert.ok(histData.history.length > 0);
    const entry = histData.history.find(h => h.workflowId === 'exec_test_wf');
    assert.ok(entry);
    assert.equal(entry.status, 'success');
  });

  test('POST /api/compile-ai should translate natural language to validated draft', async () => {
    const res = await fetch(`${baseUrl}/api/compile-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Strip tracking tokens from URL' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.compiled);
    assert.equal(data.compiled.validation.valid, true);
    assert.ok(data.compiled.workflowDraft.steps.length > 0);
  });

  test('GET /api/entitlements and POST /api/trial/start should manage trial lifecycle', async () => {
    const getRes = await fetch(`${baseUrl}/api/entitlements`);
    assert.equal(getRes.status, 200);
    const initialStatus = await getRes.json();
    assert.ok(initialStatus.tier);

    const trialRes = await fetch(`${baseUrl}/api/trial/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: 14 })
    });
    assert.equal(trialRes.status, 200);
    const trialData = await trialRes.json();
    assert.equal(trialData.success, true);
    assert.equal(trialData.tier, 'pro_trial');
    assert.equal(trialData.daysRemaining, 14);

    const statusRes = await fetch(`${baseUrl}/api/entitlements`);
    const updatedStatus = await statusRes.json();
    assert.equal(updatedStatus.tier, 'pro_trial');
    assert.equal(updatedStatus.isTrial, true);
  });

  test('POST /api/license/simulate-purchase and POST /api/license/activate should verify HMAC tokens', async () => {
    const buyRes = await fetch(`${baseUrl}/api/license/simulate-purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: 'pro_lifetime', email: 'e2e.tester@operon.local' })
    });
    assert.equal(buyRes.status, 200);
    const buyData = await buyRes.json();
    assert.equal(buyData.success, true);
    assert.equal(buyData.tier, 'pro_lifetime');
    assert.ok(buyData.issuedKey.startsWith('OPKEY-'));

    // Test activating the newly generated key
    const activateRes = await fetch(`${baseUrl}/api/license/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: buyData.issuedKey })
    });
    assert.equal(activateRes.status, 200);
    const activateData = await activateRes.json();
    assert.equal(activateData.success, true);
    assert.equal(activateData.tier, 'pro_lifetime');

    // Test rejection of tampered/corrupted key
    const badRes = await fetch(`${baseUrl}/api/license/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: 'OPKEY-TAMPERED_PAYLOAD.BADSIG' })
    });
    assert.equal(badRes.status, 400);
    const badData = await badRes.json();
    assert.ok(badData.error);
  });
});
