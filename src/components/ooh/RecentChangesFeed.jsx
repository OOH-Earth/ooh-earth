import { Link } from 'react-router-dom';
import { Radar, ArrowRight, Loader2 } from 'lucide-react';
import TimeSinceTag from '@/components/ooh/TimeSinceTag';
import { useRecentFieldChanges } from '@/hooks/useRecentFieldChanges';

function ChangeCard({ item }) {
  const { location, changes, detectedAt } = item;
  return (
    <Link
      to={`/location/${location.id}`}
      className="block border border-flare/30 bg-flare/[0.03] p-4 transition-colors hover:border-flare/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-display text-base font-bold text-silver">
            {location.title}
          </div>
          {location.address && (
            <div className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-[0.1em] text-dim">
              {location.address}
            </div>
          )}
        </div>
        {detectedAt && (
          <TimeSinceTag since={detectedAt} compact className="shrink-0 text-[9px] text-dim" />
        )}
      </div>
      <div className="mt-3 space-y-1">
        {changes.map((c) => (
          <div
            key={c.key}
            className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em]"
          >
            <span className="text-dim">{c.label}:</span>
            <span className="text-darkgray">{c.before}</span>
            <ArrowRight className="h-2.5 w-2.5 shrink-0 text-flare" />
            <span className="font-bold text-silver">{c.after}</span>
          </div>
        ))}
      </div>
    </Link>
  );
}

// Platform-wide field intelligence, not a personal stat -- deliberately
// public (rendered above any auth gate wherever it's mounted). Every entry
// is a genuine, verified-re-check-confirmed change; nothing here is
// inferred, estimated, or shown for a merely-pending check.
export default function RecentChangesFeed() {
  const { changes, loading } = useRecentFieldChanges();

  if (loading) {
    return (
      <div className="mb-10 flex items-center gap-2 border border-slate2/40 px-4 py-3">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-dim" />
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
          // Scanning field intelligence…
        </span>
      </div>
    );
  }

  if (!changes.length) return null;

  return (
    <section className="mb-10">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Radar className="h-4 w-4 text-flare" />
        <h2 className="font-display text-2xl font-black uppercase tracking-tight text-silver">
          Recently Changed
        </h2>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
          // verified re-checks, real changes only
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {changes.map((item) => (
          <ChangeCard key={item.location.id} item={item} />
        ))}
      </div>
    </section>
  );
}
