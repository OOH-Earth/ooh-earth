import { Link } from 'react-router-dom';
import TimeSinceTag from '@/components/ooh/TimeSinceTag';
import { ordinal } from '@/components/ooh/gamification/gamification';

function DiscoveryCard({ item }) {
  const { location, ordinalForBrand, discoveryNumber, milestone } = item;
  const chain = [location.parent_corp, location.ad_agency, location.ooh_operator].filter(Boolean);

  return (
    <Link
      to={`/location/${location.id}`}
      className="block border border-slate2/60 bg-card p-4 transition-colors hover:border-ozone/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {typeof discoveryNumber === 'number' && (
            <div className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-dim">
              Discovery #{discoveryNumber}
            </div>
          )}
          <div className="truncate font-display text-base font-bold text-silver">
            {location.brand_name}
          </div>
          {chain.length > 0 && (
            <div className="mt-0.5 truncate font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-dim">
              {chain.join(' → ')}
            </div>
          )}
        </div>
        {location.created_date && (
          <TimeSinceTag since={location.created_date} compact className="shrink-0 text-[9px]" />
        )}
      </div>

      {/* A distinct ordinal per card -- even repeat discoveries of the same
          brand read as individually meaningful ("1st"/"2nd"/"3rd" Nike),
          not an identical aggregate total repeated on every one of them. */}
      <div className="mt-3 font-mono text-[0.6875rem] uppercase tracking-[0.15em] text-dim">
        Your {ordinal(ordinalForBrand)} {location.brand_name} discovery
      </div>

      {milestone && (
        <div className="mt-2">
          <div className="h-1 w-full bg-slate2">
            <div
              className="h-full bg-ozone"
              style={{ width: `${Math.min(100, (milestone.current / milestone.target) * 100)}%` }}
            />
          </div>
          <div className="mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-dim">
            {milestone.current} / {milestone.target} · {milestone.target - milestone.current} more
            to {milestone.label}
          </div>
        </div>
      )}
    </Link>
  );
}

// Personal discovery feed for /operative -- the same brand/agency/timestamp
// data already visible one-off in FieldReport's post-submit Discovery panel,
// now shown as a standing, browsable record. `items` is pre-derived by the
// caller (OperativeProfile.jsx) from useGamification's already-fetched
// `locations` + `stats` + `allBadges` -- no data or network calls of its
// own, purely presentational.
export default function DiscoveryFeed({ items = [] }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ozone">
          // Discovery Intelligence
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ozone" /> signal active
        </span>
      </div>
      {items.length === 0 ? (
        <div className="border border-slate2/60 bg-card p-8 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
          // No discoveries logged yet — file a report to begin
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <DiscoveryCard key={item.location.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
