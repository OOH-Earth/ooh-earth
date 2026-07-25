import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { CAMPAIGN } from "@/components/ooh/fundConfig";

const CHAINS = [
  { key: "btc", label: "Bitcoin", ticker: "BTC" },
  { key: "eth", label: "Ethereum", ticker: "ETH" },
  { key: "sol", label: "Solana", ticker: "SOL" },
  { key: "usdc", label: "USDC", ticker: "USDC", note: "Accepts native USDC + USDC.e (ERC-20). Same address on Ethereum & Polygon." },
  { key: "polygon", label: "Polygon", ticker: "POL", note: "Send POL, USDC, or USDC.e to the Ethereum address above." },
];

export default function CryptoDonations() {
  const [copied, setCopied] = useState("");
  const copy = (k, addr) => {
    navigator.clipboard?.writeText(addr);
    setCopied(k);
    setTimeout(() => setCopied(""), 1500);
  };
  const available = CHAINS.filter((c) => CAMPAIGN.wallets[c.key]);

  return (
    <div className="border border-slate2/60 bg-card p-6">
      <h3 className="font-display text-xl font-bold text-silver">On-chain</h3>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">// Direct to treasury — no intermediaries</p>
      <div className="mt-4 space-y-2">
        {available.length ? available.map((c) => (
          <div key={c.key} className="border border-slate2/50 bg-void p-3">
            <div className="flex items-center gap-2">
              <span className="w-14 shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-ozone">{c.ticker}</span>
              <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-darkgray">{CAMPAIGN.wallets[c.key]}</span>
              <button onClick={() => copy(c.key, CAMPAIGN.wallets[c.key])} className="shrink-0 text-dim transition-colors hover:text-ozone" aria-label={`Copy ${c.ticker} address`}>
                {copied === c.key ? <Check className="h-3.5 w-3.5 text-ozone" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            {c.note && <p className="mt-1.5 font-mono text-[9px] leading-relaxed text-dim">{c.note}</p>}
          </div>
        )) : (
          <div className="border border-slate2/40 bg-void p-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
            // Treasury addresses pending — contact ops
          </div>
        )}
      </div>
    </div>
  );
}