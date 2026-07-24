import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Radio, ExternalLink, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const short = (h) => (h ? `${h.slice(0, 6)}…${h.slice(-4)}` : "");

export default function DonationWatcher() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const [ts, setTs] = useState(null);

  const load = async () => {
    try {
      const res = await base44.functions.invoke("cryptoWatch", {});
      const d = res.data || {};
      const merged = [...(d.sol || []), ...(d.eth || [])];
      merged.sort((a, b) => (b.time || 0) - (a.time || 0));
      setItems(merged);
      setTs(d.ts);
      setErr(false);
    } catch {
      setErr(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="border border-slate2/60 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 animate-flicker text-ozone" />
          <h3 className="font-display text-lg font-bold text-silver">Treasury watcher</h3>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">live · 60s</span>
      </div>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">// recent on-chain activity — incoming to the OOH treasury</p>

      <div className="mt-4 space-y-1.5">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6">
            <Loader2 className="h-4 w-4 animate-spin text-ozone" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">syncing ledger…</span>
          </div>
        ) : err && !items.length ? (
          <div className="py-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-dim">// feed unavailable — send the first transmission</div>
        ) : items.length ? (
          items.map((it) => (
            <a key={it.chain + it.hash} href={it.url} target="_blank" rel="noreferrer" className="group flex items-center gap-3 border border-slate2/40 bg-void p-2.5 transition-colors hover:border-ozone/50">
              <span className={`font-mono text-[9px] font-bold uppercase tracking-[0.15em] ${it.chain === "SOL" ? "text-ozone" : "text-flare"}`}>{it.chain}</span>
              <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-darkgray">{short(it.hash)}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">{it.time ? formatDistanceToNow(new Date(it.time), { addSuffix: true }) : "recent"}</span>
              <ExternalLink className="h-3 w-3 text-dim transition-colors group-hover:text-ozone" />
            </a>
          ))
        ) : (
          <div className="py-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-dim">// no activity yet — be the first to fund</div>
        )}
      </div>
      {ts && <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-dim/60">last sync {formatDistanceToNow(new Date(ts), { addSuffix: true })}</div>}
    </div>
  );
}