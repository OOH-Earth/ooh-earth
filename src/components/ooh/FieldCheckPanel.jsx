import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import {
  RefreshCw,
  Clock,
  MapPin,
  Loader2,
  Ban,
  AlertCircle,
  ArrowRight,
  XCircle,
} from 'lucide-react';
import FieldCheckCamera from '@/components/ooh/FieldCheckCamera';
import TimeSinceTag from '@/components/ooh/TimeSinceTag';
import { computeFreshness, detectChanges, CONDITION_LABELS } from '@/lib/fieldCheckFreshness';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function FieldCheckPanel({ location }) {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    if (!location?.id) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const recs = await base44.entities.FieldCheck.filter(
          { location_id: location.id },
          '-created_date',
          50,
        );
        if (active) setChecks(recs || []);
      } catch {
        if (active) setChecks([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    let unsub;
    try {
      unsub = base44.entities.FieldCheck?.subscribe?.(load);
    } catch {
      unsub = null;
    }
    return () => {
      active = false;
      if (unsub) unsub();
    };
  }, [location?.id]);

  const verified = checks.filter((c) => c.status === 'verified');
  const latest = checks[0];
  // With 2+ verified checks, compare the two most recent. Otherwise fall back
  // to the location's original report photo as the "before" — most locations
  // will have exactly one verified re-check long before they have two, and
  // that's still a real before/after story worth showing.
  const latestImage = verified[0]?.image_url;
  const earlierImage = verified.length >= 2 ? verified[1]?.image_url : location.image_url;
  const earlierLabel = verified.length >= 2 ? 'Earlier' : 'Original report';
  const showComparison =
    Boolean(latestImage) && Boolean(earlierImage) && earlierImage !== latestImage;
  const changes = detectChanges(verified[0], verified.length >= 2 ? verified[1] : location);
  const freshness = computeFreshness(location, checks);

  return (
    <div className="mt-8 border border-ozone/30 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate2/40 px-4 py-3">
        <span className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-ozone" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ozone">
            Field Check Timeline
          </span>
          {checks.length > 0 && (
            <span className="border border-ozone/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-ozone/70">
              {checks.length}
            </span>
          )}
        </span>
        <button
          onClick={() => setCameraOpen(true)}
          className="flex items-center gap-1.5 border border-ozone bg-ozone px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare"
        >
          <RefreshCw className="h-3 w-3" /> Re-check this spot
        </button>
      </div>

      <div className="px-4 py-4">
        {!loading && freshness && (
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-ozone" />
              Last confirmed <TimeSinceTag since={freshness.lastConfirmedAt} compact /> ago
              {freshness.source === 'recheck' ? ' via re-check' : ' at intake'}
            </span>
            {!freshness.hasAnyCheck && <span className="text-dim/60">never re-checked</span>}
            {freshness.pendingNewer && (
              <span className="text-flare">newer re-check pending verification</span>
            )}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-ozone" />
          </div>
        ) : checks.length === 0 ? (
          <div className="py-6 text-center">
            <MapPin className="mx-auto h-8 w-8 text-dim/30" strokeWidth={1.2} />
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
              // No field checks yet
            </p>
            <p className="mt-1 font-mono text-[9px] leading-relaxed text-dim/60">
              Be the first to re-photograph this exact location. Your check starts the timeline —
              every future member builds on it.
            </p>
          </div>
        ) : (
          <>
            {/* What changed */}
            {changes.length > 0 && (
              <div className="mb-5 border border-flare/30 bg-flare/5 p-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-flare">
                  // What changed
                </span>
                <div className="mt-2 space-y-1.5">
                  {changes.map((c) => (
                    <div
                      key={c.key}
                      className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em]"
                    >
                      <span className="text-dim">{c.label}:</span>
                      <span className="text-darkgray">{c.before}</span>
                      <ArrowRight className="h-2.5 w-2.5 text-flare" />
                      <span className="font-bold text-silver">{c.after}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Before / After comparison */}
            {showComparison && (
              <div className="mb-5">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone/60">
                  // Before / After
                </span>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div>
                    <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">
                      {earlierLabel}
                    </span>
                    <div className="relative mt-1 aspect-[4/3] overflow-hidden border border-slate2/60">
                      <Image
                        src={earlierImage}
                        alt={earlierLabel}
                        className="h-full w-full"
                        fittingType="fill"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-ozone">
                      Latest
                    </span>
                    <div className="relative mt-1 aspect-[4/3] overflow-hidden border border-ozone/40">
                      <Image
                        src={latestImage}
                        alt="Latest check"
                        className="h-full w-full"
                        fittingType="fill"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-3">
              {checks.map((check, i) => (
                <div
                  key={check.id}
                  className={`relative flex gap-3 ${i < checks.length - 1 ? 'pb-3' : ''}`}
                >
                  {/* Timeline line */}
                  {i < checks.length - 1 && (
                    <span className="absolute left-[15px] top-8 bottom-0 w-px bg-slate2/30" />
                  )}
                  {/* Thumbnail */}
                  <div className="relative shrink-0">
                    {check.image_url ? (
                      <div className="h-8 w-8 overflow-hidden border border-slate2/60">
                        <Image
                          src={check.image_url}
                          alt=""
                          className="h-full w-full"
                          fittingType="fill"
                        />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center border border-slate2/60 bg-void">
                        <MapPin className="h-3.5 w-3.5 text-dim/50" />
                      </div>
                    )}
                    {check.status === 'verified' && (
                      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-void bg-ozone" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-dim" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-dim">
                        {timeAgo(check.created_date)}
                      </span>
                      {check.status === 'pending' && (
                        <span className="flex items-center gap-1 border border-flare/40 px-1 py-0.5 font-mono text-[7px] uppercase tracking-[0.15em] text-flare">
                          <AlertCircle className="h-2 w-2" /> Pending
                        </span>
                      )}
                      {check.status === 'verified' && (
                        <span className="font-mono text-[7px] uppercase tracking-[0.15em] text-ozone">
                          Verified
                        </span>
                      )}
                      {check.status === 'rejected' && (
                        <span className="flex items-center gap-1 border border-dim/40 px-1 py-0.5 font-mono text-[7px] uppercase tracking-[0.15em] text-dim">
                          <XCircle className="h-2 w-2" /> Rejected — not used in evidence above
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {check.condition && (
                        <span className="border border-slate2/50 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-darkgray">
                          {CONDITION_LABELS[check.condition] || check.condition}
                        </span>
                      )}
                      {check.adbust_type && check.adbust_type !== 'none' && (
                        <span className="flex items-center gap-0.5 border border-flare/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-flare">
                          <Ban className="h-2 w-2" /> {check.adbust_type.replace(/_/g, ' ')}
                        </span>
                      )}
                      {check.brand_name && (
                        <span className="border border-slate2/50 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-silver">
                          {check.brand_name}
                        </span>
                      )}
                    </div>
                    {check.notes && (
                      <p className="mt-1 text-[12px] leading-relaxed text-silver/70">
                        {check.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {latest && (
              <p className="mt-4 border-t border-slate2/30 pt-3 font-mono text-[9px] leading-relaxed text-dim">
                // Last checked {timeAgo(latest.created_date)}. Each check builds the record —
                re-photograph to track changes over time.
              </p>
            )}
          </>
        )}
      </div>

      <FieldCheckCamera
        location={location}
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
      />
    </div>
  );
}
