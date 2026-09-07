import { AlertTriangle, BadgeCheck, Loader2 } from 'lucide-react';

const FIELD_ORDER = [
  'product_name',
  'brand',
  'category',
  'quantity',
  'countries',
  'origins',
  'manufacturing_places',
  'packaging',
  'labels',
];

function Assertion({ assertion }) {
  const known = assertion?.value != null;
  return (
    <div className="border border-slate2/60 bg-void p-3">
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
          {assertion?.label || 'Unknown field'}
        </span>
        <span
          className={`shrink-0 font-mono text-[8px] font-bold uppercase tracking-[0.15em] ${known ? 'text-sky-300' : 'text-dim'}`}
        >
          {assertion?.evidence_class || 'UNKNOWN'}
        </span>
      </div>
      <p className="mt-1 break-words font-display text-sm text-silver">
        {known ? assertion.value : 'Unknown'}
      </p>
      {known && (
        <p className="mt-2 break-words font-mono text-[9px] leading-relaxed text-darkgray">
          source: {assertion.source} · {assertion.attribution}
        </p>
      )}
    </div>
  );
}

export default function TrueCostResult({ data, loading, error }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 border border-slate2/60 bg-card p-12">
        <Loader2 className="h-6 w-6 animate-spin text-ozone" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
          Retrieving source-backed product evidence…
        </span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 border border-flare/50 bg-card p-4 font-mono text-[10px] uppercase tracking-[0.2em] text-flare">
        <AlertTriangle className="h-4 w-4" /> {error}
      </div>
    );
  }
  if (!data) return null;

  if (data.status === 'empty') {
    return (
      <div className="border border-slate2/60 bg-card p-5">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-amber-200">
          <AlertTriangle className="h-4 w-4" /> Product not found in the selected source
        </div>
        <p className="mt-3 font-display text-sm leading-relaxed text-silver/80">
          The identifier is valid, but no source-backed product record was returned. This is not
          evidence that the product does not exist.
        </p>
      </div>
    );
  }

  if (data.status !== 'available' || !data.product) {
    return (
      <div className="border border-slate2/60 bg-card p-5">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
          <AlertTriangle className="h-4 w-4" /> Product evidence unavailable
        </div>
        <p className="mt-3 font-display text-sm leading-relaxed text-silver/80">
          The scanner remains usable, but the product source could not be reached. No product facts
          or cost estimate were invented.
        </p>
      </div>
    );
  }

  const fields = data.product.fields || {};
  const name = fields.product_name?.value || 'Unknown product';
  return (
    <div className="border border-slate2/60 bg-card">
      <div className="border-b border-slate2/60 p-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-ozone">
            // Product evidence ledger
          </span>
          <BadgeCheck className="h-3.5 w-3.5 text-ozone" />
        </div>
        <h3 className="mt-1 break-words font-display text-xl font-black text-silver">{name}</h3>
        <p className="mt-0.5 font-mono text-[9px] text-dim">
          GTIN {data.product.gtin} · source record returned {data.retrieved_at || 'unknown'}
        </p>
      </div>

      <div className="grid gap-2 p-4 sm:grid-cols-2">
        {FIELD_ORDER.map((field) => (
          <Assertion key={field} assertion={fields[field]} />
        ))}
      </div>

      <div className="border-t border-amber-300/30 bg-amber-300/5 p-4">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
          True cost evidence
        </div>
        <p className="mt-2 font-display text-sm leading-relaxed text-silver/90">
          No defensible total cost is available from this scan. Transport route, shipping mode,
          carbon impact, labour conditions, price, and externalities remain UNKNOWN unless
          separately supported by attributable evidence.
        </p>
      </div>
    </div>
  );
}
