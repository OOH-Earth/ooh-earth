import { Award } from 'lucide-react';
import { TIER_STYLES } from '@/components/ooh/gamification/gamification';
import { ICONS } from '@/components/ooh/gamification/BadgeGrid';

// Compact, static recognition panel for badges that became earned since
// this user's last visit to /operative (see useNewBadgeRecognition) --
// deliberately not tied to "earned today" or any particular report, since
// the crossing may have happened for a reason this session can't prove
// (an older report getting verified, an NFT mint, etc.). Reuses each
// badge's real identity/tier styling/copy as-is -- no invented XP, no
// invented cause, no animation.
export default function NewBadgeRecognition({ badges = [] }) {
  if (!badges.length) return null;

  const heading =
    badges.length === 1 ? 'New since your last visit' : `${badges.length} new milestones`;

  return (
    <div role="status" className="mt-6 border border-ozone/40 bg-card p-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-ozone">
        // {heading}
      </div>
      <div className="mt-3 space-y-3">
        {badges.map((badge) => {
          const Icon = ICONS[badge.icon] || Award;
          const style = TIER_STYLES[badge.tier];
          return (
            <div key={badge.id} className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2"
                style={{
                  borderColor: style.color,
                  color: style.color,
                  boxShadow: `0 0 12px ${style.glow}`,
                }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-silver">
                  {badge.label}
                </div>
                <div className="truncate font-mono text-[9px] uppercase tracking-[0.1em] text-dim">
                  {badge.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
