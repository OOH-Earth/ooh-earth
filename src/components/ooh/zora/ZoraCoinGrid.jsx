import { TrendingUp, TrendingDown } from "lucide-react";
import useCoinData from "@/components/ooh/zora/useCoinData";
import { ZORA_COINS, fmtPrice, fmtCompact } from "@/components/ooh/zora/zoraConfig";

function CoinTile({ coin }) {
  const d = useCoinData(coin.addr, 45000);
  const up = (d?.change ?? 0) >= 0;

  return (
    <a
      href={coin.zora}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col border border-slate2/60 bg-card p-4 transition-colors hover:border-ozone"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-silver">{d?.symbol || coin.symbol}</span>
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">zora · base</span>
      </div>
      <div className="mt-1 font-display text-[11px] text-darkgray truncate">{coin.name}</div>
      <div className="mt-3 flex items-end justify-between">
        <span className="font-mono text-base font-bold text-silver">{d ? fmtPrice(d.price) : "…"}</span>
        {d?.change != null && (
          <span className={`flex items-center gap-0.5 font-mono text-[10px] ${up ? "text-ozone" : "text-flare"}`}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(d.change).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-2 font-mono text-[8px] uppercase tracking-[0.2em] text-dim">mcap {d ? fmtCompact(d.mcap) : "—"}</div>
    </a>
  );
}

export default function ZoraCoinGrid() {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Zora content coins · live feed</span>
        <span className="h-px flex-1 bg-white/5" />
      </div>
      <div className="grid gap-px border border-slate2/60 bg-slate2/40 sm:grid-cols-2 lg:grid-cols-4">
        {ZORA_COINS.map((c) => <CoinTile key={c.addr} coin={c} />)}
      </div>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">sample feed of live Zora network coins — swap for oohearth campaign coins when minted.</p>
    </div>
  );
}