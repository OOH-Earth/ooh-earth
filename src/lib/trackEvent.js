import { base44 } from '@/api/base44Client';
import { getSessionAttribution } from '@/lib/attribution';

// Thin, fail-silent wrapper around the Base44 SDK's own analytics module
// (base44.analytics.track -- already wired up by createClient() in
// base44Client.js, already fire-and-forget/batched/non-blocking on its
// own). This wrapper exists only so call sites never need their own
// try/catch: an analytics error must never surface to the user or affect
// the action it's attached to.
export function trackEvent(eventName, properties) {
  try {
    base44.analytics?.track?.({
      eventName,
      properties: { ...getSessionAttribution(), ...(properties || {}) },
    });
  } catch {
    /* analytics must never break the action it's attached to */
  }
}
