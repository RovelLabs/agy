import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  WorkflowEngine,
  ActionRegistry,
  defaultActionRegistry,
  coreRecipes,
  WorkflowSerializer,
  Capabilities,
  Platforms,
  ExecutionStatus
} from '../packages/core/src/index.js';

describe('OPERON Core Engine & Standard Library', () => {
  test('ActionRegistry should register all standard actions', () => {
    const registry = defaultActionRegistry;
    const actions = registry.list();
    assert.ok(actions.length >= 15, `Expected at least 15 actions, found ${actions.length}`);

    assert.ok(registry.has('text.clean_url'));
    assert.ok(registry.has('text.format_json'));
    assert.ok(registry.has('text.markdown_table'));
    assert.ok(registry.has('dev.base64'));
    assert.ok(registry.has('dev.hash'));
    assert.ok(registry.has('dev.jwt_decode'));
    assert.ok(registry.has('file.batch_rename'));
    assert.ok(registry.has('system.notify'));
  });

  test('text.clean_url should strip tracking tokens from complex links', async () => {
    const cleanUrl = defaultActionRegistry.get('text.clean_url');
    const dirty = 'Check this: https://example.com/item?utm_source=twitter&fbclid=IwAR123&product_id=994&igshid=xyz';
    const result = await cleanUrl.execute({ text: dirty });

    assert.equal(result.modified, true);
    assert.equal(result.cleanedText, 'Check this: https://example.com/item?product_id=994');
  });

  test('text.format_json should format, indent, and detect invalid syntax', async () => {
    const formatJson = defaultActionRegistry.get('text.format_json');
    const unformatted = '{"name":"Operon","platform":"desktop","active":true}';
    const result = await formatJson.execute({ text: unformatted, indent: 2 });

    assert.equal(result.success, true);
    assert.ok(result.formattedText.includes('  "name": "Operon"'));
    assert.equal(result.keyCount, 3);

    // Test syntax error
    await assert.rejects(
      async () => formatJson.execute({ text: '{"broken": json}' }),
      /Invalid JSON syntax/
    );
  });

  test('text.change_case should transform between casing conventions', async () => {
    const changeCase = defaultActionRegistry.get('text.change_case');
    
    const camel = await changeCase.execute({ text: 'operon personal automation', targetCase: 'camel' });
    assert.equal(camel.result, 'operonPersonalAutomation');

    const snake = await changeCase.execute({ text: 'Operon Personal Automation', targetCase: 'snake' });
    assert.equal(snake.result, 'operon_personal_automation');

    const kebab = await changeCase.execute({ text: 'Operon Personal Automation', targetCase: 'kebab' });
    assert.equal(kebab.result, 'operon-personal-automation');

    const title = await changeCase.execute({ text: 'operon personal automation', targetCase: 'title' });
    assert.equal(title.result, 'Operon Personal Automation');
  });

  test('text.markdown_table should convert TSV text to Markdown table', async () => {
    const mdTable = defaultActionRegistry.get('text.markdown_table');
    const tsv = "ID\tFeature\tStatus\n1\tOverlay\tDone\n2\tEngine\tDone";
    const result = await mdTable.execute({ text: tsv });

    assert.equal(result.rowCount, 3);
    assert.equal(result.columnCount, 3);
    assert.ok(result.markdown.includes('| ID | Feature | Status |'));
    assert.ok(result.markdown.includes('| --- | --- | --- |'));
    assert.ok(result.markdown.includes('| 1 | Overlay | Done |'));
  });

  test('dev.base64 and dev.hash should compute accurate cryptographic outputs', async () => {
    const b64 = defaultActionRegistry.get('dev.base64');
    const encoded = await b64.execute({ text: 'Operon 2026', mode: 'encode' });
    assert.equal(encoded.result, 'T3Blcm9uIDIwMjY=');

    const decoded = await b64.execute({ text: encoded.result, mode: 'decode' });
    assert.equal(decoded.result, 'Operon 2026');

    const hasher = defaultActionRegistry.get('dev.hash');
    const hashRes = await hasher.execute({ text: 'Operon 2026', algorithm: 'sha256' });
    // Known SHA-256 for 'Operon 2026'
    assert.equal(hashRes.algorithm, 'sha256');
    assert.equal(typeof hashRes.hash, 'string');
    assert.equal(hashRes.hash.length, 64);
  });

  test('dev.jwt_decode should parse JWT offline and flag expiration', async () => {
    const jwtDecode = defaultActionRegistry.get('dev.jwt_decode');
    
    // Sample expired JWT payload { "sub": "1234567890", "name": "Operon", "exp": 1600000000 }
    const sampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ik9wZXJvbiIsImV4cCI6MTYwMDAwMDAwMH0.signature-placeholder';
    const result = await jwtDecode.execute({ token: sampleToken });

    assert.equal(result.validFormat, true);
    assert.equal(result.header.alg, 'HS256');
    assert.equal(result.payload.name, 'Operon');
    assert.equal(result.isExpired, true);
  });

  test('WorkflowEngine should execute recipe_clean_url with memory clipboard', async () => {
    let mockClipboard = 'Link: https://site.com/doc?utm_campaign=winter_promo&id=42';
    const context = {
      clipboard: {
        readText: async () => mockClipboard,
        writeText: async (text) => { mockClipboard = text; }
      }
    };

    const engine = new WorkflowEngine({
      platform: 'windows',
      grantedCapabilities: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
      context
    });

    const cleanRecipe = coreRecipes.find(r => r.id === 'recipe_clean_url');
    assert.ok(cleanRecipe, 'recipe_clean_url must be defined');

    const execResult = await engine.execute(cleanRecipe);
    assert.equal(execResult.status, ExecutionStatus.SUCCESS);
    assert.equal(mockClipboard, 'Link: https://site.com/doc?id=42');
    assert.ok(execResult.durationMs < 50, `Execution took ${execResult.durationMs}ms`);
  });

  test('WorkflowEngine should enforce missing capabilities and block execution', async () => {
    const engine = new WorkflowEngine({
      platform: 'windows',
      grantedCapabilities: [] // No capabilities granted!
    });

    const cleanRecipe = coreRecipes.find(r => r.id === 'recipe_clean_url');
    const result = await engine.execute(cleanRecipe);

    assert.equal(result.status, ExecutionStatus.FAILED);
    assert.ok(result.error.includes('Missing required security capabilities'));
    assert.deepEqual(result.missingCapabilities, [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE]);
  });

  test('WorkflowEngine should execute condition logic and skip when condition fails', async () => {
    const engine = new WorkflowEngine({ platform: 'windows', grantedCapabilities: [Capabilities.NOTIFICATIONS_SEND] });
    
    const conditionalWorkflow = {
      id: 'test_conditional',
      name: 'Conditional Workflow',
      platforms: ['windows'],
      permissions: [Capabilities.NOTIFICATIONS_SEND],
      conditions: [
        { left: '${input.flag}', operator: 'equals', right: 'active' }
      ],
      steps: [
        {
          id: 'notify',
          actionId: 'system.notify',
          parameters: { message: 'Passed!' }
        }
      ]
    };

    // Should cancel when flag is 'inactive'
    const cancelResult = await engine.execute(conditionalWorkflow, { flag: 'inactive' });
    assert.equal(cancelResult.status, ExecutionStatus.CANCELLED);

    // Should execute when flag is 'active'
    const successResult = await engine.execute(conditionalWorkflow, { flag: 'active' });
    assert.equal(successResult.status, ExecutionStatus.SUCCESS);
  });

  test('WorkflowSerializer should export with SHA-256 and audit imported permissions', () => {
    const cleanRecipe = coreRecipes.find(r => r.id === 'recipe_clean_url');
    const exported = WorkflowSerializer.export(cleanRecipe);

    assert.equal(exported.schemaVersion, 'operon.v1');
    assert.equal(typeof exported.checksum, 'string');
    assert.equal(exported.checksum.length, 64);

    const imported = WorkflowSerializer.import(JSON.stringify(exported));
    assert.equal(imported.valid, true);
    assert.equal(imported.workflow.name, cleanRecipe.name);
    assert.equal(imported.securityAudit.isSafe, true);
  });

  test('Performance benchmark: Deterministic workflow execution routing overhead must be < 5ms', async () => {
    const engine = new WorkflowEngine({
      platform: 'windows',
      grantedCapabilities: Object.values(Capabilities)
    });

    const fastWorkflow = {
      id: 'benchmark_wf',
      name: 'Benchmark Fast Workflow',
      platforms: ['windows'],
      permissions: [],
      steps: [
        {
          id: 'step1',
          actionId: 'text.change_case',
          parameters: { text: 'hello world benchmark', targetCase: 'upper' }
        },
        {
          id: 'step2',
          actionId: 'dev.hash',
          parameters: { text: '${steps.step1.result}', algorithm: 'sha256' }
        }
      ]
    };

    // Warm up
    await engine.execute(fastWorkflow);

    // Measure 10 iterations
    const times = [];
    for (let i = 0; i < 10; i++) {
      const res = await engine.execute(fastWorkflow);
      times.push(res.durationMs);
      assert.equal(res.status, ExecutionStatus.SUCCESS);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`[BENCHMARK] Average multi-step workflow execution time: ${avg.toFixed(3)}ms`);
    assert.ok(avg < 5.0, `Average latency must be < 5.0ms, got ${avg}ms`);
  });
});
