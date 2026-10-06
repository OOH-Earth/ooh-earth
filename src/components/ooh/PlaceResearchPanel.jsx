import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Clock3,
  Database,
  ExternalLink,
  Loader2,
  MapPinned,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import { fetchUsgsResearch, RESEARCH_FIXTURES, RESEARCH_SOURCE } from '@/lib/placeResearch';

const STALE_AFTER_MS = 6 * 60 * 60 * 1000;
function formatDate(value) {
  if (!value) return 'Unavailable';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function SourceCard({ item }) {
  const stale =
    item.status === 'live' && item.retrievedAt
      ? Date.now() - new Date(item.retrievedAt).getTime() > STALE_AFTER_MS
      : false;
  const isFixture = item.status === 'fixture';
  return (
    <article
      className={`border p-4 ${isFixture ? 'border-flare/50 bg-flare/5' : stale ? 'border-flare/50' : 'border-slate2/60 bg-card/40'}`}
      data-testid={isFixture ? 'research-fixture-card' : 'research-live-card'}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 border px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.2em] ${isFixture ? 'border-flare/60 text-flare' : 'border-ozone/50 text-ozone'}`}
        >
          {isFixture ? <Database className="h-3 w-3" /> : <Radio className="h-3 w-3" />}
          {isFixture ? 'Fixture · not live intelligence' : 'External reporting'}
        </span>
        {stale && (
          <span className="inline-flex items-center gap-1 border border-flare/50 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-flare">
            <AlertTriangle className="h-3 w-3" /> Stale
          </span>
        )}
      </div>
      <h3 className="mt-3 font-display text-base font-semibold text-silver">{item.title}</h3>
      <p className="mt-1 text-[12px] leading-relaxed text-darkgray">{item.summary}</p>
      <dl className="mt-4 grid gap-2 border-t border-slate2/40 pt-3 text-[10px] sm:grid-cols-2">
        <div>
          <dt className="font-mono uppercase tracking-[0.15em] text-dim">Event / publication</dt>
          <dd className="mt-0.5 text-silver">{formatDate(item.eventTime)}</dd>
        </div>
        <div>
          <dt className="font-mono uppercase tracking-[0.15em] text-dim">Retrieved</dt>
          <dd className="mt-0.5 text-silver">{formatDate(item.retrievedAt)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-mono uppercase tracking-[0.15em] text-dim">Geographic precision</dt>
          <dd className="mt-0.5 flex items-center gap-1 text-silver">
            <MapPinned className="h-3 w-3 text-ozone" /> {item.geographicPrecision}
          </dd>
        </div>
      </dl>
      <a
        href={item.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex min-h-11 items-center gap-1.5 border border-ozone/50 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ozone hover:bg-ozone hover:text-void focus-visible:outline focus-visible:outline-2 focus-visible:outline-ozone"
      >
        Open original source <ExternalLink className="h-3 w-3" />
      </a>
    </article>
  );
}

export default function PlaceResearchPanel({ location, onClose }) {
  const [live, setLive] = useState({ status: 'loading', items: [], error: '', requestUrl: '' });
  const coordinates = useMemo(
    () => ({ lat: Number(location?.lat), lng: Number(location?.lng) }),
    [location],
  );
  const hasCoordinates = Number.isFinite(coordinates.lat) && Number.isFinite(coordinates.lng);
  useEffect(() => {
    if (!hasCoordinates) {
      setLive({
        status: 'unavailable',
        items: [],
        error: 'This place has no usable coordinates.',
        requestUrl: '',
      });
      return undefined;
    }
    const controller = new AbortController();
    fetchUsgsResearch({ ...coordinates, signal: controller.signal })
      .then((result) =>
        setLive({ status: 'ready', items: result.items, error: '', requestUrl: result.requestUrl }),
      )
      .catch((error) => {
        if (error.name !== 'AbortError')
          setLive({
            status: 'error',
            items: [],
            error: 'The external source is unavailable right now.',
            requestUrl: '',
          });
      });
    return () => controller.abort();
  }, [coordinates, hasCoordinates]);
  const liveItems = live.items.length ? live.items : [];
  return (
    <section
      className="mb-8 border border-ozone/40 bg-card/30"
      aria-labelledby="place-research-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ozone/30 px-4 py-4 sm:px-5">
        <div>
          <div className="flex items-center gap-2 text-ozone">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.25em]">
              Bounded place research
            </span>
          </div>
          <h2
            id="place-research-title"
            className="mt-2 font-display text-xl font-semibold text-silver"
          >
            Research this place
          </h2>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-darkgray">
            External public information is shown separately from OOH Earth’s own verified field
            record. This panel loads only because you requested it.
          </p>
        </div>
        <button
          onClick={onClose}
          className="min-h-11 border border-slate2 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-darkgray hover:border-ozone hover:text-ozone focus-visible:outline focus-visible:outline-2 focus-visible:outline-ozone"
        >
          Close research
        </button>
      </div>
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
                External reporting
              </span>
              <p className="mt-1 text-[11px] text-darkgray">
                {RESEARCH_SOURCE.name} · {RESEARCH_SOURCE.coverage}
              </p>
            </div>
            {live.status === 'loading' && (
              <Loader2
                className="h-4 w-4 animate-spin text-ozone"
                aria-label="Loading external source"
              />
            )}
          </div>
          <div className="space-y-3">
            <SourceCard item={RESEARCH_FIXTURES[0]} />
            {liveItems.map((item) => (
              <SourceCard key={item.id} item={item} />
            ))}
          </div>
          {live.status === 'ready' && liveItems.length === 0 && (
            <p className="mt-3 border border-slate2/60 p-4 font-mono text-[10px] uppercase tracking-[0.15em] text-darkgray">
              No matching events returned for this bounded query.
            </p>
          )}
          {(live.status === 'error' || live.status === 'unavailable') && (
            <p
              role="status"
              className="mt-3 flex items-start gap-2 border border-flare/50 bg-flare/5 p-4 text-[11px] leading-relaxed text-silver"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-flare" /> {live.error} Fixture
              validation remains available; OOH Earth itself is still usable.
            </p>
          )}
        </div>
        <aside
          className="border border-slate2/60 bg-void/40 p-4"
          aria-label="Research source notes"
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-ozone">
            Source contract
          </span>
          <dl className="mt-3 space-y-3 text-[11px] leading-relaxed">
            <div>
              <dt className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                Licence / attribution
              </dt>
              <dd className="mt-0.5 text-silver">{RESEARCH_SOURCE.licence}</dd>
            </div>
            <div>
              <dt className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                Query disclosure
              </dt>
              <dd className="mt-0.5 text-silver">{RESEARCH_SOURCE.disclosure}</dd>
            </div>
            <div>
              <dt className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                Reliability
              </dt>
              <dd className="mt-0.5 text-silver">{RESEARCH_SOURCE.reliability}</dd>
            </div>
            <div>
              <dt className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                Rate limit behaviour
              </dt>
              <dd className="mt-0.5 flex items-start gap-1 text-silver">
                <Clock3 className="mt-0.5 h-3 w-3 shrink-0 text-ozone" />
                {RESEARCH_SOURCE.rateLimit}
              </dd>
            </div>
          </dl>
          <a
            href={live.requestUrl || RESEARCH_SOURCE.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-11 items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ozone underline decoration-ozone/50 underline-offset-4 hover:text-flare focus-visible:outline focus-visible:outline-2 focus-visible:outline-ozone"
          >
            View disclosed query / API docs <ExternalLink className="h-3 w-3" />
          </a>
          <div className="mt-5 border-t border-slate2/50 pt-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-flare">
              OOH-verified evidence
            </span>
            <p className="mt-2 text-[11px] leading-relaxed text-silver">
              External reporting does not verify what is on this exact site today. The existing OOH
              field record is the place to confirm conditions in person.
            </p>
            <a
              href="#ooh-verified-evidence"
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 border border-flare/60 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-flare hover:bg-flare hover:text-void focus-visible:outline focus-visible:outline-2 focus-visible:outline-flare"
            >
              Open field check <MapPinned className="h-3 w-3" />
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}
