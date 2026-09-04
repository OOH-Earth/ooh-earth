import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  Camera,
  Zap,
  Coins,
  Target,
  Flame,
  Award,
  Layers,
  Radar,
  ArrowLeft,
  LogIn,
  RefreshCw,
} from 'lucide-react';
import Nav from '@/components/ooh/Nav';
import { useGamification } from '@/hooks/useGamification';
import { useNewBadgeRecognition } from '@/hooks/useNewBadgeRecognition';
import { nearestBrandMilestone } from '@/components/ooh/gamification/gamification';
import XpBar from '@/components/ooh/gamification/XpBar';
import BadgeGrid from '@/components/ooh/gamification/BadgeGrid';
import QuestTracker from '@/components/ooh/gamification/QuestTracker';
import BrandCollection from '@/components/ooh/gamification/BrandCollection';
import DiscoveryFeed from '@/components/ooh/gamification/DiscoveryFeed';
import NewBadgeRecognition from '@/components/ooh/gamification/NewBadgeRecognition';
import RecentChangesFeed from '@/components/ooh/RecentChangesFeed';

const RECENT_DISCOVERIES_LIMIT = 5;

const STAT_CARDS = [
  { key: 'reports', label: 'Reports', icon: FileText, color: 'text-silver' },
  { key: 'verified', label: 'Verified', icon: ShieldCheck, color: 'text-brand-green' },
  { key: 'photos', label: 'Photos', icon: Camera, color: 'text-flare' },
  { key: 'busts', label: 'Busts', icon: Zap, color: 'text-flare' },
  { key: 'mints', label: 'Mints', icon: Coins, color: 'text-ozone' },
  { key: 'leads', label: 'Leads', icon: Target, color: 'text-ozone' },
  { key: 'rechecks', label: 'Re-checks', icon: RefreshCw, color: 'text-ozone' },
];

function StatCard({ label, value, Icon, color }) {
  return (
    <div className="border border-slate2/60 bg-card p-3 text-center">
      <Icon className={`mx-auto h-4 w-4 ${color}`} />
      <div className="mt-1.5 font-mono text-xl font-bold tabular text-silver">{value}</div>
      <div className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-dim">{label}</div>
    </div>
  );
}

