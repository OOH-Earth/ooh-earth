import { useState, useEffect } from 'react';
import { Radio } from 'lucide-react';
import { fromLines } from '@/lib/hexagrams';

// CompanionWatch — Apple-Watch-style OOH wearable prototype.
// Two faces: Field (time / UWB / complications) and Hex (live hexagram state).
export default function CompanionWatch() {
  const [face, setFace] = useState('field');
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const lines = [1, 0, 1, 1, 0, 1];
  const h = fromLines(lines);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* digital crown + side button */}
        <div className="absolute -right-1.5 top-14 h-7 w-2 rounded-r bg-slate2" />
        <div className="absolute -right-1.5 top-24 h-5 w-2 rounded-r bg-slate2/60" />
        <div className="w-[188px] rounded-[44px] border border-slate2 bg-void p-2 shadow-[0_10px_40px_rgba(0,0,0,.5)]">
          <div className="relative h-[212px] overflow-hidden rounded-[34px] border border-slate2/60 bg-card">
            <div className="flex items-center justify-between px-3 pt-2 font-mono text-[7px] uppercase tracking-[0.2em] text-silver/40">
              <span className="text-ozone">OOH·SE</span>
              <span>UWB</span>
            </div>

            {face === 'field' ? (
              <div className="flex flex-col items-center px-3 pt-1">
                <div className="font-mono text-[7px] uppercase tracking-widest text-silver/40">
                  {now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                </div>
                <div className="text-5xl font-bold leading-none text-silver">
                  {hh}:{mm}
                </div>
                <div
                  className="mt-2 flex h-9 w-9 items-center justify-center rounded-full border border-ozone/50"
                  style={{ boxShadow: '0 0 16px rgba(237,255,0,.2)' }}
                >
                  <Radio className="h-4 w-4 text-ozone" strokeWidth={1.5} />
                </div>
                <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.18em] text-ozone">
                  Shake to bond
                </div>
                <div className="mt-2 grid w-full grid-cols-3 gap-1 text-center">
                  <div className="border border-slate2/60 py-1">
                    <div className="font-mono text-[8px] text-flare">6</div>
                    <div className="font-mono text-[6px] text-silver/30">NEAR</div>
                  </div>
                  <div className="border border-slate2/60 py-1">
                    <div className="font-mono text-[8px] text-brand-green">2.1m</div>
                    <div className="font-mono text-[6px] text-silver/30">UWB</div>
                  </div>
                  <div className="border border-slate2/60 py-1">
                    <div className="font-mono text-[8px] text-ozone">12.4k</div>
                    <div className="font-mono text-[6px] text-silver/30">$OOH</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center px-3 pt-1">
                <div className="font-mono text-[7px] uppercase tracking-widest text-silver/40">
                  Hex state
                </div>
                <div
                  className="mt-1 text-6xl leading-none text-ozone"
                  style={{ textShadow: '0 0 18px rgba(237,255,0,.35)' }}
                >
                  {h.char}
                </div>
                <div className="mt-1 font-mono text-[8px] uppercase tracking-widest text-silver/60">
                  H{h.kw} {h.pinyin}
                </div>
                <div className="mt-2 flex flex-col gap-0.5">
                  {lines
                    .slice()
                    .reverse()
                    .map((v, i) => (
                      <div key={i} className="flex h-2 w-20 gap-1">
                        {v ? (
                          <span className="w-full bg-ozone" />
                        ) : (
                          <>
                            <span className="flex-1 bg-silver/20" />
                            <span className="flex-1 bg-silver/20" />
                          </>
                        )}
                      </div>
                    ))}
                </div>
                <div className="mt-2 px-1 text-center font-mono text-[7px] leading-tight text-silver/40">
                  {h.english}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* face switch dots */}
      <div className="mt-3 flex items-center gap-2">
        {['field', 'hex'].map((f) => (
          <button
            key={f}
            onClick={() => setFace(f)}
            aria-label={`${f} face`}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${face === f ? 'bg-ozone' : 'bg-slate2 hover:bg-silver/40'}`}
          />
        ))}
      </div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-silver/40">
        W-01 · OOH Watch prototype
      </div>
    </div>
  );
}
