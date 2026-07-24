import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Leaf, Activity } from "lucide-react";

const TOKENS = [
  {
    addr: "0x4e78011ce80ee02d2c3e649fb657e45898257815",
    tag: "carbon-backed · UN SDG 13",
    icon: Leaf,
  },
  {
    addr: "BwVYGpW3wqe6UZWoLDj4UbxXc94n813MSJcDNePApump",
    tag: "pump.fun · field ops",
    icon: Activity,
  },
];

const fmtPrice = (v) =>
  v == null
    ? "--"
    : v < 0.001
    ? "$" + v.toFixed(8)
    : v < 0.01
    ? "$" + v.toFixed(6)
    : v < 1
    ? "$" + v.toFixed(4)
    : "$" + v.toFixed(2);

function Row({ items }) {
  return (
    <>
      {items.map((it, i) => {
        const Icon = it.icon;
        const up = (it.change ?? 0) >= 0;
        return (
          <span key={i} className="flex shrink-0 items-center gap-2 px-5">
            <Icon className="h-3 w-3 text-ozone" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-silver">{it.symbol}</span>
            <span className="font-mono text-[10px] text-darkgray">{fmtPrice(it.price)}</span>
            {it.change != null && (
              <span className={`flex items-center gap-0.5 font-mono text-[10px] ${up ? "text-ozone" : "text-flare"}`}>
                {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(it.change).toFixed(2)}%
              </span>
            )}
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">{it.tag}</span>
            <span className="text-slate2">◆</span>
          </span>
        );
      })}
    </>
  );
}

export default function CryptoTicker() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const out = await Promise.all(
        TOKENS.map(async (t) => {
          try {
            const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${t.addr}`);
            const j = await res.json();
            const pairs = (j && j.pairs) || [];
            const p = pairs.find((x) => x.priceUsd) || pairs[0];
            if (!p) return { ...t, symbol: "?", price: null, change: null };
            return {
              ...t,
              symbol: (p.baseToken && p.baseToken.symbol) || "?",
              price: parseFloat(p.priceUsd),
              change: p.priceChange ? parseFloat(p.priceChange.h24) : null,
            };
          } catch (e) {
            return { ...t, symbol: "?", price: null, change: null };
          }
        })
      );
      if (active) setItems(out);
    };
    load();
    const id = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (!items.length) {
    return (
      <div className="flex h-7 items-center border-b border-slate2/60 bg-void/90 px-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// acquiring market data…</span>
      </div>
    );
  }

  return (
    <div className="relative flex h-7 items-center overflow-hidden border-b border-slate2/60 bg-void/90">
      <div className="flex w-max animate-marquee items-center">
        <Row items={items} />
        <Row items={items} />
      </div>
    </div>
  );
}