import { useState } from "react";
import { Link } from "react-router-dom";
import { HandHeart, ArrowUpRight, Target, Shield } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import SiteFooter from "@/components/ooh/SiteFooter";
import CommandCenter from "@/components/ooh/CommandCenter";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import ViewfinderCursor from "@/components/ooh/ViewfinderCursor";
import CryptoDonations from "@/components/ooh/campaign/CryptoDonations";
import WalletButton from "@/components/ooh/WalletButton";

export default function Support() {
  const [commandOpen, setCommandOpen] = useState(false);
  const openCommand = () => setCommandOpen(true);

  return (
    <div className="relative bg-void">
      <ViewfinderCursor />
      <HorizonProgress />
      <Nav onCommand={openCommand} />

      <main>
        <section className="px-5 pt-28 pb-12 md:px-8 md:pt-36">
          <div className="mx-auto max-w-3xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Support · Fund the resistance</span>
            <h1 className="mt-3 font-display text-5xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-7xl">
              Join the<br />movement
            </h1>
            <p className="mt-4 max-w-xl font-display text-sm font-normal leading-[1.4] text-darkgray md:text-base">
              By funding OOH Earth, you'll support a platform that fights corporate overreach, supports grassroots artists, and inspires real change in public spaces.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="https://donorbox.org/ooh" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-ozone px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-void transition-colors hover:bg-flare">
                <HandHeart className="h-4 w-4" /> Donate now
              </a>
              <Link to="/plans" className="inline-flex items-center gap-2 border border-slate2 px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
                See plans <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Target */}
        <section className="border-t border-slate2/40 bg-card">
          <div className="px-5 py-12 md:px-8">
            <div className="mx-auto flex max-w-4xl flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Target className="h-8 w-8 text-ozone" />
                <div>
                  <div className="font-display text-3xl font-black tracking-[-0.02em] text-silver md:text-4xl">$10,000</div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Funding target</p>
                </div>
              </div>
              <p className="max-w-sm font-display text-sm leading-[1.4] text-darkgray">
                To fund growth, platform development, and community outreach. One-time or monthly — every transmission counts.
              </p>
            </div>
          </div>
        </section>

        {/* On-chain treasury */}
        <section className="border-t border-slate2/40 bg-card">
          <div className="px-5 py-12 md:px-8">
            <div className="mx-auto max-w-4xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// On-chain · direct to treasury</span>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-silver md:text-3xl">Pay in crypto</h2>
                  <p className="mt-1 max-w-sm font-display text-sm leading-relaxed text-darkgray">No intermediaries. Direct transfers land in the OOH treasury.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <WalletButton chain="solana" />
                  <WalletButton chain="evm" />
                </div>
              </div>
              <div className="mt-6 max-w-md">
                <CryptoDonations />
              </div>
            </div>
          </div>
        </section>

        {/* Donorbox embed */}
        <section className="border-t border-slate2/40 bg-void">
          <div className="px-5 py-16 md:px-8 md:py-24">
            <div className="mx-auto max-w-md">
              <div className="mb-6 flex items-center gap-2">
                <Shield className="h-4 w-4 text-ozone" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Secure · Apple Pay · Google Pay · PayPal · Card</span>
              </div>
              <div className="overflow-hidden border border-slate2/60">
                <iframe
                  src="https://donorbox.org/embed/ooh-donations?language=en-us"
                  title="OOH Earth donations"
                  className="h-[800px] w-full bg-white"
                  style={{ border: 0 }}
                  allowpaymentrequest
                />
              </div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
                Powered by Donorbox · A donor account is created automatically for recurring donations.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter onCommand={openCommand} />
      <CommandCenter open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}