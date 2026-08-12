import { useEffect, useState, useCallback } from 'react';
import { Radio, Users, Play, Pause, ExternalLink, Activity, History } from 'lucide-react';
import { useRadio } from '@/lib/radioContext';
import { RADIO_OPS_ENABLED, fetchNowPlaying, azuracastAdminUrl, OOH_STATION } from '@/lib/radioOps';

function fmtTime(s) {
  if (!s || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// Read-only mirror of the AzuraCast broadcast engine.
// Scheduling, library + live control live in AzuraCast; this page only reflects.
export default function RadioOps() {
  const { station, playing, selectStation } = useRadio();
  const [np, setNp] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async (signal) => {
    const data = await fetchNowPlaying(signal);
    setNp(data);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!RADIO_OPS_ENABLED) {
      setLoaded(true);
      return;
    }
    const controller = new AbortController();
    load(controller.signal);
    const iv = setInterval(() => load(controller.signal), 10000);
    return () => {
      controller.abort();
      clearInterval(iv);
    };
  }, [load]);

  const onAir = station?.id === OOH_STATION.id && playing;
  const progress = np?.duration ? Math.min(100, (np.elapsed / np.duration) * 100) : 0;

  return (
    <main className="page-top min-h-screen bg-void px-4 pb-24 md:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="relative border border-slate2 bg-void/60 p-6">
          <span className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-ozone/60" />
          <span className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-ozone/60" />
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">
            <Radio className="h-3 w-3" /> OOH Radio · Ops
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em] text-silver md:text-5xl">
            Broadcast Control
          </h1>
          <p className="mt-2 max-w-xl font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
            Read-only mirror of the AzuraCast engine. Scheduling + library live in the dashboard.
          </p>
        </div>

        {/* NOT CONFIGURED */}
        {!RADIO_OPS_ENABLED && (
          <div className="mt-6 border border-flare/40 bg-flare/5 p-6">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-flare">
              // Radio Ops not connected
            </div>
            <p className="mt-3 font-mono text-[11px] leading-relaxed tracking-[0.03em] text-silver/70">
              The broadcast engine isn&apos;t wired up yet. Stand up AzuraCast, then paste your base
              URL and station listen URL into{' '}
              <span className="text-ozone">src/lib/radioOps.js</span> — this page and the in-app OOH
              Radio channel light up automatically.
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
              Setup guide: OOH-Radio-Ops-Plan.md
            </p>
          </div>
        )}

        {/* CONFIGURED */}
        {RADIO_OPS_ENABLED && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {/* On air */}
              <div className="border border-slate2 bg-void/60 p-6 md:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">
                    <Activity className="h-3 w-3" /> On air now
                  </span>
                  {np?.isLive ? (
                    <span className="font-mono text-[8px] font-bold uppercase tracking-[0.25em] text-flare">
                      ● Live DJ
                    </span>
                  ) : (
                    <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-dim">
                      AutoDJ
                    </span>
                  )}
                </div>

                <div className="mt-4 flex gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden border border-slate2 bg-slate2/30">
                    {np?.art ? (
                      <img
                        src={np.art}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Radio className="h-6 w-6 text-dim" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-lg font-semibold tracking-[-0.01em] text-silver">
                      {np?.title || (loaded ? '—' : 'Loading…')}
                    </div>
                    <div className="truncate font-mono text-[10px] uppercase tracking-[0.15em] text-ozone/70">
                      {np?.artist || np?.streamerName || ''}
                    </div>
                    <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate2">
                      <div
                        className="h-full bg-ozone transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between font-mono text-[8px] tabular-nums tracking-[0.1em] text-dim">
                      <span>{fmtTime(np?.elapsed)}</span>
                      <span>{fmtTime(np?.duration)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => selectStation(OOH_STATION.id)}
                  className="mt-5 inline-flex items-center gap-2 border-2 border-ozone bg-ozone px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:border-flare hover:bg-flare"
                >
                  {onAir ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  {onAir ? 'Playing' : 'Play OOH Radio'}
                </button>
              </div>

              {/* Stats */}
              <div className="flex flex-col gap-4">
                <div className="border border-slate2 bg-void/60 p-5">
                  <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.25em] text-dim">
                    <Users className="h-3 w-3" /> Listeners
                  </div>
                  <div className="mt-2 font-display text-4xl font-bold tabular-nums tracking-tight text-ozone text-glow-ozone">
                    {np ? np.listeners : '—'}
                  </div>
                </div>
                <div className="border border-slate2 bg-void/60 p-5">
                  <div className="font-mono text-[8px] uppercase tracking-[0.25em] text-dim">
                    Up next
                  </div>
                  <div
                    className="mt-2 truncate font-mono text-[11px] tracking-[0.02em] text-silver/80"
                    title={np?.playingNext || ''}
                  >
                    {np?.playingNext || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Offline note */}
            {loaded && !np && (
              <div className="mt-4 border border-flare/40 bg-flare/5 p-4 font-mono text-[10px] uppercase tracking-[0.2em] text-flare">
                // Engine unreachable — check the server, the stream, and CORS on AzuraCast
              </div>
            )}

            {/* Recent history */}
            {np?.recentHistory?.length > 0 && (
              <div className="mt-4 border border-slate2 bg-void/60 p-6">
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">
                  <History className="h-3 w-3" /> Recently played
                </div>
                <div className="mt-4 divide-y divide-slate2/40">
                  {np.recentHistory.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5">
                      <span className="font-mono text-[9px] tabular-nums text-dim">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="truncate font-mono text-[11px] tracking-[0.02em] text-silver/75">
                        {h.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manage link */}
            <a
              href={azuracastAdminUrl() || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 border border-slate2 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:border-ozone hover:text-ozone"
            >
              Manage in AzuraCast <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </>
        )}
      </div>
    </main>
  );
}
