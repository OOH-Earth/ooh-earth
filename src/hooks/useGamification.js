import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuthGatedSubscribe } from '@/hooks/useAuthGatedSubscribe';
import {
  BADGES,
  QUESTS,
  levelFromXp,
  pointsForReport,
  pointsForRecheck,
  deriveBrandCounts,
} from '@/components/ooh/gamification/gamification';
import { claimFeedback, missionStatus, periodMetrics } from '@/lib/missions';

export function useGamification() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [locations, setLocations] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [claimNotice, setClaimNotice] = useState(null); // { id, tone, text }

  const loadData = useCallback(async () => {
    try {
      const me = await base44.auth.me().catch(() => null);
      if (!me) {
        setLoading(false);
        return;
      }
      setUser(me);

      const [locations, busts, mints, leads, quests, fieldChecks] = await Promise.all([
        base44.listAllLocations().catch(() => []),
        base44.entities.DigitalBust.list('-created_date', 200).catch(() => []),
        base44.entities.Mint.list('-created_date', 100).catch(() => []),
        base44.entities.LeadClaim.list('-created_date', 200).catch(() => []),
        // Only the caller's own claims — the board never needs anyone else's.
        base44.entities.QuestCompletion.filter(
          { created_by_id: me.id },
          '-created_date',
          100,
        ).catch(() => []),
        base44.entities.FieldCheck.list('-created_date', 200).catch(() => []),
      ]);

      setCompletions(quests || []);

      const mine = (arr) => (arr || []).filter((r) => r.created_by_id === me.id);
      const myLocs = mine(locations);
      const myBusts = mine(busts);
      const myMints = mine(mints);
      const myLeads = mine(leads);
      const myQuests = mine(quests);
      const myFieldChecks = mine(fieldChecks);

      const baseXp =
        myLocs.reduce((s, r) => s + pointsForReport(r), 0) +
        myFieldChecks.reduce((s, r) => s + pointsForRecheck(r), 0) +
        myBusts.length * 15 +
        myMints.length * 100 +
        myLeads.length * 5;
      const questXp = myQuests.reduce((s, q) => s + (q.xp_awarded || 0), 0);

      // Streak — consecutive days with any contribution, including re-checks
      // (a re-check is a genuine field visit, not a lesser action)
      const activeDates = new Set();
      [...myLocs, ...myBusts, ...myFieldChecks].forEach((r) => {
        if (r.created_date) activeDates.add(r.created_date.slice(0, 10));
      });
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (activeDates.has(d.toISOString().slice(0, 10))) streak++;
        else if (i > 0) break;
      }

      // Same already-fetched, already-filtered array every stat above is
      // derived from -- exposed as-is so callers (e.g. a "recent
      // discoveries" feed) can reuse it instead of issuing a second
      // Location fetch.
      setLocations(myLocs);

      setStats({
        reports: myLocs.length,
        verified: myLocs.filter((r) => r.status === 'verified').length,
        photos: myLocs.filter((r) => r.image_url).length,
        busts: myBusts.length,
        mints: myMints.length,
        leads: myLeads.length,
        // Folded into baseXp via pointsForRecheck() -- deliberately smaller
        // than a new report (see pointsConfig.js), previously exactly 0.
        rechecks: myFieldChecks.length,
        rechecksVerified: myFieldChecks.filter((r) => r.status === 'verified').length,
        xp: baseXp + questXp,
        baseXp,
        questXp,
        streak,
        brandCounts: deriveBrandCounts(myLocs),
        // Same UTC windows and records claimQuest counts server-side.
        ...periodMetrics({ locations: myLocs, busts: myBusts, mints: myMints }),
      });
    } catch {
      /* offline */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useAuthGatedSubscribe('Location', () => loadData());

  const level = stats ? levelFromXp(stats.xp) : null;
  const earnedBadges = stats ? BADGES.filter((b) => b.check(stats)) : [];

  const questStatus = stats ? missionStatus(QUESTS, stats, completions, user?.id) : [];

  // The server decides; the board only offers Claim when its (identical)
  // rules say the mission is complete, then shows whatever the server says.
  const claimQuest = useCallback(
    async (questId) => {
      const quest = questStatus.find((q) => q.id === questId);
      if (!quest || !user || quest.claimed || !quest.complete) return;

      setClaiming(questId);
      setClaimNotice(null);
      let result;
      try {
        const res = await base44.functions.invoke('claimQuest', { quest_id: questId });
        result = res?.data || {};
      } catch (err) {
        result = { status: err?.response?.status ?? err?.status };
      }
      setClaimNotice({ id: questId, ...claimFeedback(result) });
      try {
        await loadData();
      } finally {
        setClaiming(null);
      }
    },
    [user, questStatus, loadData],
  );

  return {
    user,
    stats,
    locations,
    level,
    earnedBadges,
    allBadges: BADGES,
    questStatus,
    claimQuest,
    claiming,
    claimNotice,
    loading,
    refresh: loadData,
  };
}
