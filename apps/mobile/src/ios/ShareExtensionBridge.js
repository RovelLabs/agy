/**
 * OPERON iOS Platform Adapter: ShareExtension & App Intents Bridge
 */
import { WorkflowEngine, coreRecipes, ExecutionStatus } from '../../../../packages/core/src/index.js';

export class IOSShareExtensionBridge {
  constructor(options = {}) {
    this.engine = new WorkflowEngine({
      platform: 'ios',
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
   * Processes an incoming NSExtensionItem payload from the iOS Share Sheet
   */
  async processShareItem(extensionItem) {
    if (!extensionItem) {
      throw new Error('Missing iOS NSExtensionItem payload');
    }

    const { url, text, imagePaths } = extensionItem;

    let targetRecipe = null;
    let inputPayload = {};

    if (imagePaths && imagePaths.length > 0) {
      targetRecipe = coreRecipes.find(r => r.id === 'recipe_strip_exif');
      inputPayload = { files: imagePaths };
    } else if (url || (text && (text.startsWith('http://') || text.startsWith('https://')))) {
      targetRecipe = coreRecipes.find(r => r.id === 'recipe_clean_url');
      inputPayload = { text: url || text };
    } else {
      targetRecipe = coreRecipes.find(r => r.id === 'recipe_summarize_local');
      inputPayload = { text: text || '' };
    }

    const execResult = await this.engine.execute(targetRecipe, inputPayload);

    return {
      iosBridge: 'ShareExtension',
      matchedRecipeId: targetRecipe.id,
      status: execResult.status,
      durationMs: execResult.durationMs,
      output: execResult.output
    };
  }
}
