import { Link } from "react-router-dom";
import Nav from "@/components/ooh/Nav";
import NfcFieldCard from "@/components/ooh/fieldid/NfcFieldCard";
import Reveal from "@/components/ooh/Reveal";
import { Nfc, MapPin, Scale, IdCard, CloudOff, BarChart3, ArrowRight, ShieldCheck } from "lucide-react";

const FEATURES = [
  { icon: IdCard, title: "Identification", body: "Proves your standing as a registered OOH Earth field operative. Referenced to your operative record at ooh.earth." },
  { icon: Nfc, title: "NFC Site Tagging", body: "Tap your card at any documented billboard or site. The chip logs your visit, timestamps the documentation, and links to the artifact record." },
  { icon: MapPin, title: "Map Integration", body: "Every card tap updates the live map at ooh.earth. Your documentation drives are tracked and your city's evidence base grows with every visit." },
  { icon: Scale, title: "Legal Standing", body: "References UN SDG 11.7 and A/69/286 — internationally recognised frameworks for public space access and cultural rights. You're exercising documented rights." },
];

const FIELD = [
  { icon: CloudOff, title: "Works everywhere", body: "Weatherproof PVC with embedded NFC. Functions offline — syncs to ooh.earth when you're back in range. No app required for basic identification." },
  { icon: BarChart3, title: "Live operative dashboard", body: "Track your documentation history, city contributions, rarity collection and personal impact report — all linked to your card number." },
];

const KEY = [
  { title: "City impact dashboard", body: "Real-time tracking of every billboard documented, offense tagged, QR sticker deployed and community fund contribution in your city." },
  { title: "One-tap documentation", body: "Arrive at site. Photograph. Tap card. Done. The NFC chip handles location logging, timestamp, operative ID and database update. No forms. No friction." },
];

const STATS = [
  { v: "14", s: "Cities mapped" },
  { v: "320+", s: "Operatives registered" },
  { v: "1,800+", s: "Sites tagged" },
  { v: "100%", s: "Open-source" },
];

