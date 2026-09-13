/**
 * OPERON Deterministic Workflow Execution Engine
 */
import { defaultActionRegistry } from './registry.js';
import { ExecutionStatus, Capabilities } from './types.js';

export class WorkflowEngine {
  constructor(options = {}) {
    this.registry = options.registry || defaultActionRegistry;
    this.platform = options.platform || 'windows';
    this.grantedCapabilities = new Set(options.grantedCapabilities || Object.values(Capabilities));
    this.context = options.context || {};
  }

  /**
   * Evaluates if a workflow is compatible with the current platform
   */
  isCompatible(workflow) {
    if (!workflow.platforms || workflow.platforms.length === 0) return true;
    return workflow.platforms.includes(this.platform);
  }

  /**
   * Verifies if all capabilities requested by a workflow are granted
   */
  verifyCapabilities(workflow) {
    const missing = [];
    const required = workflow.permissions || [];
    for (const cap of required) {
      if (!this.grantedCapabilities.has(cap)) {
        missing.push(cap);
      }
    }
    return {
      satisfied: missing.length === 0,
      missing
    };
  }

  /**
   * Resolves variable interpolation strings like `${input.text}` or `${steps.step1.cleanedText}`
   * Guarded against prototype pollution and malicious property access.
   */
  interpolate(value, scope) {
    const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

    if (typeof value === 'string') {
      return value.replace(/\$\{([^}]+)\}/g, (_, path) => {
        const parts = path.trim().split('.');
        let current = scope;
        for (const part of parts) {
          if (FORBIDDEN_KEYS.has(part)) return '';
          if (current === undefined || current === null) return '';
          if (typeof current !== 'object') return '';
          current = current[part];
        }
        return current !== undefined && current !== null ? String(current) : '';
      });
    }

    if (Array.isArray(value)) {
      return value.map(item => this.interpolate(item, scope));
    }

    if (typeof value === 'object' && value !== null) {
      const resolved = {};
      for (const [k, v] of Object.entries(value)) {
        if (FORBIDDEN_KEYS.has(k)) continue;
        resolved[k] = this.interpolate(v, scope);
      }
      return resolved;
    }

