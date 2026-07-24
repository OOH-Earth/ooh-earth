const STATUS = [
  { area: "Atlas / Maps", state: "LIVE", note: "Seeded static directory · live ooh.earth ingest blocked by bot protection" },
  { area: "Report flow", state: "LIVE", note: "Offline-first capture queue with sync badge" },
  { area: "Lead claims", state: "LIVE", note: "Adopt-a-landmark flow operative" },
  { area: "In-Home digital busts", state: "LIVE", note: "Full CRUD + realtime subscription" },
  { area: "Zora market panel", state: "LIVE", note: "Reads on-chain coin data" },
  { area: "Field stats backend", state: "LIVE", note: "fieldStats function deployed" },
  { area: "UI Kit / brand library", state: "LIVE", note: "/kit copy-ready for Framer" },
  { area: "Wallet connect (SOL/EVM)", state: "BETA", note: "Read-only address · no on-chain tx signing yet" },
  { area: "AR Lens overlay", state: "BETA", note: "UI ready · device AR session gated behind publish" },
  { area: "TrueCost scan", state: "GATED", note: "Works only on published HTTPS · blocked in preview iframe" },
  { area: "Trash ID", state: "GATED", note: "Same HTTPS gate as TrueCost" },
  { area: "Stripe checkout", state: "GAP", note: "Live mode claimed · no donation product/price configured yet" },
  { area: "Crypto treasury", state: "GAP", note: "BTC/ETH/SOL shown · USDC & Polygon slots empty · watcher unverified until first tx" },
  { area: "Email notifications", state: "GAP", note: "Registered app users only · external addresses unsupported" },
];

const BADGE = {
  LIVE: "border-ozone/60 text-ozone",
  BETA: "border-flare/60 text-flare",
  GATED: "border-slate2/60 text-darkgray",
  GAP: "border-flare text-flare",
};

export default function StatusMatrix() {
  const live = STATUS.filter((s) => s.state === "LIVE").length;
  const gaps = STATUS.filter((s) => s.state === "GAP").length;
  return (
    <div>
      <div className="mb-4 grid grid-cols-4 gap-2">
        <div className="border border-slate2/60 bg-card p-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">Live</span>
          <div className="font-display text-2xl font-bold tabular-nums text-ozone">{String(live).padStart(2, "0")}</div>
        </div>
        <div className="border border-slate2/60 bg-card p-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">Beta</span>
          <div className="font-display text-2xl font-bold tabular-nums text-flare">{String(STATUS.filter((s) => s.state === "BETA").length).padStart(2, "0")}</div>
        </div>
        <div className="border border-slate2/60 bg-card p-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">Gated</span>
          <div className="font-display text-2xl font-bold tabular-nums text-darkgray">{String(STATUS.filter((s) => s.state === "GATED").length).padStart(2, "0")}</div>
        </div>
        <div className="border border-flare/60 bg-card p-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">Gaps</span>
          <div className="font-display text-2xl font-bold tabular-nums text-flare">{String(gaps).padStart(2, "0")}</div>
        </div>
      </div>
      <div className="border border-slate2/60">
        {STATUS.map((s, i) => (
          <div
            key={s.area}
            className={`grid grid-cols-[auto_1fr] items-center gap-3 px-4 py-3 md:grid-cols-[140px_1fr_auto] ${i > 0 ? "border-t border-slate2/40" : ""}`}
          >
            <span className={`w-fit border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] ${BADGE[s.state]}`}>{s.state}</span>
            <div className="min-w-0">
              <div className="font-display text-sm font-semibold tracking-[-0.01em] text-silver">{s.area}</div>
              <div className="font-body text-[12px] leading-[1.45] text-darkgray">{s.note}</div>
            </div>
            <span className="hidden font-mono text-[9px] tabular text-dim/80 md:block">{String(i + 1).padStart(2, "0")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}