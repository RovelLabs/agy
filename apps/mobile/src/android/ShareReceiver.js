/**
 * OPERON Android Platform Adapter: Intent & Share Sheet Receiver
 */
import { WorkflowEngine, coreRecipes, ExecutionStatus } from '../../../../packages/core/src/index.js';

export class AndroidShareReceiver {
  constructor(options = {}) {
    this.engine = new WorkflowEngine({
      platform: 'android',
      grantedCapabilities: options.grantedCapabilities || [
        'clipboard.read',
        'clipboard.write',
        'filesystem.read',
        'filesystem.write',
        'notifications.send'
      ]
    });
  }

  /**
   * Handles incoming Android Intent (ACTION_SEND or ACTION_SEND_MULTIPLE)
   */
  async handleIntent(intent) {
    if (!intent || !intent.action) {
      throw new Error('Invalid Android Intent payload');
    }

    const input = {
      action: intent.action,
      type: intent.type || 'text/plain',
      text: intent.extraText || null,
      uris: intent.extraStreamUris || []
    };

    // Auto-select best matching recipe based on intent type
    let targetRecipe = null;

    if (input.type.startsWith('image/')) {
      // Compress / Strip EXIF
      targetRecipe = coreRecipes.find(r => r.id === 'recipe_compress_webp');
    } else if (input.text && (input.text.startsWith('http://') || input.text.startsWith('https://'))) {
      // Clean Tracking URL
      targetRecipe = coreRecipes.find(r => r.id === 'recipe_clean_url');
    } else if (input.text && (input.text.trim().startsWith('{') || input.text.trim().startsWith('['))) {
      // Format JSON
      targetRecipe = coreRecipes.find(r => r.id === 'recipe_format_json');
    } else {
      // Default: Clean tracking or summarize
      targetRecipe = coreRecipes.find(r => r.id === 'recipe_clean_url');
    }

    const execResult = await this.engine.execute(targetRecipe, {
      text: input.text,
      files: input.uris
    });

    return {
      intentAction: intent.action,
      matchedRecipeId: targetRecipe.id,
      executionStatus: execResult.status,
      durationMs: execResult.durationMs,
      output: execResult.output
    };
  }
}
