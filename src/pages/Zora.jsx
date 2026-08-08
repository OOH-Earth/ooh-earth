import Nav from "@/components/ooh/Nav";
import SiteFooter from "@/components/ooh/SiteFooter";
import ZoraMarketPanel from "@/components/ooh/zora/ZoraMarketPanel";
import ZoraCoinGrid from "@/components/ooh/zora/ZoraCoinGrid";
import ZoraHolderConstellation from "@/components/ooh/zora/ZoraHolderConstellation";
import LunarMarketOverlay from "@/components/ooh/zora/LunarMarketOverlay";
import WalletButton from "@/components/ooh/WalletButton";

export default function Zora() {
  return (
    <div className="relative min-h-screen bg-void">
      <Nav />

      <section className="page-top border-b border-slate2/40 px-5 pb-14 md:px-8 md:pb-20">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// On-chain resistance · Zora + Base + Solana</span>
        <h1 className="mt-3 font-display text-5xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-7xl">
          The resistance<br />economy
        </h1>
        <p className="mt-4 max-w-xl font-display text-sm leading-[1.5] text-darkgray">
          Live market telemetry for the on-chain layer of OOH Earth — content coins, creator coins, and the lunar cycles that frame each action window. Real data, streamed from the chain.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <WalletButton chain="evm" />
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// connect to mint content coins on Zora</span>
        </div>
      </section>

      <section className="px-5 py-10 md:px-8 md:py-14">
        <div className="mb-6 flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Primary market panel</span>
          <span className="h-px flex-1 bg-white/5" />
        </div>
        <ZoraMarketPanel />
      </section>

      <section className="px-5 py-10 md:px-8 md:py-14">
        <ZoraCoinGrid />
      </section>

      <section className="px-5 py-10 md:px-8 md:py-14">
        <div className="grid gap-px border border-slate2/60 bg-slate2/40 lg:grid-cols-2">
          <div className="bg-card">
            <ZoraHolderConstellation />
          </div>
          <div className="bg-card">
            <LunarMarketOverlay />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}