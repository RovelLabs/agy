/**
 * OPERON AI Safety & Plan Validator
 * Strictly isolates AI output from execution until validated and approved
 */
import { defaultActionRegistry } from '../../packages/core/src/registry.js';
import { Capabilities } from '../../packages/core/src/types.js';

export class AIPlanValidator {
  /**
   * Validates an AI-synthesized workflow against catalog schemas and safety criteria
   */
  static validate(workflowDraft) {
    const errors = [];
    const warnings = [];
    const requiredPermissions = new Set();
    let isDestructive = false;

    if (!workflowDraft || typeof workflowDraft !== 'object') {
      return { valid: false, errors: ['Workflow draft is empty or invalid JSON'] };
    }

    if (!workflowDraft.name) errors.push('Missing workflow name');
    if (!Array.isArray(workflowDraft.steps) || workflowDraft.steps.length === 0) {
      errors.push('Workflow must contain at least one action step');
    }

    // Step Validation
    for (let i = 0; i < (workflowDraft.steps || []).length; i++) {
      const step = workflowDraft.steps[i];
      const stepIndex = i + 1;

      if (!step.actionId) {
        errors.push(`Step #${stepIndex} is missing actionId`);
        continue;
      }

      const action = defaultActionRegistry.get(step.actionId);
      if (!action) {
        errors.push(`Step #${stepIndex} references unknown action: '${step.actionId}'`);
        continue;
      }

      // Collect required capabilities
      for (const cap of action.requiredCapabilities || []) {
        requiredPermissions.add(cap);
      }

      // Detect destructive operations
      if (step.actionId === 'file.recycle' || step.actionId === 'system.shell_exec') {
        isDestructive = true;
        warnings.push(`Step #${stepIndex} (${action.name}) involves file modification or system execution.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      requiredPermissions: Array.from(requiredPermissions),
      isDestructive,
      stepCount: (workflowDraft.steps || []).length
    };
  }
}
