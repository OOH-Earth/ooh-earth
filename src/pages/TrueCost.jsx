import { useState } from 'react';
import Nav from '@/components/ooh/Nav';
import UpcScanner from '@/components/ooh/truecost/UpcScanner';
import TrueCostResult from '@/components/ooh/truecost/TrueCostResult';
import { History, Barcode } from 'lucide-react';
import { resolveProductEvidence } from '@/lib/productResolver';

export default function TrueCost() {
  const [upc, setUpc] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [contextPoint, setContextPoint] = useState(null);

  const analyze = async (identifier) => {
    setUpc(identifier.canonical);
    setResult(null);
    setContextPoint(null);
    setError('');
    setLoading(true);
    try {
      const resolved = await resolveProductEvidence(identifier);
      setResult({ identifier, ...resolved });
      setHistory((h) =>
        [
          { identifier, ...resolved },
          ...h.filter((x) => x.identifier.canonical !== identifier.canonical),
        ].slice(0, 12),
      );
    } catch (e) {
      setError(e.message || 'Analysis failed — try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void">
      <Nav />
      <main className="page-top mx-auto max-w-3xl px-5 pb-24 md:px-8">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
            // Field tool · TrueCost scanner
          </span>
          <h1 className="font-display text-3xl font-black uppercase tracking-tight2 text-silver md:text-5xl">
            Scan a product.
            <br />
            Reveal what is known.
          </h1>
          <p className="mt-2 max-w-xl font-display text-sm leading-relaxed text-darkgray">
            Point the camera at a product barcode. We validate the identifier and show only
            source-backed product evidence. Missing provenance stays unknown; no total true-cost
            number is invented.
          </p>
        </div>

        <div className="mt-8">
          <UpcScanner onDetected={analyze} />
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
            // live camera scanning needs a published https url — manual entry works in preview.
          </p>
        </div>

        {upc && (
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
              <Barcode className="h-3.5 w-3.5 text-ozone" /> Decoding {upc}
            </div>
            <TrueCostResult
              data={result}
              loading={loading}
              error={error}
              contextPoint={contextPoint}
              onContextPointChange={setContextPoint}
            />
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-10">
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
              <History className="h-3.5 w-3.5" /> Session audit log
            </div>
            <div className="divide-y divide-slate2/40 border border-slate2/60">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setUpc(h.identifier.canonical);
                    setResult(h);
                    setError('');
                  }}
                  className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-ozone/5"
                >
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm font-bold text-silver">
                      {h.product?.fields?.product_name?.value || 'Unknown product'}
                    </div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                      {h.product?.fields?.brand?.value || '—'} · GTIN {h.identifier.canonical}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">
                      evidence ledger
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
