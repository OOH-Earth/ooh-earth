import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Radar, Award } from 'lucide-react';
import { TIER_STYLES } from '@/components/ooh/gamification/gamification';

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

// Compact "field intelligence" readout appended to FieldReport's existing
// success card once a synced, authenticated, brand-identified report's
// gamification state has been refreshed. Every field is optional and
// independently gated by the caller (FieldReport.jsx) on real data being
// available -- this component never invents a number itself.
export default function DiscoveryPanel({ data }) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  if (!data) return null;
  const {
    brand,
    parentCorp,
    confidence,
    xpGained,
    level,
    discoveryCount,
    milestone,
    newlyUnlocked,
  } = data;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mt-4 border border-flare/40 bg-flare/[0.04] grid-bg"
    >
      <div className="flex items-center justify-between border-b border-flare/30 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Radar className="h-3.5 w-3.5 text-flare" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-flare">
            Discovery Intelligence
          </span>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {/* 1. Discovery / brand */}
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
            Brand identified
          </div>
          <div className="mt-0.5 font-display text-lg font-bold text-silver">{brand}</div>
          {typeof confidence === 'number' && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-0.5 w-24 bg-slate2">
                <div
                  className="h-full bg-ozone"
                  style={{ width: `${Math.round(confidence * 100)}%` }}
                />
              </div>
              <span className="font-mono text-[9px] tabular text-dim">
                {Math.round(confidence * 100)}% confidence
              </span>
            </div>
          )}
          {parentCorp && (
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
              Parent — {parentCorp}
            </div>
          )}
        </div>

        {/* 2. XP earned */}
        <div className="flex items-center gap-6 border-t border-flare/20 pt-3">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
              XP earned
            </div>
            <div className="font-mono text-xl font-bold tabular text-ozone">+{xpGained}</div>
          </div>
          {level && (
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                Level {level.level}
              </div>
              <div className="font-mono text-xl font-bold tabular text-silver">{level.title}</div>
            </div>
          )}
        </div>

        {/* 3. Collection milestone */}
        {typeof discoveryCount === 'number' && (
          <div className="border-t border-flare/20 pt-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
              Your {ordinal(discoveryCount)} {brand} discovery
            </div>

            {newlyUnlocked ? (
              <div
                className="mt-2 flex items-center gap-2 border px-3 py-2"
                style={{
                  borderColor: TIER_STYLES[newlyUnlocked.tier]?.color,
                  boxShadow: `0 0 14px ${TIER_STYLES[newlyUnlocked.tier]?.glow}`,
                }}
              >
                <Award
                  className="h-4 w-4 shrink-0"
                  style={{ color: TIER_STYLES[newlyUnlocked.tier]?.color }}
                />
                <div>
                  <div className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-silver">
                    Milestone unlocked
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-dim">
                    {newlyUnlocked.label}
                  </div>
                </div>
              </div>
            ) : (
              milestone && (
                <div className="mt-2">
                  <div className="h-1 w-full bg-slate2">
                    <div
                      className="h-full bg-ozone"
                      style={{
                        width: `${Math.min(100, (milestone.current / milestone.target) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-dim">
                    {milestone.current} / {milestone.target} ·{' '}
                    {milestone.target - milestone.current} more to {milestone.label}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
