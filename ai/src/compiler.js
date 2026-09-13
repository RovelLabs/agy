/**
 * OPERON Local AI Workflow Compiler
 * Compiles natural language prompts into typed, schema-validated IWorkflow objects
 */
import { AIPlanValidator } from './validator.js';
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

    // Rule 1: Clean URL tracking parameters
    if (
      lower.includes('clean url') || lower.includes('strip tracking') || 
      lower.includes('очистить ссылку') || lower.includes('убрать utm') || lower.includes('remove utm')
    ) {
      return {
        id,
        version: 1,
        name: 'Clean Tracking URLs',
        description: `Automated rule generated from: "${rawPrompt}"`,
        icon: 'Link2Off',
        category: Categories.TEXT,
        platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
        permissions: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
        trigger: { type: 'manual' },
        steps: [
          { id: 'step_read', actionId: 'clipboard.read', parameters: {} },
          { id: 'step_clean', actionId: 'text.clean_url', parameters: { text: '${steps.step_read.text}' } },
          { id: 'step_write', actionId: 'clipboard.write', parameters: { text: '${steps.step_clean.cleanedText}' } }
        ]
      };
    }

    // Rule 2: JSON formatting / validation
    if (
      lower.includes('format json') || lower.includes('beautify json') || 
      lower.includes('форматировать json') || lower.includes('валидация json') || lower.includes('indent json')
    ) {
      return {
        id,
        version: 1,
        name: 'Format & Indent JSON',
        description: `Automated rule generated from: "${rawPrompt}"`,
        icon: 'FileJson',
        category: Categories.DEVELOPER,
        platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
        permissions: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
        trigger: { type: 'manual' },
        steps: [
          { id: 'step_read', actionId: 'clipboard.read', parameters: {} },
          { id: 'step_format', actionId: 'text.format_json', parameters: { text: '${steps.step_read.text}', indent: 2 } },
          { id: 'step_write', actionId: 'clipboard.write', parameters: { text: '${steps.step_format.formattedText}' } }
        ]
      };
    }

    // Rule 3: Image compression / WebP conversion
    if (
      lower.includes('convert to webp') || lower.includes('compress image') || 
      lower.includes('конвертировать в webp') || lower.includes('сжать картинки') || lower.includes('webp')
    ) {
      return {
        id,
        version: 1,
        name: 'Compress Images to WebP',
        description: `Automated rule generated from: "${rawPrompt}"`,
        icon: 'ImageDown',
        category: Categories.IMAGE,
        platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
        permissions: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE],
        trigger: { type: 'file_drop' },
        steps: [
          {
            id: 'step_convert',
            actionId: 'image.convert_format',
            parameters: { filePaths: '${input.files}', targetFormat: 'webp', quality: 85 }
          }
        ]
      };
    }

    // Rule 4: Batch rename files with date/sequence
    if (
      lower.includes('rename file') || lower.includes('batch rename') || 
      lower.includes('переименовать файлы') || lower.includes('rename screenshots')
    ) {
      return {
        id,
        version: 1,
        name: 'Batch Rename with Date & Counter',
        description: `Automated rule generated from: "${rawPrompt}"`,
        icon: 'FileCode',
        category: Categories.FILE,
        platforms: [Platforms.WINDOWS, Platforms.MACOS],
        permissions: [Capabilities.FILESYSTEM_READ, Capabilities.FILESYSTEM_WRITE],
        trigger: { type: 'file_drop' },
        steps: [
          {
            id: 'step_rename',
            actionId: 'file.batch_rename',
            parameters: { files: '${input.files}', pattern: '{date}_{counter}_{name}.{ext}', startIndex: 1 }
          }
        ]
      };
    }

    // Rule 5: Summarize text locally
    if (
      lower.includes('summarize') || lower.includes('summary') || 
      lower.includes('резюмировать') || lower.includes('краткое содержание')
    ) {
      return {
        id,
        version: 1,
        name: 'Local Text Summary',
        description: `Automated rule generated from: "${rawPrompt}"`,
        icon: 'AlignLeft',
        category: Categories.TEXT,
        platforms: [Platforms.WINDOWS, Platforms.MACOS, Platforms.ANDROID, Platforms.IOS],
        permissions: [Capabilities.CLIPBOARD_READ],
        trigger: { type: 'manual' },
        steps: [
          { id: 'step_read', actionId: 'clipboard.read', parameters: {} },
          { id: 'step_sum', actionId: 'text.summarize_local', parameters: { text: '${steps.step_read.text}', maxSentences: 3 } }
        ]
      };
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
