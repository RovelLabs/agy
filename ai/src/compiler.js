/**
 * OPERON Local AI Workflow Compiler
 * Compiles natural language prompts into typed, schema-validated IWorkflow objects
 * Hardened against adversarial attacks, destructive commands, and ambiguous input
 */
import { AIPlanValidator } from './validator.js';
import { IntentTaxonomy } from './taxonomy.js';
import { coreRecipes } from '../../packages/core/src/recipes.js';
import { Categories, Capabilities, Platforms } from '../../packages/core/src/types.js';

const DANGEROUS_PATTERNS = [
  /rm\s+-rf/i,
  /del\s+.*[\\\/]s/i,
  /format\s+[a-z]:/i,
  /drop\s+database/i,
  /drop\s+table/i,
  /:\(\)\s*\{\s*:\|\s*:\&\s*\};:/,
  /:\(\)\s*\{/,
  /mkfs/i,
  /dd\s+if=/i,
  /killall\s+-9/i,
  /shutdown\s+-[sr]/i
];

export class AIWorkflowCompiler {
  constructor(options = {}) {
    this.providerName = options.providerName || 'deterministic-slm';
  }

  /**
   * Main compilation entrypoint: Natural Language -> Validated Workflow Draft
   */
  async compile(prompt, context = {}) {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return {
        prompt: prompt || '',
        provider: this.providerName,
        compiledAt: new Date().toISOString(),
        workflowDraft: null,
        safetyFlag: 'EMPTY_INPUT',
        readyForUserPreview: false,
        error: 'Compilation prompt cannot be empty.'
      };
    }

    const cleanPrompt = prompt.trim().toLowerCase();

    // 1. Safety Guard: Detect destructive operating system commands
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(cleanPrompt)) {
        return {
          prompt,
          provider: this.providerName,
          compiledAt: new Date().toISOString(),
          workflowDraft: null,
          safetyFlag: 'BLOCKED_DANGEROUS_COMMAND',
          isDangerous: true,
          readyForUserPreview: false,
          error: 'Safety Guard: Prompt contains potentially destructive operating system patterns and was blocked.'
        };
      }
    }

    // 2. Multi-Step & Scheduled Automation Detection
    if (this.isScheduledArchiveRoutine(cleanPrompt)) {
      const scheduledDraft = this.buildScheduledArchiveWorkflow(prompt.trim());
      const validation = AIPlanValidator.validate(scheduledDraft);
      return {
        prompt,
        provider: this.providerName,
        compiledAt: new Date().toISOString(),
        workflowDraft: scheduledDraft,
        validation,
        isMultiStep: true,
        isScheduled: true,
        requiresUserApproval: true,
        readyForUserPreview: validation.valid
      };
    }

    // 3. Deterministic NLP Rule & Taxonomy Resolution
    const draft = this.compileDeterministicRule(cleanPrompt, prompt.trim(), context);

    if (!draft) {
      return {
        prompt,
        provider: this.providerName,
        compiledAt: new Date().toISOString(),
        workflowDraft: null,
        safetyFlag: 'UNSUPPORTED_OR_AMBIGUOUS',
        readyForUserPreview: false,
        error: 'Could not resolve a safe automation matching your request. Please rephrase or specify explicit actions.'
      };
    }

    // 4. Validate draft against safety schemas
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

  isScheduledArchiveRoutine(lower) {
    const hasSchedule = lower.includes('каждый вечер') || lower.includes('каждый день') ||
                        lower.includes('every evening') || lower.includes('every night') ||
                        lower.includes('every day');
    const hasArchive = lower.includes('складывай') || lower.includes('архив') ||
                       lower.includes('archive') || lower.includes('zip');
    return hasSchedule && hasArchive;
  }

  buildScheduledArchiveWorkflow(rawPrompt) {
    const id = `wf_ai_sched_${Date.now()}`;
    return {
      id,
      version: 1,
      name: 'Scheduled Routine: Archive & Compress',
      description: `Constructed from prompt: "${rawPrompt}"`,
      icon: 'FolderArchive',
      category: Categories.FILE,
      platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
      permissions: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE, Capabilities.NOTIFICATIONS_SEND],
      trigger: {
        type: 'schedule',
        cron: '0 20 * * *',
        label: 'Every evening at 20:00'
      },
      steps: [
        {
          id: 'step_organize',
          actionId: 'file.organize_directory',
          parameters: { directoryPath: '${env.USERPROFILE}/Screenshots', mode: 'category' }
        },
        {
          id: 'step_zip',
          actionId: 'file.compress_zip',
          parameters: { sourcePaths: ['${steps.step_organize.organizedDirectory}'], outputPath: '${env.USERPROFILE}/ScreenshotsArchive.zip' }
        },
        {
          id: 'step_notify',
          actionId: 'system.notify',
          parameters: { title: 'Routine Completed', message: 'Old screenshots successfully packaged into archive.' }
        }
      ]
    };
  }

  compileDeterministicRule(lower, rawPrompt, context) {
    // Filter purely random punctuation or gibberish
    if (/^[^a-zA-Z0-9\u0400-\u04FF]+$/.test(lower) || lower.length < 3) {
      return null;
    }

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

    if (bestIntent && highestScore >= 6) {
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

    // Return null if below recognition threshold rather than hallucinating
    return null;
  }
}
