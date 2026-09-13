/**
 * OPERON Local AI Workflow Compiler
 * Compiles natural language prompts into typed, schema-validated IWorkflow objects
 */
import { AIPlanValidator } from './validator.js';
import { IntentTaxonomy } from './taxonomy.js';
import { coreRecipes } from '../../packages/core/src/recipes.js';
import { Categories, Capabilities, Platforms } from '../../packages/core/src/types.js';

export class AIWorkflowCompiler {
  constructor(options = {}) {
    this.providerName = options.providerName || 'deterministic-slm';
  }

  /**
   * Main compilation entrypoint: Natural Language -> Validated Workflow Draft
   */
  async compile(prompt, context = {}) {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Compilation prompt cannot be empty.');
    }

    const cleanPrompt = prompt.trim().toLowerCase();

    // Tier 1: High-Speed Deterministic NLP Rule Compiler
    const draft = this.compileDeterministicRule(cleanPrompt, prompt.trim(), context);

    // Validate draft against safety boundaries
    const validation = AIPlanValidator.validate(draft);

    return {
      prompt,
      provider: this.providerName,
      compiledAt: new Date().toISOString(),
      workflowDraft: draft,
      validation,
      readyForUserPreview: validation.valid
    };
  }

  compileDeterministicRule(lower, rawPrompt, context) {
    const id = `wf_ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    // Score all taxonomy intents by keyword matches
    let bestIntent = null;
    let highestScore = 0;

    for (const intent of Object.values(IntentTaxonomy)) {
      let score = 0;
      for (const kw of intent.keywords) {
        if (lower.includes(kw)) {
          // Exact substring match
          score += kw.length * 3;
        } else {
          // Token subset match for natural phrasing with intermediate words
          const words = kw.split(' ');
          if (words.length > 1 && words.every(w => lower.includes(w))) {
            score += kw.length * 1.5;
          }
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestIntent = intent;
      }
    }

    if (bestIntent && highestScore > 0) {
      const template = coreRecipes.find(r => r.id === bestIntent.targetRecipe);
      if (template) {
        return {
          id,
          version: 1,
          name: template.name,
          description: `Automated rule generated from: "${rawPrompt}"`,
          icon: template.icon,
          category: template.category,
          platforms: template.platforms || [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
          permissions: template.permissions || [],
          trigger: template.trigger || { type: 'manual' },
          steps: JSON.parse(JSON.stringify(template.steps))
        };
      }
    }

    // Default fallback: Custom Text Transformation Pipeline
    return {
      id,
      version: 1,
      name: `Custom Flow: ${rawPrompt.slice(0, 30)}`,
      description: rawPrompt,
      icon: 'Zap',
      category: Categories.CUSTOM,
      platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
      permissions: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
      trigger: { type: 'manual' },
      steps: [
        { id: 'step_read', actionId: 'clipboard.read', parameters: {} },
        { id: 'step_action', actionId: 'text.change_case', parameters: { text: '${steps.step_read.text}', targetCase: 'title' } },
        { id: 'step_write', actionId: 'clipboard.write', parameters: { text: '${steps.step_action.result}' } }
      ]
    };
  }
}
