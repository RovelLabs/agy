/**
 * OPERON Privacy-Preserving Analytics Collector
 * Strictly enforces zero telemetry by default and zero private data leakage
 */
import { AnalyticsEvent } from './events.js';

export class PrivacyAnalyticsCollector {
  constructor(options = {}) {
    this.optIn = options.optIn ?? false;
    this.eventsBuffer = [];
    this.aggregateCounters = new Map();
  }

  setOptIn(enabled) {
    this.optIn = Boolean(enabled);
    if (!this.optIn) {
      this.eventsBuffer = [];
      this.aggregateCounters.clear();
    }
  }

  /**
   * Tracks a strictly sanitized analytics event
   */
  track(eventName, metadata = {}) {
    if (!this.optIn) return { recorded: false, reason: 'telemetry_disabled' };

    // Verify event is in whitelist
    if (!Object.values(AnalyticsEvent).includes(eventName)) {
      console.warn(`[Analytics] Blocked unwhitelisted event: ${eventName}`);
      return { recorded: false, reason: 'unwhitelisted_event' };
    }

    // Sanitize metadata: strictly drop any sensitive/personal data patterns
    const sanitized = {};
    for (const [key, value] of Object.entries(metadata)) {
      // Whitelisted non-sensitive keys only
      const safeKeys = new Set([
        'category', 'platform', 'tier', 'durationBracket', 'status',
        'recipeId', 'currency', 'plan', 'screen', 'stepCount'
      ]);

      if (!safeKeys.has(key)) continue;

      if (typeof value === 'string') {
        // Redact if looks like a path, email, URL, or credential
        if (
          value.includes('http://') || value.includes('https://') ||
          value.includes('@') || value.includes('\\') || value.includes('/') ||
          value.length > 60
        ) {
          continue;
        }
      }
      sanitized[key] = value;
    }

    const record = {
      event: eventName,
      timestamp: Date.now(),
      properties: sanitized
    };

    this.eventsBuffer.push(record);
    this.aggregateCounters.set(eventName, (this.aggregateCounters.get(eventName) || 0) + 1);

    return { recorded: true, record };
  }

  getAggregateCounters() {
    return Object.fromEntries(this.aggregateCounters);
  }

  getBufferedEvents() {
    return [...this.eventsBuffer];
  }

  clear() {
    this.eventsBuffer = [];
  }
}
