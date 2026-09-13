import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  WorkflowEngine,
  defaultActionRegistry,
  WorkflowSerializer,
  ExecutionStatus,
  Capabilities
} from '../packages/core/src/index.js';
import { LocalDataStore } from '../packages/storage/src/index.js';
import { AIWorkflowCompiler, AIPlanValidator } from '../ai/src/index.js';

describe('QA Breaker Campaign: Rigorous Stress, Safety, and Edge-Case Testing', () => {
  test('Breaker: Engine must gracefully abort when a step times out', async () => {
    const customRegistry = defaultActionRegistry;
    // Register a deliberately hanging action
    customRegistry.register({
      id: 'breaker.hang',
      name: 'Hanging Action',
      category: 'system',
      requiredCapabilities: [],
      supportedPlatforms: ['windows', 'macos'],
      schema: { type: 'object' },
      async execute() {
        return new Promise(r => setTimeout(r, 5000)); // Hanger
      }
    });

    const engine = new WorkflowEngine({
      registry: customRegistry,
      platform: 'windows'
    });

    const hangingWorkflow = {
      id: 'wf_hang',
      name: 'Hanging Test',
      platforms: ['windows'],
      permissions: [],
      steps: [
        {
          id: 'hang_step',
          actionId: 'breaker.hang',
          timeoutMs: 50 // Enforce ultra-short timeout
        }
      ]
    };

    const result = await engine.execute(hangingWorkflow);
    assert.equal(result.status, ExecutionStatus.FAILED);
    assert.ok(result.error.includes('timed out after 50ms'));
  });

  test('Breaker: Engine must reject dangerous command injections', async () => {
    const shellAction = defaultActionRegistry.get('system.shell_exec');
    
    // Without developerMode context, must reject immediately
    await assert.rejects(
      async () => shellAction.execute({ command: 'echo hello' }, { developerMode: false }),
      /Security Error: system.shell_exec is disabled/
    );

    // With developerMode enabled, catastrophic commands must still be intercepted
    const dangerousCommands = [
      'rm -rf /',
      'del /s /q C:\\Windows',
      'format C:',
      'mkfs.ext4 /dev/sda1'
    ];

    for (const cmd of dangerousCommands) {
      await assert.rejects(
        async () => shellAction.execute({ command: cmd }, { developerMode: true }),
        /Catastrophic command execution blocked/
      );
    }
  });

  test('Breaker: Serializer must detect corrupt, invalid, or missing schemas', () => {
    assert.throws(
      () => WorkflowSerializer.import('{"not": "valid workflow"}'),
      /Malformed workflow/
    );

    assert.throws(
      () => WorkflowSerializer.import('{ invalid json }'),
      /Invalid JSON syntax/
    );
  });

  test('Breaker: Storage must recover safely from a corrupted JSON file', async () => {
    const memoryStore = new LocalDataStore();
    await memoryStore.init();

    // Verify recovery on empty or invalid restore
    await assert.rejects(
      async () => memoryStore.restoreBackup({}),
      /Invalid backup payload/
    );
  });

  test('Breaker: Engine must isolate concurrent executions without data pollution', async () => {
    const engine = new WorkflowEngine({ platform: 'windows', grantedCapabilities: [] });

    const createWf = (idx) => ({
      id: `wf_concurrent_${idx}`,
      name: `Concurrent ${idx}`,
      platforms: ['windows'],
      permissions: [],
      steps: [
        {
          id: 'step_case',
          actionId: 'text.change_case',
          parameters: { text: `hello world test ${idx}`, targetCase: 'camel' }
        }
      ]
    });

    // Launch 50 concurrent executions
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(engine.execute(createWf(i)));
    }

    const results = await Promise.all(promises);
    for (let i = 0; i < 50; i++) {
      assert.equal(results[i].status, ExecutionStatus.SUCCESS);
      assert.equal(results[i].output.result, `helloWorldTest${i}`);
    }
  });

  test('Breaker: Deep variable interpolation should safely return empty string on invalid paths', () => {
    const engine = new WorkflowEngine({ platform: 'windows' });
    const scope = { input: { text: 'valid' } };

    assert.equal(engine.interpolate('${input.text}', scope), 'valid');
    assert.equal(engine.interpolate('${input.nonexistent.deep.path}', scope), '');
    assert.equal(engine.interpolate('Static text with ${undefined_var}', scope), 'Static text with ');
  });
});