    return value;
  }

  /**
   * Evaluates condition expressions
   */
  evaluateCondition(condition, scope) {
    const left = this.interpolate(condition.left, scope);
    const right = this.interpolate(condition.right, scope);
    const op = condition.operator || 'equals';

    switch (op) {
      case 'equals':
        return String(left) === String(right);
      case 'not_equals':
        return String(left) !== String(right);
      case 'contains':
        return String(left).includes(String(right));
      case 'matches_regex':
        try {
          return new RegExp(String(right)).test(String(left));
        } catch {
          return false;
        }
      case 'greater_than':
        return Number(left) > Number(right);
      case 'less_than':
        return Number(left) < Number(right);
      case 'is_empty':
        return !left || (Array.isArray(left) && left.length === 0) || String(left).trim() === '';
      case 'is_not_empty':
        return Boolean(left) && (!Array.isArray(left) || left.length > 0) && String(left).trim() !== '';
      default:
        return true;
    }
  }

  /**
   * Executes a complete workflow deterministically
   */
  async execute(workflow, input = {}, options = {}) {
    const startTime = performance.now();
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const stepResults = [];
    const stepOutputs = {};

    // 1. Check Platform Compatibility
    if (!this.isCompatible(workflow)) {
      return {
        executionId,
        workflowId: workflow.id,
        status: ExecutionStatus.FAILED,
        durationMs: performance.now() - startTime,
        error: `Workflow '${workflow.name}' is not supported on platform: ${this.platform}`
      };
    }

    // 2. Check Security Permissions / Capabilities
    const capCheck = this.verifyCapabilities(workflow);
    if (!capCheck.satisfied && !options.skipCapabilityCheck) {
      return {
        executionId,
        workflowId: workflow.id,
        status: ExecutionStatus.FAILED,
        durationMs: performance.now() - startTime,
        error: `Missing required security capabilities: ${capCheck.missing.join(', ')}`,
        missingCapabilities: capCheck.missing
      };
    }

    const scope = {
      input,
      steps: stepOutputs,
      context: this.context
    };

    // 3. Evaluate Workflow Top-Level Conditions
    if (Array.isArray(workflow.conditions) && workflow.conditions.length > 0) {
      for (const cond of workflow.conditions) {
        const passed = this.evaluateCondition(cond, scope);
        if (!passed) {
          return {
            executionId,
            workflowId: workflow.id,
            status: ExecutionStatus.CANCELLED,
            durationMs: performance.now() - startTime,
            reason: `Condition failed: ${cond.left} ${cond.operator} ${cond.right}`
          };
        }
      }
    }

    // 4. Sequential Step Execution
    let finalOutput = null;
    for (let i = 0; i < (workflow.steps || []).length; i++) {
      if (options.abortSignal?.aborted) {
        return {
          executionId,
          workflowId: workflow.id,
          status: ExecutionStatus.CANCELLED,
          durationMs: performance.now() - startTime,
          reason: 'Workflow execution aborted by caller',
          stepResults
        };
      }

      const step = workflow.steps[i];
      const stepKey = step.id || `step_${i}`;
      const action = this.registry.get(step.actionId);

      // Evaluate per-step condition if present
      if (step.condition) {
        const condPassed = this.evaluateCondition(step.condition, scope);
        if (!condPassed) {
          stepResults.push({
            stepKey,
            actionId: step.actionId,
            status: 'skipped',
            reason: `Step condition evaluated to false`
          });
          continue;
        }
      }

      if (!action) {
        const err = `Action '${step.actionId}' not found in registry`;
        stepResults.push({ stepKey, actionId: step.actionId, status: 'error', error: err });
        if (!step.continueOnError) {
          return {
            executionId,
            workflowId: workflow.id,
            status: ExecutionStatus.FAILED,
            durationMs: performance.now() - startTime,
            error: err,
            stepResults
          };
        }
        continue;
      }

      const maxRetries = Number(step.retries) || 0;
      const retryDelayMs = Number(step.retryDelayMs) || 50;
      let attempt = 0;
      let stepSuccess = false;
      let lastErr = null;
      let stepDuration = 0;

      while (attempt <= maxRetries && !stepSuccess) {
        attempt++;
        const stepStart = performance.now();
        try {
          // Resolve parameters with variable interpolation
          const resolvedParams = this.interpolate(step.parameters || {}, scope);
          
          // Timeout protection
          const timeoutMs = step.timeoutMs || 30000;
          const execPromise = action.execute(resolvedParams, { ...this.context, ...options.context });
          
          const output = await Promise.race([
            execPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error(`Step timed out after ${timeoutMs}ms`)), timeoutMs))
          ]);

          stepDuration = performance.now() - stepStart;
          stepOutputs[stepKey] = output;
          finalOutput = output;
          stepSuccess = true;

          stepResults.push({
            stepKey,
            actionId: step.actionId,
            status: 'success',
            durationMs: stepDuration,
            attempts: attempt,
            output
          });
        } catch (err) {
          stepDuration = performance.now() - stepStart;
          lastErr = err;
          if (attempt <= maxRetries) {
            await new Promise(r => setTimeout(r, retryDelayMs));
          }
        }
      }

      if (!stepSuccess) {
        stepResults.push({
          stepKey,
          actionId: step.actionId,
          status: 'error',
          durationMs: stepDuration,
          attempts: attempt,
          error: lastErr?.message || 'Unknown step failure'
        });

        if (!step.continueOnError) {
          return {
            executionId,
            workflowId: workflow.id,
            status: ExecutionStatus.FAILED,
            durationMs: performance.now() - startTime,
            error: `Step '${stepKey}' failed: ${lastErr?.message}`,
            stepResults
          };
        }
      }
    }

    return {
      executionId,
      workflowId: workflow.id,
      status: ExecutionStatus.SUCCESS,
      durationMs: performance.now() - startTime,
      output: finalOutput,
      stepResults
    };
  }
}
