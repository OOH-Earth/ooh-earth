import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { detectChanges } from '@/lib/fieldCheckFreshness';

const DEFAULT_LIMIT = 12;

// A platform-wide "what's actually changing in the field" feed -- turns
// the existing per-location "What changed" derivation (FieldCheckPanel.jsx,
// shared via src/lib/fieldCheckFreshness.js) into an aggregate view instead
// of something only visible one /location/:id at a time. Deliberately
// conservative: only locations with 2+ VERIFIED re-checks are eligible (a
// genuine "we observed this twice and it changed" signal), never a
// single-check-vs-original-intake comparison -- that weaker signal is left
// to the per-location page, not surfaced as a platform-wide claim. No new
// entity, no new backend function: one Location fetch + one FieldCheck
// fetch, the same shape Map.jsx's reloadLocations() already pays for
// elsewhere.
export function useRecentFieldChanges(limit = DEFAULT_LIMIT) {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [locations, checks] = await Promise.all([
          base44.listAllLocations(),
          base44.entities.FieldCheck.filter({ status: 'verified' }, '-created_date', 2000).catch(
            () => [],
          ),
        ]);
        if (!active) return;

        const checksByLocation = {};
        for (const c of checks || []) {
          const key = String(c.location_id);
          (checksByLocation[key] ??= []).push(c);
        }
        const locationById = {};
        for (const l of locations || []) locationById[String(l.id)] = l;

        const results = [];
        for (const [locationId, checksForLoc] of Object.entries(checksByLocation)) {
          if (checksForLoc.length < 2) continue;
          const location = locationById[locationId];
          if (!location || location.status === 'rejected') continue;
          const [latest, earlier] = checksForLoc; // already sorted -created_date
          const diff = detectChanges(latest, earlier);
          if (diff.length > 0) {
            results.push({ location, changes: diff, detectedAt: latest.created_date });
          }
        }
        results.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
        setChanges(results.slice(0, limit));
      } catch {
        if (active) setChanges([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [limit]);

  return { changes, loading };
}
