import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AIWorkflowCompiler } from '../ai/src/compiler.js';
import { AIPlanValidator } from '../ai/src/validator.js';
import { EvaluationDataset } from '../ai/src/benchmark.js';

describe('OPERON Local AI Multilingual Benchmark & Evaluation Suite', () => {
  const compiler = new AIWorkflowCompiler();

  test('Multilingual benchmark: 40 cases across Russian and English must compile with 100% validity', async () => {
    assert.equal(EvaluationDataset.length, 40);

    let passed = 0;
    const times = [];

    for (const testCase of EvaluationDataset) {
      const t0 = performance.now();
      const compiled = await compiler.compile(testCase.prompt);
      const elapsed = performance.now() - t0;
      times.push(elapsed);

      // 1. Validation check
      const validation = AIPlanValidator.validate(compiled.workflowDraft);
      assert.equal(validation.valid, true, `Validation failed for prompt: "${testCase.prompt}"`);

      // 2. Category check
      assert.equal(
        compiled.workflowDraft.category,
        testCase.expectedCategory,
        `Expected category ${testCase.expectedCategory} for "${testCase.prompt}", got ${compiled.workflowDraft.category}`
      );

      // 3. Action match check
      const actionFound = compiled.workflowDraft.steps.some(s => s.actionId === testCase.expectedAction);
      assert.ok(
        actionFound,
        `Expected action ${testCase.expectedAction} in workflow steps for prompt "${testCase.prompt}"`
      );

      passed++;
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`[AI BENCHMARK] Evaluated ${passed}/40 multilingual queries. Average compilation latency: ${avgTime.toFixed(3)}ms`);

    assert.equal(passed, 40);
    assert.ok(avgTime < 5.0, `Average compilation time must be < 5ms, got ${avgTime}ms`);
  });
});
