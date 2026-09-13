/**
 * OPERON Workflow Serializer & Security Inspector
 */
import crypto from 'node:crypto';

export class WorkflowSerializer {
  /**
   * Serializes a workflow definition into portable JSON format with integrity hash
   */
  static export(workflow) {
    const clean = {
      id: workflow.id,
      version: workflow.version || 1,
      name: workflow.name,
      description: workflow.description || '',
      icon: workflow.icon || 'Zap',
      category: workflow.category || 'custom',
      platforms: workflow.platforms || ['windows', 'macos', 'android', 'ios'],
      permissions: workflow.permissions || [],
      trigger: workflow.trigger || { type: 'manual' },
      conditions: workflow.conditions || [],
      steps: workflow.steps || [],
      exportedAt: new Date().toISOString()
    };

    const json = JSON.stringify(clean, null, 2);
    const checksum = crypto.createHash('sha256').update(json).digest('hex');

    return {
      schemaVersion: 'operon.v1',
      checksum,
      workflow: clean
    };
  }

  /**
   * Validates and imports a workflow JSON package, performing a security capability audit
   */
  static import(rawJsonString) {
    let parsed;
    try {
      parsed = JSON.parse(rawJsonString);
    } catch (err) {
      throw new Error(`Invalid JSON syntax in workflow file: ${err.message}`);
    }

    const workflow = parsed.workflow || parsed;

    if (!workflow.id || !workflow.name || !Array.isArray(workflow.steps)) {
      throw new Error('Malformed workflow: missing required id, name, or steps array.');
    }

    // Security Audit: Extract all capabilities actually referenced by action steps
    const declaredPermissions = new Set(workflow.permissions || []);
    const highRiskActions = [];

    for (const step of workflow.steps) {
      if (step.actionId === 'system.shell_exec') {
        highRiskActions.push({ stepId: step.id, actionId: step.actionId, risk: 'Arbitrary Terminal Execution' });
      }
      if (step.actionId === 'file.recycle') {
        highRiskActions.push({ stepId: step.id, actionId: step.actionId, risk: 'File System Deletion / Quarantine' });
      }
    }

    return {
      valid: true,
      workflow,
      securityAudit: {
        declaredCapabilities: Array.from(declaredPermissions),
        highRiskActions,
        isSafe: highRiskActions.length === 0
      }
    };
  }
}