export default function SuperCard() {
  return (
    <div className="min-h-screen bg-void grid-bg">
      <Nav />

      <main className="pt-[57px] md:pt-[64px]">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate2/40 px-5 py-16 md:px-8 md:py-24">
          <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
            <Reveal>
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-ozone animate-flicker">// OOH Card now shipping — NFC enabled</span>
              <h1 className="mt-4 font-display text-5xl font-bold leading-[0.98] tracking-[-0.02em] text-silver md:text-7xl">
                ooh earth<br />union card
              </h1>
              <p className="mt-5 max-w-md font-body text-sm leading-[1.6] text-darkgray">
                The OOH Earth Field Card identifies you as a registered operative in the global network documenting corporate advertising harm. Your access credential, your site-tagging tool, your proof of standing under UN SDG 11.7.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link to="/support" className="group flex items-center gap-2 border-2 border-ozone bg-ozone px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare">
                  Order your Field Card <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link to="/field-id" className="font-mono text-[10px] uppercase tracking-[0.25em] text-silver/60 transition-colors hover:text-ozone">
                  Digital credential →
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex justify-center md:justify-end">
                <NfcFieldCard handle="ghostsignal" memberId="OOH-2026-7" />
              </div>
            </Reveal>
          </div>
        </section>

        {/* About */}
        <section className="border-b border-slate2/40 px-5 py-14 md:px-8">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">About the Field Card</span>
              <h2 className="mt-3 max-w-2xl font-display text-2xl font-bold leading-[1.1] tracking-[-0.02em] text-silver md:text-4xl">
                The first credential designed for people reclaiming public space from corporate advertising.
              </h2>
              <p className="mt-5 max-w-2xl font-body text-sm leading-[1.6] text-darkgray">
                Whether you're a street artist documenting abandoned billboards, a mapper cataloguing advertising infrastructure, a policy advocate gathering evidence, or a community organiser leading a documentation drive — the Field Card identifies you as part of a global, community-funded network operating under established UN frameworks for cultural rights and public space access.
              </p>
            </Reveal>
          </div>
        </section>

        {/* What the card does */}
        <section className="border-b border-slate2/40 px-5 py-14 md:px-8">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">What the card does</span>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-[-0.02em] text-silver md:text-4xl">Infrastructure with institutional backing</h2>
            </Reveal>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 0.05}>
                  <div className="group h-full border border-slate2/60 bg-card p-5 transition-colors hover:border-ozone/40">
                    <f.icon className="h-6 w-6 text-ozone" />
                    <h3 className="mt-3 font-display text-lg font-bold tracking-[-0.01em] text-silver">{f.title}</h3>
                    <p className="mt-1.5 font-body text-sm leading-[1.55] text-darkgray">{f.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Built for the field */}
        <section className="border-b border-slate2/40 px-5 py-14 md:px-8">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Built for the field</span>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-[-0.02em] text-silver md:text-4xl">For people who work at the wall, not behind a desk</h2>
            </Reveal>
            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {FIELD.map((f, i) => (
                <Reveal key={f.title} delay={i * 0.05}>
                  <div className="flex h-full gap-4 border border-slate2/60 bg-card p-5">
                    <f.icon className="h-6 w-6 shrink-0 text-flare" />
                    <div>
                      <h3 className="font-display text-lg font-bold tracking-[-0.01em] text-silver">{f.title}</h3>
                      <p className="mt-1.5 font-body text-sm leading-[1.55] text-darkgray">{f.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Key features */}
        <section className="border-b border-slate2/40 px-5 py-14 md:px-8">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">Key features</span>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-[-0.02em] text-silver md:text-4xl">From documentation to evidence to action</h2>
              <p className="mt-4 max-w-2xl font-body text-sm leading-[1.6] text-darkgray">Every card tap generates data. Every data point feeds city reports. Every report supports policy advocacy. The Field Card turns individual action into collective power.</p>
            </Reveal>
            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {KEY.map((k, i) => (
                <Reveal key={k.title} delay={i * 0.05}>
                  <div className="h-full border border-slate2/60 bg-card p-5">
                    <span className="font-mono text-[9px] tabular text-dim/50">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="mt-1 font-display text-lg font-bold tracking-[-0.01em] text-silver">{k.title}</h3>
                    <p className="mt-1.5 font-body text-sm leading-[1.55] text-darkgray">{k.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Network in numbers */}
        <section className="border-b border-slate2/40 px-5 py-14 md:px-8">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">The network in numbers</span>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-[-0.02em] text-silver md:text-4xl">Performance by the people</h2>
              <p className="mt-3 font-body text-sm text-darkgray">Real data from the OOH Earth field network. No marketing inflation.</p>
            </Reveal>
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              {STATS.map((s, i) => (
                <Reveal key={s.s} delay={i * 0.05}>
                  <div className="border border-slate2/60 bg-card p-5 text-center">
                    <div className="font-display text-4xl font-bold tabular-nums text-ozone md:text-5xl">{s.v}</div>
                    <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">{s.s}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Order CTA */}
        <section className="px-5 py-16 md:px-8">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <div className="relative overflow-hidden border border-ozone/50 bg-card p-8 text-center md:p-12">
                <div className="hi-vis-stripes absolute inset-x-0 top-0 h-1" />
                <ShieldCheck className="mx-auto h-8 w-8 text-ozone" />
                <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em] text-silver md:text-5xl">Every card funds the resistance</h2>
                <p className="mx-auto mt-3 max-w-md font-body text-sm leading-[1.6] text-darkgray">Document. Tag. Credential. Prove your standing. Order your physical NFC Field Card and join the global network.</p>
                <Link to="/support" className="mt-6 inline-flex items-center gap-2 border-2 border-ozone bg-ozone px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare">
                  Order your card <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </div>
  );
}