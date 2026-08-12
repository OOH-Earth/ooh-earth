import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  BADGES,
  QUESTS,
  levelFromXp,
  pointsForReport,
  isToday,
  isThisWeek,
  periodKey,
} from '@/components/ooh/gamification/gamification';

export function useGamification() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const me = await base44.auth.me().catch(() => null);
      if (!me) {
        setLoading(false);
        return;
      }
      setUser(me);

      const [locations, busts, mints, leads, quests] = await Promise.all([
        base44.listAllLocations().catch(() => []),
        base44.entities.DigitalBust.list('-created_date', 200).catch(() => []),
        base44.entities.Mint.list('-created_date', 100).catch(() => []),
        base44.entities.LeadClaim.list('-created_date', 200).catch(() => []),
        base44.entities.QuestCompletion.list('-created_date', 200).catch(() => []),
      ]);

      setCompletions(quests || []);

      const mine = (arr) => (arr || []).filter((r) => r.created_by_id === me.id);
      const myLocs = mine(locations);
      const myBusts = mine(busts);
      const myMints = mine(mints);
      const myLeads = mine(leads);
      const myQuests = mine(quests);

      const baseXp =
        myLocs.reduce((s, r) => s + pointsForReport(r), 0) +
        myBusts.length * 15 +
        myMints.length * 100 +
        myLeads.length * 5;
      const questXp = myQuests.reduce((s, q) => s + (q.xp_awarded || 0), 0);

      // Streak — consecutive days with any contribution
      const activeDates = new Set();
      [...myLocs, ...myBusts].forEach((r) => {
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

      setStats({
        reports: myLocs.length,
        verified: myLocs.filter((r) => r.status === 'verified').length,
        photos: myLocs.filter((r) => r.image_url).length,
        busts: myBusts.length,
        mints: myMints.length,
        leads: myLeads.length,
        xp: baseXp + questXp,
        baseXp,
        questXp,
        streak,
        dailyReports: myLocs.filter((r) => isToday(r.created_date)).length,
        weeklyReports: myLocs.filter((r) => isThisWeek(r.created_date)).length,
        dailyPhotos: myLocs.filter((r) => isToday(r.created_date) && r.image_url).length,
        weeklyBusts: myBusts.filter((r) => isThisWeek(r.created_date)).length,
        weeklyMints: myMints.filter((r) => isThisWeek(r.created_date)).length,
      });
    } catch {
      /* offline */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsub = base44.entities.Location.subscribe(() => loadData());
    return () => {
      if (unsub) unsub();
    };
  }, [loadData]);

  const level = stats ? levelFromXp(stats.xp) : null;
  const earnedBadges = stats ? BADGES.filter((b) => b.check(stats)) : [];

  const questStatus = stats
    ? QUESTS.map((q) => {
        const period = periodKey(q.type);
        const claimed = completions.some(
          (c) => c.quest_id === q.id && c.period_key === period && c.created_by_id === user?.id,
        );
        const progress = Math.min(stats[q.metric] || 0, q.target);
        return { ...q, period, progress, complete: progress >= q.target, claimed };
      })
    : [];

  const claimQuest = useCallback(
    async (questId) => {
      const quest = QUESTS.find((q) => q.id === questId);
      if (!quest || !user) return;
      const period = periodKey(quest.type);
      const already = completions.some(
        (c) => c.quest_id === questId && c.period_key === period && c.created_by_id === user.id,
      );
      if (already) return;
      if ((stats?.[quest.metric] || 0) < quest.target) return;

      setClaiming(questId);
      try {
        await base44.functions.invoke('claimQuest', { quest_id: questId });
        await loadData();
      } catch {
        /* error */
      } finally {
        setClaiming(null);
      }
    },
    [user, completions, stats, loadData],
  );

  return {
    user,
    stats,
    level,
    earnedBadges,
    allBadges: BADGES,
    questStatus,
    claimQuest,
    claiming,
    loading,
    refresh: loadData,
  };
}
