import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CAMPAIGN } from "@/components/ooh/fundConfig";
import { Wallet, RefreshCw, ExternalLink } from "lucide-react";

const POL_ADDR = CAMPAIGN.wallets.polygon || CAMPAIGN.wallets.eth;
const num = (n, d = 2) =>
  n == null ? "--" : Number(n).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
const usd = (n) => (n == null ? "--" : "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 }));

export default function TreasuryBalances() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ts, setTs] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("cryptoWatch", {});
      setData(res.data?.polygon || null);
      setTs(res.data?.ts || Date.now());
    } catch {
      /* keep last */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="border border-slate2/60 bg-card">
      <div className="flex items-center justify-between border-b border-slate2/40 px-5 py-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-ozone" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Treasury · live on-chain</span>
        </div>
        <button onClick={load} aria-label="Refresh balances" className="text-dim transition-colors hover:text-ozone">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-px bg-slate2/40 sm:grid-cols-4">
        <Stat label="USDC" sub="native · Polygon" value={loading ? "…" : data ? num(data.usdc) : "--"} accent />
        <Stat label="USDC.e" sub="bridged" value={loading ? "…" : data ? num(data.usdce) : "--"} />
        <Stat label="POL" sub={`@ ${data && data.maticUsd ? "$" + num(data.maticUsd, 4) : "—"}`} value={loading ? "…" : data ? num(data.matic) : "--"} />
        <Stat label="Total" sub="USD value" value={loading ? "…" : data ? usd(data.totalUsd) : "--"} accent />
      </div>

      <div className="flex items-center justify-between px-5 py-2.5">
        <a href={`https://polygonscan.com/address/${POL_ADDR}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-dim transition-colors hover:text-ozone">
          {POL_ADDR?.slice(0, 6)}…{POL_ADDR?.slice(-4)} <ExternalLink className="h-3 w-3" />
        </a>
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">{ts ? `updated ${new Date(ts).toLocaleTimeString()}` : ""}</span>
      </div>
      <p className="border-t border-slate2/40 px-5 py-2 font-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] text-dim">
        // USDC (native) is the canonical Polygon stablecoin; USDC.e is the bridged legacy variant. Both are tracked live from the treasury wallet.
      </p>
    </div>
  );
}

function Stat({ label, sub, value, accent = false }) {
  return (
    <div className="bg-card p-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">{label}</div>
      <div className={`mt-1 font-display text-xl font-bold tabular-nums ${accent ? "text-ozone" : "text-silver"}`}>{value}</div>
      <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-dim/70">{sub}</div>
    </div>
  );
}