export default function OperativeProfile() {
  const {
    user,
    stats,
    locations,
    level,
    earnedBadges,
    allBadges,
    questStatus,
    claimQuest,
    claiming,
    loading,
  } = useGamification();

  const newBadges = useNewBadgeRecognition(user, earnedBadges, loading);

  const recentDiscoveries = useMemo(() => {
    if (!stats || !locations) return [];
    const earnedIds = new Set(earnedBadges.map((b) => b.id));
    const brandIdentified = locations.filter((l) => l.brand_name?.trim());

    // Chronological (oldest -> newest) pass over every brand-identified
    // report this user has ever filed, giving each one two real, derived
    // (never fabricated) sequence numbers: its overall filing order
    // ("Discovery #N") and its order within just its own brand ("this was
    // my Kth Nike discovery"). Without this, repeat-brand cards previously
    // rendered as near-identical -- same brand, same aggregate total,
    // same milestone line -- differing only by timestamp.
    const chronological = [...brandIdentified].sort(
      (a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime(),
    );
    const brandRunningCount = new Map();
    const ordinalForBrandById = new Map();
    chronological.forEach((loc) => {
      const key = loc.brand_name.trim().toLowerCase();
      const next = (brandRunningCount.get(key) || 0) + 1;
      brandRunningCount.set(key, next);
      ordinalForBrandById.set(loc.id, next);
    });
    const discoveryNumberById = new Map(chronological.map((loc, i) => [loc.id, i + 1]));

    return [...brandIdentified]
      .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
      .slice(0, RECENT_DISCOVERIES_LIMIT)
      .map((location) => {
        const brandKey = location.brand_name.trim().toLowerCase();
        const brandEntry = stats.brandCounts.find((b) => b.brand.toLowerCase() === brandKey);
        const totalForBrand = brandEntry?.count || 1;
        const ordinalForBrand = ordinalForBrandById.get(location.id) || 1;
        // Same rule as FieldReport's live Discovery panel: a brand's FIRST
        // discovery is what actually moved the distinct-brand (Explorer)
        // count; every later repeat only moves that brand's own
        // (Collector) count. Show the track this specific report
        // genuinely contributed to, not whichever is globally closest.
        const track = ordinalForBrand === 1 ? 'explorer' : 'collector';
        return {
          location,
          ordinalForBrand,
          totalForBrand,
          discoveryNumber: discoveryNumberById.get(location.id),
          milestone: nearestBrandMilestone(allBadges, stats, totalForBrand, earnedIds, track),
        };
      });
  }, [stats, locations, earnedBadges, allBadges]);

  return (
    <div className="min-h-screen bg-void">
      <Nav />
      <main className="mx-auto max-w-5xl px-5 pb-24 page-top md:px-8">
        <Link
          to="/"
          className="mb-6 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray transition-colors hover:text-ozone"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to base
        </Link>

        {/* Platform-wide field intelligence -- public, not gated behind
            login: this is real accountability data, not a personal stat. */}
        <RecentChangesFeed />

        {loading ? (
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
            <span className="h-1.5 w-1.5 animate-flicker rounded-full bg-ozone" /> Compiling
            operative dossier…
          </div>
        ) : !user ? (
          <div className="border border-slate2/60 bg-card p-12 text-center">
            <LogIn className="mx-auto h-8 w-8 text-ozone" />
            <h1 className="mt-4 font-display text-2xl font-black uppercase text-silver">
              Authentication Required
            </h1>
            <p className="mt-2 font-display text-[0.875rem] text-darkgray">
              Log in to view your operative profile, badges, and quest progress.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Link
                to="/login"
                className="border border-ozone bg-ozone px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void hover:bg-flare hover:border-flare"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="border border-slate2 px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray hover:border-ozone hover:text-ozone"
              >
                Register
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
                // Operative Profile
              </span>
              <h1 className="font-display text-4xl font-black uppercase tracking-tight2 text-silver md:text-6xl">
                {user.full_name || user.email?.split('@')[0] || 'Anonymous'}
              </h1>
              <p className="mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-dim">
                {user.email} · Rank #{level?.level} {level?.title}
              </p>
            </div>

            <NewBadgeRecognition badges={newBadges} />

            {/* XP Bar */}
            <div className="mt-8">
              <XpBar xp={stats?.xp || 0} />
            </div>

            {/* Streak + stats */}
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="col-span-2 flex items-center gap-3 border border-flare/40 bg-card p-4 md:col-span-1">
                <Flame className="h-6 w-6 text-flare" />
                <div>
                  <div className="font-mono text-2xl font-bold tabular text-flare">
                    {stats?.streak || 0}
                  </div>
                  <div className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-dim">
                    Day streak
                  </div>
                </div>
              </div>
              {STAT_CARDS.map((s) => (
                <StatCard
                  key={s.key}
                  label={s.label}
                  value={stats?.[s.key] || 0}
                  Icon={s.icon}
                  color={s.color}
                />
              ))}
            </div>

            {/* Discovery feed */}
            <section className="mt-12">
              <div className="mb-4 flex items-center gap-2">
                <Radar className="h-4 w-4 text-ozone" />
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-silver">
                  Recent Discoveries
                </h2>
              </div>
              <DiscoveryFeed items={recentDiscoveries} />
            </section>

            {/* Brand collection */}
            <section className="mt-12">
              <div className="mb-4 flex items-center gap-2">
                <Layers className="h-4 w-4 text-ozone" />
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-silver">
                  Brand Collection
                </h2>
              </div>
              <BrandCollection brandCounts={stats?.brandCounts || []} />
            </section>

            {/* Quests */}
            <section className="mt-12">
              <div className="mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-ozone" />
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-silver">
                  Quest Board
                </h2>
              </div>
              <QuestTracker quests={questStatus} onClaim={claimQuest} claiming={claiming} />
            </section>

            {/* Badges */}
            <section className="mt-12">
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-4 w-4 text-ozone" />
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-silver">
                  Merit Badges
                </h2>
              </div>
              <BadgeGrid earnedIds={earnedBadges.map((b) => b.id)} stats={stats} />
            </section>

            {/* XP breakdown */}
            <section className="mt-12">
              <div className="mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-ozone" />
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-silver">
                  XP Breakdown
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="border border-slate2/60 bg-card p-4">
                  <div className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-dim">
                    Field contributions
                  </div>
                  <div className="mt-1 font-mono text-xl font-bold tabular text-silver">
                    {stats?.baseXp.toLocaleString()}
                  </div>
                </div>
                <div className="border border-slate2/60 bg-card p-4">
                  <div className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-dim">
                    Quest bonuses
                  </div>
                  <div className="mt-1 font-mono text-xl font-bold tabular text-ozone">
                    {stats?.questXp.toLocaleString()}
                  </div>
                </div>
                <div className="border border-ozone/40 bg-card p-4">
                  <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">
                    Total XP
                  </div>
                  <div className="mt-1 font-mono text-xl font-bold tabular text-ozone">
                    {stats?.xp.toLocaleString()}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
