// Missions — the user-facing face of the existing Quest engine (QUESTS +
// the server-validated claimQuest function + QuestCompletion). No parallel
// completion/XP system: this only derives display state, using the same
// UTC period rules the server uses for eligibility (./questPeriod.js).

import { isCompletionInPeriod, isInPeriod, msUntilReset, periodKey } from './questPeriod.js';

export const MISSION_STATES = Object.freeze({
  AVAILABLE: 'available',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed', // done, reward not yet claimed
  CLAIMED: 'claimed',
});

export const MISSION_STATE_LABELS = {
  available: 'Available',
  in_progress: 'In progress',
  completed: 'Ready to claim',
  claimed: 'Claimed',
};

// Mirrors claimQuest's calculateProgress: same records, same windows.
export function periodMetrics({ locations = [], busts = [], mints = [] } = {}, now = new Date()) {
  /** @type {(rows: any[], type: string, keep?: (r: any) => boolean) => number} */
  const count = (rows, type, keep = () => true) =>
    (rows || []).filter((r) => isInPeriod(r?.created_date, type, now) && keep(r)).length;
  const hasPhoto = (r) => typeof r.image_url === 'string' && !!r.image_url;
  return {
    dailyReports: count(locations, 'daily'),
    dailyPhotos: count(locations, 'daily', hasPhoto),
    weeklyReports: count(locations, 'weekly'),
    weeklyBusts: count(busts, 'weekly'),
    weeklyMints: count(mints, 'weekly'),
  };
}

export function missionState({ progress, target, claimed }) {
  if (claimed) return MISSION_STATES.CLAIMED;
  if (progress >= target) return MISSION_STATES.COMPLETED;
  if (progress > 0) return MISSION_STATES.IN_PROGRESS;
  return MISSION_STATES.AVAILABLE;
}

export function missionStatus(quests, metrics, completions, userId, now = new Date()) {
  const mine = (completions || []).filter((c) => userId && c?.created_by_id === userId);
  return (quests || []).map((q) => {
    const claimed = mine.some((c) => isCompletionInPeriod(c, q.id, q.type, now));
    const progress = Math.min(Math.max(0, Number(metrics?.[q.metric]) || 0), q.target);
    const complete = progress >= q.target;
    return {
      ...q,
      period: periodKey(q.type, now),
      progress,
      complete,
      claimed,
      state: missionState({ progress, target: q.target, claimed }),
      resetsInMs: msUntilReset(q.type, now),
    };
  });
}

export function formatResetIn(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return 'now';
  const mins = Math.floor(ms / 60_000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(1, m)}m`;
}

// Server error text → honest, user-facing claim feedback.
export function claimFeedback(result) {
  if (result?.ok && result.already) return { tone: 'info', text: 'Already claimed this period.' };
  if (result?.ok) return { tone: 'ok', text: `+${result.xp_awarded} XP banked.` };
  const status = result?.status;
  if (status === 401) return { tone: 'warn', text: 'Log in to claim missions.' };
  if (status === 403) {
    return {
      tone: 'warn',
      text: 'Not complete yet by the server’s count (periods run on UTC). Try again after syncing.',
    };
  }
  return { tone: 'warn', text: 'Claim unavailable right now. Try again shortly.' };
}
