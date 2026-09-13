import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AndroidShareReceiver, IOSShareExtensionBridge } from '../apps/mobile/src/index.js';

describe('OPERON Mobile Adapters (Android & iOS)', () => {
  test('AndroidShareReceiver should route ACTION_SEND URL to clean_url recipe', async () => {
    const receiver = new AndroidShareReceiver();
    const intent = {
      action: 'android.intent.action.SEND',
      type: 'text/plain',
      extraText: 'https://example.com/share?utm_source=android_app&post_id=9012'
    };

    const result = await receiver.handleIntent(intent);
    assert.equal(result.matchedRecipeId, 'recipe_clean_url');
    assert.equal(result.executionStatus, 'success');
  });

  test('IOSShareExtensionBridge should process incoming photo share payload', async () => {
    const bridge = new IOSShareExtensionBridge();
    const item = {
      imagePaths: ['/var/mobile/Containers/Data/Application/IMG_1024.HEIC']
    };

    const result = await bridge.processShareItem(item);
    assert.equal(result.matchedRecipeId, 'recipe_strip_exif');
    assert.equal(result.status, 'success');
  });
});
