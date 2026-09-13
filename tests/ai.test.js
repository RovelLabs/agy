import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AIWorkflowCompiler, AIPlanValidator } from '../ai/src/index.js';
import { WorkflowEngine, Capabilities, ExecutionStatus } from '../packages/core/src/index.js';

describe('OPERON Local AI Compiler & Plan Validator', () => {
  const compiler = new AIWorkflowCompiler();

  test('Compiler should translate English URL clean prompt to validated workflow draft', async () => {
    const result = await compiler.compile('Strip tracking UTM parameters from my copied link');
    
    assert.equal(result.validation.valid, true);
    assert.equal(result.workflowDraft.category, 'text');
    assert.ok(result.workflowDraft.steps.some(s => s.actionId === 'text.clean_url'));
    assert.deepEqual(result.validation.requiredPermissions, [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE]);
  });

  test('Compiler should translate Russian prompt to validated workflow draft', async () => {
    const result = await compiler.compile('Форматировать json в буфере обмена');
    
    assert.equal(result.validation.valid, true);
    assert.equal(result.workflowDraft.category, 'developer');
    assert.ok(result.workflowDraft.steps.some(s => s.actionId === 'text.format_json'));
  });

  test('Compiled workflow must execute successfully inside deterministic WorkflowEngine', async () => {
    const compilation = await compiler.compile('format json');
    assert.equal(compilation.validation.valid, true);

    let clipboardContent = '{"service":"operon","status":"active"}';
    const mockContext = {
      clipboard: {
        readText: async () => clipboardContent,
        writeText: async (val) => { clipboardContent = val; }
      }
    };

    const engine = new WorkflowEngine({
      platform: 'windows',
      grantedCapabilities: compilation.validation.requiredPermissions,
      context: mockContext
    });

    const execution = await engine.execute(compilation.workflowDraft);
    assert.equal(execution.status, ExecutionStatus.SUCCESS);
    assert.ok(clipboardContent.includes('  "service": "operon"'));
  });

  test('AIPlanValidator should detect missing action or invalid step schema', () => {
    const brokenDraft = {
      name: 'Broken Plan',
      steps: [
        { id: 'step_bad', actionId: 'nonexistent.action' }
      ]
    };

    const check = AIPlanValidator.validate(brokenDraft);
    assert.equal(check.valid, false);
    assert.ok(check.errors[0].includes('unknown action'));
  });
});
