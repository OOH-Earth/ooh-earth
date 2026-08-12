import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { CAMPAIGN } from '@/components/ooh/fundConfig';

const CHAINS = [
  { key: 'btc', label: 'Bitcoin', ticker: 'BTC', network: 'Bitcoin Network' },
  { key: 'eth', label: 'Ethereum', ticker: 'ETH', network: 'Ethereum Mainnet' },
  { key: 'sol', label: 'Solana', ticker: 'SOL', network: 'Solana' },
  {
    key: 'usdc',
    label: 'USDC',
    ticker: 'USDC',
    network: 'Ethereum & Polygon',
    note: 'Accepts native USDC + USDC.e (ERC-20). Same address on both chains.',
  },
  {
    key: 'polygon',
    label: 'Polygon',
    ticker: 'POL',
    network: 'Polygon PoS',
    sharedWith: 'eth',
    note: 'Same wallet as Ethereum (ETH). Send POL, USDC, or USDC.e to the ETH address above.',
  },
];

export default function CryptoDonations() {
  const [copied, setCopied] = useState('');
  const copy = (k, addr) => {
    navigator.clipboard?.writeText(addr);
    setCopied(k);
    setTimeout(() => setCopied(''), 1500);
  };
  const available = CHAINS.filter((c) => CAMPAIGN.wallets[c.key]);

  return (
    <div className="overflow-hidden border border-slate2/60 bg-card p-4 md:p-6">
      <h3 className="font-display text-xl font-bold text-silver">On-chain</h3>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
        // Direct to treasury — no intermediaries
      </p>
      <div className="mt-4 space-y-2">
        {available.length ? (
          available.map((c) => (
            <div
              key={c.key}
              className="group relative overflow-hidden border border-slate2/50 bg-void p-3 transition-colors hover:border-ozone/40"
            >
              <div className="flex items-center gap-2">
                <span className="w-12 shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-ozone">
                  {c.ticker}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-darkgray">
                  {CAMPAIGN.wallets[c.key]}
                </span>
                <button
                  onClick={() => copy(c.key, CAMPAIGN.wallets[c.key])}
                  className="relative shrink-0 text-dim transition-colors hover:text-ozone active:scale-90"
                  aria-label={`Copy ${c.ticker} address`}
                >
                  {copied === c.key ? (
                    <Check className="h-3.5 w-3.5 text-ozone" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied === c.key && (
                    <span className="absolute -top-7 right-0 whitespace-nowrap border border-ozone/60 bg-void px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-ozone">
                      Copied
                    </span>
                  )}
                </button>
              </div>
              <div className="mt-1.5 flex items-center gap-2 overflow-hidden">
                <span className="truncate font-mono text-[8px] uppercase tracking-[0.2em] text-silver/50">
                  {c.network}
                </span>
                {c.sharedWith && (
                  <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.15em] text-flare/60">
                    // shared with {c.sharedWith.toUpperCase()}
                  </span>
                )}
              </div>
              {c.note && (
                <p className="mt-1 font-mono text-[9px] leading-relaxed text-dim">{c.note}</p>
              )}
            </div>
          ))
        ) : (
          <div className="border border-slate2/40 bg-void p-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
            // Treasury addresses pending — contact ops
          </div>
        )}
      </div>
    </div>
  );
}
