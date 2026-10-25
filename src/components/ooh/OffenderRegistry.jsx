import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { countBrands } from '@/components/ooh/brandCounts';
import { Trophy, Loader2 } from 'lucide-react';

const WATCHLIST = [
  { brand: 'Coca-Cola', note: "World's largest plastic polluter · top global OOH spender" },
  { brand: 'Nestlé', note: 'Bottled-water saturation · deforestation-linked supply chains' },
  { brand: 'Shell', note: 'Greenwashing billboards while expanding fossil production' },
  { brand: "McDonald's", note: 'Highest-volume fast-food OOH · childhood-targeted ad saturation' },
  { brand: 'BP', note: 'Beyond Petroleum greenwash · continued oil expansion' },
  { brand: 'Unilever', note: 'Dove + Axe paradox · prolific billboard presence' },
];

export default function OffenderRegistry() {
  const [offenders, setOffenders] = useState(null);
  const [sourced, setSourced] = useState(true);
  const [failed, setFailed] = useState(false);
  const [recordCount, setRecordCount] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const recs = (await base44.listAllLocations()) || [];
        if (!active) return;
        const list = countBrands(recs);
        setRecordCount(recs.length);
        if (!list.length) {
          setSourced(false);
          setOffenders(WATCHLIST.map((w) => ({ brand: w.brand, count: 0, note: w.note })));
        } else {
          setOffenders(list);
        }
      } catch {
        if (active) {
          setFailed(true);
          setOffenders([]);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="offenders" className="relative border-t border-slate2/40 bg-void">
      <div className="px-5 py-16 md:px-8 md:py-24">
        <div className="flex flex-col gap-4 border-b border-slate2/40 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
              // Section 03c — Brand registry
            </span>
            <h2 className="mt-3 font-display text-5xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-7xl">
              Named &amp;
              <br />
              counted
            </h2>
          </div>
          <p className="max-w-sm font-display text-sm font-normal leading-[1.4] text-darkgray">
            An atlas is only accountability if it names names. This registry scans every documented
            location for corporate brands and ranks them by frequency. No brand escapes the ledger.
          </p>
        </div>

        {!offenders ? (
          <div className="flex items-center gap-3 py-16">
            <Loader2 className="h-5 w-5 animate-spin text-ozone" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
              // scanning field records…
            </span>
          </div>
        ) : failed ? (
          <div
            role="status"
            className="mt-10 border border-slate2/60 p-6 font-mono text-[10px] uppercase tracking-[0.2em] text-dim"
          >
            // Unavailable: field records could not be loaded
          </div>
        ) : (
          <ol className="mt-10 divide-y divide-slate2/40 border border-slate2/60">
            {offenders.map((o, i) => (
              <li key={o.brand} className="flex items-center gap-4 p-5 md:p-6">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-ozone/50 font-display text-sm font-black text-ozone tabular">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-3">
                    <Trophy className="hidden h-3.5 w-3.5 text-dim sm:block" />
                    <span className="truncate font-display text-xl font-bold tracking-[-0.02em] text-silver md:text-2xl">
                      {o.brand}
                    </span>
                  </div>
                  {o.note && (
                    <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.15em] text-dim">
                      {o.note}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray">
                  {o.count > 0 ? `${o.count}× logged` : 'watchlist'}
                </span>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
          //{' '}
          {failed
            ? 'Counts unavailable'
            : sourced
              ? `Counted from the ${recordCount.toLocaleString('en-US')} field records loaded · only records with a brand tag count · not a global total`
              : 'Field records lacked brand tags · showing global watchlist of top OOH brands'}
        </p>
      </div>
    </section>
  );
}
