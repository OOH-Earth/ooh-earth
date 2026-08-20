import { useEffect, useRef, useState } from 'react';

const KEY_PREFIX = 'ooh-seen-badges-';

/**
 * Recognizes badges that became earned since this user's last visit --
 * distinct from FieldReport's newlyUnlocked, which only ever sees a
 * crossing caused by the single report just submitted. This also catches
 * a badge that became earned some other way while the user was away (an
 * older report getting verified, an NFT mint, etc.), using the same
 * already-live `earnedBadges` -- no new fetch, no backend.
 *
 * Per-user localStorage snapshot of previously-seen earned badge ids
 * (`usePersistentState`'s try/catch-everywhere pattern, inlined here since
 * this needs a one-time compare-then-advance on mount, not a live-bound
 * state value). A missing snapshot means a genuine first visit for this
 * user on this browser -- the baseline is established silently, never
 * shown as a wall of "new" badges. Computed once per mount (not on every
 * live stats refresh) so the result doesn't reset out from under the user
 * before they've had a chance to see it.
 */
export function useNewBadgeRecognition(user, earnedBadges, loading) {
  const [newBadges, setNewBadges] = useState([]);
  const computedRef = useRef(false);

  useEffect(() => {
    if (loading || !user || computedRef.current) return;
    computedRef.current = true;

    const key = `${KEY_PREFIX}${user.id}`;
    const currentIds = earnedBadges.map((b) => b.id);
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) {
        // First-ever visit for this user on this browser -- establish the
        // baseline only, no historical badges are "new".
        localStorage.setItem(key, JSON.stringify(currentIds));
        return;
      }
      const seenIds = new Set(JSON.parse(stored));
      const fresh = earnedBadges.filter((b) => !seenIds.has(b.id));
      if (fresh.length) setNewBadges(fresh);
      localStorage.setItem(key, JSON.stringify(currentIds));
    } catch {
      // localStorage unavailable/blocked -- fail silently, no recognition,
      // rest of the app unaffected.
    }
  }, [loading, user, earnedBadges]);

  return newBadges;
}
