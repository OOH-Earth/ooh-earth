import { base44 } from '@/api/base44Client';
import { getSessionAttribution } from '@/lib/attribution';

const FUNNEL_EVENTS = new Set([
  'qualified_visit',
  'map_engaged',
  'location_viewed',
  'report_started',
  'report_submitted',
  'support_viewed',
  'plans_viewed',
  'store_viewed',
  'professional_intent',
  'checkout_started',
]);

// Thin, fail-silent wrapper around the Base44 SDK's own analytics module
// (base44.analytics.track -- already wired up by createClient() in
// base44Client.js, already fire-and-forget/batched/non-blocking on its
// own). This wrapper exists only so call sites never need their own
// try/catch: an analytics error must never surface to the user or affect
// the action it's attached to.
export function trackEvent(eventName, properties) {
  try {
    const attribution = getSessionAttribution();
    base44.analytics?.track?.({
      eventName,
      properties: { ...attribution, ...(properties || {}) },
    });
    if (FUNNEL_EVENTS.has(eventName)) {
      const path = attribution.landing_path || window.location.pathname || '/';
      Promise.resolve(
        base44.functions?.invoke?.('funnelMetrics', {
          event_name: eventName,
          source: attribution.utm_source || 'direct',
          medium: attribution.utm_medium || 'direct',
          campaign: attribution.utm_campaign || 'none',
          landing_path: path,
        }),
      ).catch(() => {});
    }
  } catch {
    /* analytics must never break the action it's attached to */
  }
}
