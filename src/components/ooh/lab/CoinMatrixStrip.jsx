import { useEffect, useState } from 'react';

// Matrix-style artifact metadata readout — mirrors NftMatrixStrip for the
// Genesis Coin. Dense, terminal, live status.

export default function CoinMatrixStrip({ config, material }) {
  const [dpr, setDpr] = useState(1);
  useEffect(() => setDpr(window.devicePixelRatio || 1), []);

  const seed = (config.serial || '0') + (material?.id || 'brass') + (config.edition || '');
  const hash = seed
    .split('')
    .reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0)
    .toString(16)
    .replace('-', '');

  const rows = [
    ['SERIAL', `№ ${config.serial}`],
    ['EDITION', (config.edition || '').replace(' EDITION', '')],
    ['MATERIAL', (material?.name || 'BRASS').toUpperCase()],
    ['Ø', '64MM'],
    ['SDG', '11 · 16 · 17'],
    ['CHAIN', 'BASE · ERC-721'],
    ['NFC', 'NTAG216'],
    ['HASH', hash.slice(0, 12).toUpperCase()],
  ];

  return (
    <div className="border border-slate2 bg-void px-4 py-3 font-mono text-[9px] uppercase tracking-[0.15em] text-silver/50">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-ozone">// artifact metadata</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse bg-ozone" /> LIVE
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 md:grid-cols-4">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <span className="text-dim/60">{k}</span>
            <span className="text-silver/80">{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 border-t border-slate2/40 pt-1.5 text-[8px] text-dim/50">
        RENDER · WebGL2 · DPR {dpr} · OOH EARTH GENESIS PROTOCOL v3.1
      </div>
    </div>
  );
}
