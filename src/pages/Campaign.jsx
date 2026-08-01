import { useState, useEffect } from "react";
import Nav from "@/components/ooh/Nav";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import CryptoDonations from "@/components/ooh/campaign/CryptoDonations";
import StripeDonate from "@/components/ooh/campaign/StripeDonate";
import LeadCapture from "@/components/ooh/campaign/LeadCapture";
import MovementContext from "@/components/ooh/MovementContext";
import WalletButton from "@/components/ooh/WalletButton";
import DonationWatcher from "@/components/ooh/campaign/DonationWatcher";
import { CAMPAIGN } from "@/components/ooh/fundConfig";
import { base44 } from "@/api/base44Client";
import { Megaphone, CheckCircle2 } from "lucide-react";

export default function Campaign() {
  const [thanks, setThanks] = useState(false);
  const [raised, setRaised] = useState(CAMPAIGN.raisedUsd);
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("status") === "thanks") setThanks(true);
  }, []);

  // Live raised total — same confirmed-funds source (fieldStats) the rest of the
  // app uses; falls back to the configured figure if the call fails.
  useEffect(() => {
    let cancelled = false;
    base44.functions.invoke("fieldStats", {})
      .then((res) => {
        const s = res?.data ?? res;
        const r = Number(s?.raised);
        if (!cancelled && Number.isFinite(r) && r >= 0) setRaised(r);
      })
      .catch(() => { /* keep configured fallback */ });
    return () => { cancelled = true; };
  }, []);

  const pct = Math.min(100, Math.round((raised / CAMPAIGN.goalUsd) * 100));

  return (
    <div className="relative min-h-screen bg-void">
      <HorizonProgress />
      <Nav />
      <main className="page-top px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-5xl">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-flare">// Campaign · live · urgent</span>
          <h1 className="mt-3 font-display text-5xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-7xl">{CAMPAIGN.tagline}</h1>
          <p className="mt-4 max-w-2xl font-display text-sm leading-[1.6] text-darkgray">{CAMPAIGN.urgency}</p>

          {thanks && (
            <div className="mt-6 flex items-center gap-2 border border-ozone/50 bg-ozone/5 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-ozone" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">Contribution received — gratitude logged in the public record.</span>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <WalletButton chain="solana" />
            <WalletButton chain="evm" />
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// connect wallet · Solana · EVM</span>
          </div>

          <div className="mt-8 border border-slate2/60 bg-card p-5">
            <div className="flex items-end justify-between font-mono text-[10px] uppercase tracking-[0.25em]">
              <span className="text-ozone">${raised.toLocaleString()} raised</span>
              <span className="text-dim">goal ${CAMPAIGN.goalUsd.toLocaleString()}</span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-slate2/40">
              <div className="h-full bg-ozone transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <StripeDonate />
            <CryptoDonations />
            <LeadCapture />
          </div>

          <div className="mt-10">
            <DonationWatcher />
          </div>

          <MovementContext className="mt-12" />

          <div className="mt-10 flex items-start gap-3 border-t border-slate2/40 pt-6">
            <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-ozone" />
            <p className="font-display text-sm leading-[1.6] text-darkgray">Every contribution is logged in the public record. Funding deploys field operatives, cameras, and counter-narrative infrastructure across the global advertising offensive.</p>
          </div>
        </div>
      </main>
    </div>
  );
}