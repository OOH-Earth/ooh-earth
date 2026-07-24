import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Trophy, BadgeCheck, Camera, FileText, Crown } from "lucide-react";
import { pointsForReport, rankTier, POINTS } from "@/components/ooh/pointsConfig";

const masked = (id) => `OP-${String(id || "").slice(-4).toUpperCase()}`;

function aggregate(recs) {
  const byOp = {};
  for (const r of recs || []) {
    const oid = r.created_by_id;
    if (!oid) continue;
    if (!byOp[oid]) byOp[oid] = { id: oid, reports: 0, verified: 0, photos: 0, points: 0 };
    const o = byOp[oid];
    o.reports += 1;
    if (r.status === "verified") o.verified += 1;
    if (r.image_url || r.image) o.photos += 1;
    o.points += pointsForReport(r);
  }
  const sorted = Object.values(byOp).sort((a, b) => b.points - a.points);
  sorted.forEach((o, i) => {
    o.rank = i + 1;
    o.tier = rankTier(o.points);
  });
  return sorted;
}

export default function Leaderboard() {
  const [rows, setRows] = useState(null);
  const [me, setMe] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [recs, user] = await Promise.all([
          base44.entities.Location.list("-created_date", 500),
          base44.auth.me().catch(() => null),
        ]);
        if (!cancelled) {
          setRows(aggregate(recs));
          setMe(user);
        }
      } catch (e) {
        if (!cancelled) setRows([]);
      }
    };
    load();

    const unsub = base44.entities.Location.subscribe(() => {
      base44.entities.Location.list("-created_date", 500).then((recs) => {
        if (!cancelled) setRows(aggregate(recs));
      });
    });
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

  const totalPoints = (rows || []).reduce((s, r) => s + r.points, 0);

  return (
    <section className="relative border-t border-slate2/60 bg-void px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Operative Leaderboard</span>
          <h2 className="font-display text-3xl font-black uppercase tracking-tight2 text-silver md:text-5xl">Resistance Index</h2>
          <p className="mt-2 max-w-2xl font-display text-sm leading-relaxed text-darkgray">
            Field contributions ranked by points. File reports, get verified, add photo evidence to climb. Operative identities masked for security.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4 border border-slate2/60 bg-card p-4">
          <Trophy className="h-5 w-5 shrink-0 text-ozone" />
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">Combined resistance score</div>
            <div className="font-display text-2xl font-black tabular text-silver">
              {totalPoints.toLocaleString()}
              <span className="ml-1 text-sm text-dim">pts</span>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
            <span>+{POINTS.report_filed} filed</span>
            <span className="text-ozone">+{POINTS.report_filed + POINTS.verified_bonus} verified</span>
            <span className="text-flare">+{POINTS.report_filed + POINTS.verified_bonus + POINTS.photo_bonus} verified+photo</span>
          </div>
        </div>

        {rows === null ? (
          <div className="mt-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
            <span className="h-1.5 w-1.5 animate-flicker rounded-full bg-ozone" /> Compiling ranks…
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-8 border border-slate2/60 bg-card p-8 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
            // No attributed field data yet — file a report to claim rank #1
          </div>
        ) : (
          <div className="mt-8 divide-y divide-slate2/40 border border-slate2/60">
            {rows.map((o) => {
              const isMe = me && o.id === me.id;
              return (
                <div
                  key={o.id}
                  className={`flex items-center gap-4 p-4 ${isMe ? "bg-ozone/5" : ""}`}
                  style={isMe ? { borderLeft: "2px solid #EDFF00" } : undefined}
                >
                  <div className="flex w-8 shrink-0 items-center justify-center font-display text-xl font-black tabular text-dim">
                    {o.rank === 1 ? <Crown className="h-5 w-5 text-ozone" /> : <span>{o.rank}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-base font-bold text-silver">{masked(o.id)}</span>
                      {isMe && (
                        <span className="border border-ozone px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-ozone">You</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                      <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {o.reports} filed</span>
                      <span className="flex items-center gap-1 text-ozone"><BadgeCheck className="h-3 w-3" /> {o.verified} verified</span>
                      <span className="flex items-center gap-1 text-flare"><Camera className="h-3 w-3" /> {o.photos} photo</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-xl font-black tabular text-silver">{o.points.toLocaleString()}</div>
                    <div className="font-mono text-[8px] uppercase tracking-[0.2em]" style={{ color: o.tier.accent }}>{o.tier.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}