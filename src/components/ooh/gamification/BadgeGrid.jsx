import { Link } from 'react-router-dom';
import {
  FileText,
  Eye,
  MapPin,
  Crosshair,
  ShieldCheck,
  Camera,
  Zap,
  Coins,
  Target,
  Flame,
  Rocket,
  Award,
  Lock,
} from 'lucide-react';
import { BADGES, TIER_STYLES } from '@/components/ooh/gamification/gamification';

export const ICONS = {
  FileText,
  Eye,
  MapPin,
  Crosshair,
  ShieldCheck,
  Camera,
  Zap,
  Coins,
  Target,
  Flame,
  Rocket,
  Award,
};

function Badge({ badge, earned, stats }) {
  const Icon = ICONS[badge.icon] || Award;
  const style = TIER_STYLES[badge.tier];
  // Progress is only meaningful while a badge is still locked -- once
  // earned, the tier glow + Mint as NFT link already say "done".
  const progress = !earned && stats && badge.progress ? badge.progress(stats) : null;
  return (
    <div
      className={`group relative flex flex-col items-center gap-2 border p-3 text-center transition-all duration-200 ${
        earned
          ? 'border-ozone/40 bg-card hover:-translate-y-0.5'
          : 'border-slate2/40 bg-void opacity-50'
      }`}
      style={earned ? { boxShadow: `0 0 16px ${style.glow}` } : undefined}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full border-2"
        style={{ borderColor: earned ? style.color : '#333', color: earned ? style.color : '#666' }}
      >
        {earned ? <Icon className="h-6 w-6" /> : <Lock className="h-4 w-4" />}
      </div>
      <div className="font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-silver">
        {badge.label}
      </div>
      <div className="font-mono text-[7px] uppercase tracking-[0.1em] text-dim">{badge.desc}</div>
      {progress && (
        <div className="font-mono text-[7px] font-bold tabular text-silver/70">
          {Math.min(progress.current, progress.target)} / {progress.target}
        </div>
      )}
      <span
        className="absolute right-1.5 top-1.5 font-mono text-[6px] font-bold uppercase tracking-[0.15em]"
        style={{ color: style.color }}
      >
        {style.label}
      </span>
      {earned && (
        <Link
          to={`/lab/nft?badge=${badge.id}`}
          className="mt-0.5 flex items-center gap-1 font-mono text-[7px] font-bold uppercase tracking-[0.12em] text-dim opacity-0 transition-opacity hover:text-ozone focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Coins className="h-2.5 w-2.5" /> Mint as NFT
        </Link>
      )}
    </div>
  );
}

export default function BadgeGrid({ earnedIds = [], showAll = true, stats = null }) {
  const earnedSet = new Set(earnedIds);
  const badges = showAll ? BADGES : BADGES.filter((b) => earnedSet.has(b.id));
  const earnedCount = BADGES.filter((b) => earnedSet.has(b.id)).length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ozone">
          // Merit Badges
        </span>
        <span className="font-mono text-[9px] tabular text-dim">
          {earnedCount} / {BADGES.length} earned
        </span>
      </div>
      {badges.length === 0 ? (
        <div className="border border-slate2/60 bg-card p-8 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
          // No badges yet — file a report to earn your first
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {badges.map((b) => (
            <Badge key={b.id} badge={b} earned={earnedSet.has(b.id)} stats={stats} />
          ))}
        </div>
      )}
    </div>
  );
}
