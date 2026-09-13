/**
 * OPERON Deterministic Workflow Execution Engine
 */
import { defaultActionRegistry } from './registry.js';
import { ExecutionStatus } from './types.js';

export class WorkflowEngine {
  constructor(options = {}) {
    this.registry = options.registry || defaultActionRegistry;
    this.platform = options.platform || 'windows';
    this.grantedCapabilities = new Set(options.grantedCapabilities || Object.values(options.capabilities || {}));
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
   */
  interpolate(value, scope) {
    if (typeof value === 'string') {
      return value.replace(/\$\{([^}]+)\}/g, (_, path) => {
        const parts = path.trim().split('.');
        let current = scope;
        for (const part of parts) {
          if (current === undefined || current === null) return '';
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
      const step = workflow.steps[i];
      const stepKey = step.id || `step_${i}`;
      const action = this.registry.get(step.actionId);

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

        const stepDuration = performance.now() - stepStart;
        stepOutputs[stepKey] = output;
        finalOutput = output;

        stepResults.push({
          stepKey,
          actionId: step.actionId,
          status: 'success',
          durationMs: stepDuration,
          output
        });
      } catch (err) {
        const stepDuration = performance.now() - stepStart;
        stepResults.push({
          stepKey,
          actionId: step.actionId,
          status: 'error',
          durationMs: stepDuration,
          error: err.message
        });

        if (!step.continueOnError) {
          return {
            executionId,
            workflowId: workflow.id,
            status: ExecutionStatus.FAILED,
            durationMs: performance.now() - startTime,
            error: `Step '${stepKey}' failed: ${err.message}`,
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
