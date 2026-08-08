import { Link } from "react-router-dom";
import { HandHeart, ArrowUpRight, LifeBuoy, MessageSquare, Instagram, Twitch, Globe, Send } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import SiteFooter from "@/components/ooh/SiteFooter";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import ViewfinderCursor from "@/components/ooh/ViewfinderCursor";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import StripeDonate from "@/components/ooh/campaign/StripeDonate";
import CryptoDonations from "@/components/ooh/campaign/CryptoDonations";
import WalletButton from "@/components/ooh/WalletButton";
import ContactForm from "@/components/ooh/support/ContactForm";
import SupportFaq from "@/components/ooh/support/SupportFaq";

const CHANNELS = [
  { label: "Instagram", href: "https://www.instagram.com/oohstreetmaps/", icon: Instagram },
  { label: "Twitch", href: "https://twitch.tv/oohearth", icon: Twitch },
  { label: "Foundation", href: "https://oohearthfoundation.framer.wiki/", icon: Globe },
  { label: "Advertisers Anonymous", href: "https://advertisersanonymous.org/", icon: Send },
];

export default function Support() {
  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <ViewfinderCursor />
      <HorizonProgress />
      <Nav />

      <main className="page-top">
        {/* Hero */}
        <section className="px-5 pb-10 md:px-8">
          <div className="mx-auto max-w-5xl">
            <Breadcrumbs items={[{ label: "Support" }]} className="mb-5" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Support · Help & fund the resistance</span>
            <h1 className="mt-3 font-display text-4xl font-bold leading-[1.04] tracking-[-0.02em] md:text-6xl">
              Help &amp; <span className="text-ozone">funding</span>
            </h1>
            <p className="mt-4 max-w-xl font-display text-sm leading-[1.5] text-darkgray md:text-base">
              Get answers, reach the agency, or back the offensive. OOH Earth is open-source, union-made, and community-funded — every transmission counts.
            </p>
          </div>
        </section>

        {/* Help · Contact */}
        <section className="border-t border-slate2/40 bg-card">
          <div className="px-5 py-12 md:px-8">
            <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Contact</span>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em]">Reach the agency</h2>
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/50">
                  Drop a message and we'll reply by email. For pledges or partnership, use the same form — it logs straight to the agency inbox.
                </p>
                <div className="mt-5">
                  <ContactForm />
                </div>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Channels</span>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em]">Where we transmit</h2>
                <div className="mt-5 grid grid-cols-2 gap-px border border-slate2/60 bg-slate2/40">
                  {CHANNELS.map((c) => (
                    <a key={c.label} href={c.href} target="_blank" rel="noreferrer"
                      className="group flex items-center gap-3 bg-card p-4 transition-colors hover:bg-slate2/20">
                      <c.icon className="h-4 w-4 text-silver/60 transition-colors group-hover:text-ozone" />
                      <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-darkgray transition-colors group-hover:text-ozone">{c.label}</span>
                      <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-dim transition-colors group-hover:text-ozone" />
                    </a>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link to="/guides" className="inline-flex items-center gap-2 border border-slate2 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
                    <LifeBuoy className="h-3.5 w-3.5" /> Guides
                  </Link>
                  <Link to="/report" className="inline-flex items-center gap-2 border border-slate2 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
                    <MessageSquare className="h-3.5 w-3.5" /> File a report
                  </Link>
                  <Link to="/about" className="inline-flex items-center gap-2 border border-slate2 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
                    About
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-slate2/40">
          <div className="px-5 py-12 md:px-8">
            <div className="mx-auto max-w-3xl">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// FAQ</span>
              <h2 className="mt-2 mb-5 font-display text-2xl font-bold tracking-[-0.02em]">Frequently asked</h2>
              <SupportFaq />
            </div>
          </div>
        </section>

        {/* Funding */}
        <section className="border-t border-slate2/40 bg-card">
          <div className="px-5 py-12 md:px-8">
            <div className="mx-auto max-w-5xl">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Fund the offensive</span>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] md:text-3xl">Back the movement</h2>
                </div>
                <Link to="/campaign" className="inline-flex items-center gap-2 border border-slate2 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
                  Full campaign <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <p className="mt-2 max-w-lg font-mono text-[11px] leading-relaxed text-silver/50">
                Card donations run through Stripe; crypto lands directly in the treasury. No intermediaries, full transparency on the treasury console.
              </p>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <StripeDonate />
                <div className="border border-slate2 bg-void p-6">
                  <h3 className="font-display text-xl font-bold text-silver">Crypto / on-chain</h3>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">// Direct to treasury · no intermediaries</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <WalletButton chain="solana" />
                    <WalletButton chain="evm" />
                  </div>
                  <div className="mt-5">
                    <CryptoDonations />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/plans" className="inline-flex items-center gap-2 bg-ozone px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-void transition-colors hover:bg-flare">
                  <HandHeart className="h-4 w-4" /> See plans
                </Link>
                <Link to="/portfolio" className="inline-flex items-center gap-2 border border-slate2 px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
                  Treasury console <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}