import useCoinData from "@/components/ooh/zora/useCoinData";
import { PRIMARY_COIN } from "@/components/ooh/zora/zoraConfig";

// Market-pressure constellation: visualizes 24h buy vs sell pressure as a node network.
// (Holder-level graphs require a holder API we don't have — this uses real tx counts.)
function nodePositions(count, side, w, h) {
  const n = Math.min(Math.max(Math.round(count / 8), 3), 18);
  const cx = side === "buy" ? w * 0.28 : w * 0.72;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (side === "buy" ? 0 : 1.7);
    const r = 26 + ((i * 37) % 46);
    out.push({ x: cx + Math.cos(a) * r, y: h / 2 + Math.sin(a) * r * 0.8, side });
  }
  return out;
}

export default function ZoraHolderConstellation() {
  const { data: d } = useCoinData(PRIMARY_COIN.addr, 30000);
  const W = 520, H = 220;
  const buys = d?.buys || 0;
  const sells = d?.sells || 0;
  const buyNodes = nodePositions(buys, "buy", W, H);
  const sellNodes = nodePositions(sells, "sell", W, H);
  const center = { x: W / 2, y: H / 2 };

  return (
    <div className="border border-slate2/60 bg-card p-5 md:p-7">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// market-pressure constellation</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">24h · {PRIMARY_COIN.symbol}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 260 }}>
        {/* hub */}
        <circle cx={center.x} cy={center.y} r="10" className="fill-silver/80" />
        <circle cx={center.x} cy={center.y} r="18" className="stroke-silver/20" strokeWidth="1" fill="none" />
        {/* links + nodes */}
        {buyNodes.map((n, i) => (
          <g key={`b${i}`}>
            <line x1={center.x} y1={center.y} x2={n.x} y2={n.y} className="stroke-ozone/25" strokeWidth="0.8" />
            <circle cx={n.x} cy={n.y} r="4" className="fill-ozone" />
          </g>
        ))}
        {sellNodes.map((n, i) => (
          <g key={`s${i}`}>
            <line x1={center.x} y1={center.y} x2={n.x} y2={n.y} className="stroke-flare/25" strokeWidth="0.8" />
            <circle cx={n.x} cy={n.y} r="4" className="fill-flare" />
          </g>
        ))}
        <text x={W * 0.28} y={H - 8} textAnchor="middle" className="fill-ozone font-mono" fontSize="9">{buys} buys</text>
        <text x={W * 0.72} y={H - 8} textAnchor="middle" className="fill-flare font-mono" fontSize="9">{sells} sells</text>
      </svg>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">node count ∝ trade volume · hub = {PRIMARY_COIN.symbol} · each node ≈ 8 txns</p>
    </div>
  );
}