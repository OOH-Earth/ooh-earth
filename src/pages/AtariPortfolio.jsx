import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import Nav from "@/components/ooh/Nav";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import { CAMPAIGN } from "@/components/ooh/fundConfig";
import { Link } from "react-router-dom";
import {
  Loader2, LogOut, RefreshCw, ArrowDownToLine, Copy, Check, Link2, Coins, PiggyBank,
} from "lucide-react";

const CHAIN_META = {
  base: { label: "Base", token: (a) => `https://basescan.org/token/${a}`, tx: (h) => `https://basescan.org/tx/${h}` },
  solana: { label: "Solana", token: (a) => `https://solscan.io/token/${a}`, tx: (h) => `https://solscan.io/tx/${h}` },
};

const fmtUsd = (n) => "$" + (Math.round((n || 0) * 100) / 100).toLocaleString("en-US");

function Holding({ label, value, sub, accent }) {
  return (
    <div className="border border-slate2/60 bg-card p-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">{label}</div>
      <div className={`mt-2 font-display text-2xl font-bold tabular ${accent || "text-silver"}`}>{value}</div>
      {sub && <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-dim">{sub}</div>}
    </div>
  );
}

function WalletRow({ label, addr }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(addr); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch { /* clipboard blocked */ }
  };
  return (
    <button onClick={copy} className="flex items-center justify-between gap-3 border border-slate2/50 bg-card p-3 text-left transition-colors hover:border-ozone/50">
      <div className="min-w-0">
        <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-ozone">{label}</div>
        <div className="truncate font-mono text-[11px] text-darkgray">{addr}</div>
      </div>
      {copied ? <Check className="h-3.5 w-3.5 shrink-0 text-[#39FF14]" /> : <Copy className="h-3.5 w-3.5 shrink-0 text-dim" />}
    </button>
  );
}

