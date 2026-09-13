/**
 * OPERON Action Registry
 */
import { textActions } from './actions/text.js';
import { clipboardActions } from './actions/clipboard.js';
import { fileActions } from './actions/file.js';
import { imageActions } from './actions/image.js';
import { developerActions } from './actions/developer.js';
import { systemActions } from './actions/system.js';

export class ActionRegistry {
  constructor() {
    this.actions = new Map();
    this.registerStandardLibrary();
  }

  registerStandardLibrary() {
    const all = [
      ...textActions,
      ...clipboardActions,
      ...fileActions,
      ...imageActions,
      ...developerActions,
      ...systemActions
    ];

    for (const action of all) {
      this.register(action);
    }
  }

  register(action) {
    if (!action.id) throw new Error('Action must have an id');
    if (typeof action.execute !== 'function') throw new Error(`Action ${action.id} must have an execute function`);
    this.actions.set(action.id, action);
  }

  get(actionId) {
    return this.actions.get(actionId);
  }

  has(actionId) {
    return this.actions.has(actionId);
  }

  list() {
    return Array.from(this.actions.values());
  }

  listByCategory(category) {
    return this.list().filter(a => a.category === category);
  }

  listForPlatform(platform) {
    return this.list().filter(a => !a.supportedPlatforms || a.supportedPlatforms.includes(platform));
  }
}

export const defaultActionRegistry = new ActionRegistry();
