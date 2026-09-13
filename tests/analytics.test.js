import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PrivacyAnalyticsCollector, AnalyticsEvent } from '../packages/analytics/src/index.js';

describe('OPERON Privacy-Preserving Commercial Analytics Subsystem', () => {
  test('Collector must not record anything when opt-in is false', () => {
    const collector = new PrivacyAnalyticsCollector({ optIn: false });
    const res = collector.track(AnalyticsEvent.APP_LAUNCHED);

    assert.equal(res.recorded, false);
    assert.equal(res.reason, 'telemetry_disabled');
    assert.equal(collector.getBufferedEvents().length, 0);
  });

  test('Collector must record whitelisted events when opt-in is true', () => {
    const collector = new PrivacyAnalyticsCollector({ optIn: true });
    
    collector.track(AnalyticsEvent.FIRST_WORKFLOW_SUCCESS, {
      category: 'text',
      platform: 'windows'
    });

    const events = collector.getBufferedEvents();
    assert.equal(events.length, 1);
    assert.equal(events[0].event, AnalyticsEvent.FIRST_WORKFLOW_SUCCESS);
    assert.equal(events[0].properties.category, 'text');
    assert.equal(events[0].properties.platform, 'windows');
  });

  test('Collector must sanitize and drop private data patterns (URLs, emails, paths)', () => {
    const collector = new PrivacyAnalyticsCollector({ optIn: true });

    collector.track(AnalyticsEvent.WORKFLOW_EXECUTED, {
      category: 'file',
      // The following sensitive keys/values must be stripped:
      dirtyUrl: 'https://secret.bank.com/user?token=xyz',
      userEmail: 'ceo@confidential.com',
      filePath: 'C:\\Users\\admin\\SecretDoc.pdf',
      clipboardRaw: 'Confidential corporate source code snippet'
    });

    const recorded = collector.getBufferedEvents()[0];
    assert.equal(recorded.properties.category, 'file');
    assert.equal(recorded.properties.dirtyUrl, undefined);
    assert.equal(recorded.properties.userEmail, undefined);
    assert.equal(recorded.properties.filePath, undefined);
    assert.equal(recorded.properties.clipboardRaw, undefined);
  });
});