export default function AtariPortfolio() {
  const [user, setUser] = useState(null);
  const [chain, setChain] = useState(null);
  const [mints, setMints] = useState([]);
  const [pledges, setPledges] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const u = await base44.auth.me();
    setUser(u);
    const [cw, mintList, leads] = await Promise.all([
      base44.functions.invoke("cryptoWatch", {}),
      base44.entities.Mint.filter({ status: "minted" }, "-created_date", 100),
      base44.entities.FundingLead.list("-created_date", 500).catch(() => []),
    ]);
    setChain(cw?.data || null);
    setMints(mintList || []);
    setPledges((leads || []).reduce((a, r) => a + (r.amount || 0), 0));
  }, []);

  useEffect(() => {
    (async () => {
      try { await load(); } catch { /* auth handled by route guard */ }
      finally { setLoading(false); }
    })();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <Loader2 className="h-6 w-6 animate-spin text-ozone" />
      </div>
    );
  }

  const poly = chain?.polygon;
  const onChainUsd = poly?.totalUsd || 0;
  const totalUsd = onChainUsd + pledges;
  const inbound = [...(chain?.sol || []), ...(chain?.eth || [])];

  return (
    <div className="relative min-h-screen bg-void page-top">
      <HorizonProgress />
      <Nav />
      <main className="px-5 pb-24 pt-28 md:px-8">
        <div className="mx-auto max-w-5xl">
          {/* header */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate2/50 pb-6">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// 0101001 // treasury — atari portfolio</span>
              <h1 className="mt-2 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-5xl">Atari Portfolio</h1>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">{user?.email} · live on-chain</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={refresh} className="flex items-center gap-1.5 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              </button>
              <button onClick={() => base44.auth.logout("/")} className="flex items-center gap-2 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-flare hover:text-flare">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          </div>

          {/* total */}
          <section className="mt-8">
            <div className="border border-ozone/40 bg-card p-6">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
                <PiggyBank className="h-4 w-4" /> Total portfolio value
              </div>
              <div className="mt-3 font-display text-5xl font-bold tabular text-silver">{fmtUsd(totalUsd)}</div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                <span className="text-ozone">on-chain {fmtUsd(onChainUsd)}</span>
                <span className="text-flare">fiat pledged {fmtUsd(pledges)}</span>
              </div>
            </div>
          </section>

          {/* on-chain holdings */}
          <section className="mt-8">
            <h2 className="font-display text-lg font-bold uppercase tracking-[-0.01em] text-silver">On-chain holdings</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// polygon treasury — live RPC</span>
            <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
              <Holding label="POL" value={poly ? poly.matic.toFixed(4) : "—"} sub={poly ? `@ ${fmtUsd(poly.maticUsd)}` : ""} />
              <Holding label="USDC" value={poly ? poly.usdc.toFixed(2) : "—"} accent="text-ozone" />
              <Holding label="USDC.e" value={poly ? poly.usdce.toFixed(2) : "—"} />
              <Holding label="Polygon USD" value={fmtUsd(onChainUsd)} accent="text-ozone" />
            </div>
            {!poly && <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-flare">// RPC unreachable — retry</p>}
          </section>

          {/* receive addresses */}
          <section className="mt-10">
            <h2 className="font-display text-lg font-bold uppercase tracking-[-0.01em] text-silver">Receive addresses</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// tap to copy — share to receive</span>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {Object.entries(CAMPAIGN.wallets).map(([k, addr]) => (
                <WalletRow key={k} label={k.toUpperCase()} addr={addr} />
              ))}
            </div>
          </section>

          {/* inbound transactions */}
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold uppercase tracking-[-0.01em] text-silver">Inbound transactions</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// {inbound.length} recent</span>
            </div>
            <div className="mt-4 space-y-2">
              {inbound.length ? inbound.map((t) => (
                <a key={t.hash} href={t.url} target="_blank" rel="noreferrer" className="group flex items-center gap-3 border border-slate2/50 bg-card p-3 transition-colors hover:border-ozone/50">
                  <ArrowDownToLine className="h-4 w-4 shrink-0 text-[#39FF14]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ozone">{t.chain}</span>
                      {t.time && <span className="font-mono text-[9px] text-dim">{new Date(t.time).toLocaleString()}</span>}
                    </div>
                    <div className="truncate font-mono text-[11px] text-darkgray">{t.hash}</div>
                  </div>
                  <Link2 className="h-3.5 w-3.5 shrink-0 text-dim transition-colors group-hover:text-ozone" />
                </a>
              )) : (
                <div className="border border-slate2/40 bg-card p-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// no inbound activity yet</div>
              )}
            </div>
          </section>

          {/* minted coins portfolio */}
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold uppercase tracking-[-0.01em] text-silver">Minted coins</h2>
              <Link to="/zora" className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim transition-colors hover:text-ozone">// mint pipeline →</Link>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {mints.length ? mints.map((m) => {
                const meta = CHAIN_META[m.chain] || CHAIN_META.base;
                const link = m.token_address ? meta.token(m.token_address) : (m.tx_hash ? meta.tx(m.tx_hash) : null);
                const Tag = link ? "a" : "div";
                const tagProps = link ? { href: link, target: "_blank", rel: "noreferrer" } : {};
                return (
                  <Tag key={m.id} {...tagProps} className={`group flex items-center gap-3 border border-slate2/50 bg-card p-3 ${link ? "transition-colors hover:border-ozone/50" : ""}`}>
                    <Coins className="h-4 w-4 shrink-0 text-dim group-hover:text-ozone" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-display text-sm font-bold text-silver">{m.name || m.symbol || "Unnamed coin"}</span>
                        {m.symbol && <span className="font-mono text-[9px] uppercase text-ozone">${m.symbol}</span>}
                      </div>
                      <div className="truncate font-mono text-[9px] uppercase tracking-[0.15em] text-dim">{meta.label} · {(m.token_address || m.tx_hash || "").slice(0, 14)}…</div>
                    </div>
                    {link && <Link2 className="h-3.5 w-3.5 shrink-0 text-dim group-hover:text-ozone" />}
                  </Tag>
                );
              }) : (
                <div className="border border-slate2/40 bg-card p-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// no minted coins yet</div>
              )}
            </div>
          </section>

          {/* fiat pledges */}
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold uppercase tracking-[-0.01em] text-silver">Fiat pledges</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// admin ledger</span>
            </div>
            <div className="mt-4 border border-slate2/60 bg-card p-6">
              <div className="font-display text-3xl font-bold tabular text-flare">{fmtUsd(pledges)}</div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">// sum of recorded FundingLead amounts</div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}