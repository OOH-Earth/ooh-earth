import { ExternalLink, Info, MapPin } from 'lucide-react';
import { contextEvidenceFor } from '@/lib/locationContextEvidence';
import { isSafeSourceUrl } from '@/lib/contextSourceRegistry';
import { useLocationContext } from '@/lib/locationContextResolver';

const STATUS_CLASSES = {
  OBSERVED: 'border-ozone/50 text-ozone',
  REPORTED: 'border-sky-400/50 text-sky-300',
  DERIVED: 'border-amber-300/50 text-amber-200',
  ESTIMATED: 'border-flare/50 text-flare',
  FORECAST: 'border-violet-300/50 text-violet-200',
  UNKNOWN: 'border-slate2 text-dim',
};

function EvidenceCard({ evidence }) {
  const sourceIsSafe = evidence.source_url && isSafeSourceUrl(evidence.source_url);
  return (
    <article className="border border-slate2/50 bg-card/40 p-4" data-testid="context-evidence-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
            {evidence.category}
          </span>
          <h3 className="mt-1 break-words font-display text-sm font-semibold text-silver">
            {evidence.label}
          </h3>
        </div>
        <span
          className={`shrink-0 border px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.15em] ${STATUS_CLASSES[evidence.evidence_status] || STATUS_CLASSES.UNKNOWN}`}
        >
          {evidence.evidence_status}
        </span>
      </div>

      <p className="mt-3 break-words font-display text-base leading-relaxed text-silver">
        {evidence.value}
        {evidence.unit ? ` ${evidence.unit}` : ''}
      </p>

      {evidence.method && (
        <p className="mt-2 break-words font-mono text-[10px] leading-relaxed text-darkgray">
          <span className="text-dim">method:</span> {evidence.method}
        </p>
      )}

      <dl className="mt-3 grid gap-2 border-t border-slate2/40 pt-3 text-[10px] sm:grid-cols-2">
        <div>
          <dt className="font-mono uppercase tracking-[0.15em] text-dim">observed</dt>
          <dd className="mt-0.5 text-silver/80">{evidence.observed_at}</dd>
        </div>
        <div>
          <dt className="font-mono uppercase tracking-[0.15em] text-dim">freshness</dt>
          <dd className="mt-0.5 break-words text-silver/80">{evidence.freshness}</dd>
        </div>
        {evidence.distance_m != null && (
          <div>
            <dt className="font-mono uppercase tracking-[0.15em] text-dim">distance</dt>
            <dd className="mt-0.5 text-silver/80">{evidence.distance_m} m</dd>
          </div>
        )}
        <div>
          <dt className="font-mono uppercase tracking-[0.15em] text-dim">scope</dt>
          <dd className="mt-0.5 break-words text-silver/80">{evidence.geographic_scope}</dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate2/40 pt-2 font-mono text-[9px] leading-relaxed text-dim">
        <span>source: {evidence.source}</span>
        <span>© {evidence.attribution}</span>
        {sourceIsSafe ? (
          <a
            href={evidence.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-ozone hover:text-flare"
          >
            source link <ExternalLink className="h-2.5 w-2.5" />
          </a>
        ) : (
          <span>source link unavailable</span>
        )}
      </div>
    </article>
  );
}

export default function LocationContextEvidence({ location }) {
  const staticEvidence = contextEvidenceFor(location?.id);
  const { data, isFetching } = useLocationContext(location);
  const evidence = staticEvidence.length ? staticEvidence : data?.evidence || [];
  return (
    <section className="mb-8 border border-slate2/60" data-testid="location-context-evidence">
      <div className="flex items-start gap-3 border-b border-slate2/40 p-4 md:p-5">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ozone" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-ozone">
              // context evidence
            </span>
            <span className="border border-slate2/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
              read only
            </span>
          </div>
          <p className="mt-2 flex items-start gap-1.5 font-display text-sm leading-relaxed text-darkgray">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dim" />
            Context is shown only when attributable evidence is available. Missing data stays
            unavailable.
          </p>
        </div>
      </div>

      {isFetching ? (
        <div className="p-5" data-testid="context-evidence-loading">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
            // retrieving approved context
          </p>
        </div>
      ) : evidence.length ? (
        <div className="grid gap-3 p-4 md:grid-cols-3 md:p-5">
          {evidence.map((item) => (
            <EvidenceCard evidence={item} key={`${item.category}-${item.label}`} />
          ))}
        </div>
      ) : (
        <div className="p-5" data-testid="context-evidence-unavailable">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
            // no approved context source connected
          </p>
          <p className="mt-2 max-w-2xl font-display text-sm leading-relaxed text-silver/80">
            No source-backed context is available for this Location yet. This is an intentional
            unavailable state, not an estimate.
          </p>
        </div>
      )}
    </section>
  );
}
