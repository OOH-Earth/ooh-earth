import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowUpRight, Globe2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Nav from "@/components/ooh/Nav";
import SiteFooter from "@/components/ooh/SiteFooter";
import CommandCenter from "@/components/ooh/CommandCenter";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import ViewfinderCursor from "@/components/ooh/ViewfinderCursor";

const FREE_PLANS = [
  {
    name: "Anon Spotter",
    price: "Free",
    tagline: "Operate anonymously",
    features: [
      "Anonymous access to basic site tools",
      "Add locations to the map",
      "Report advertising offenses",
      "Access member-only content",
    ],
  },
  {
    name: "Spotter",
    price: "Free",
    tagline: "Build a public profile",
    features: [
      "Public profile to join discussions",
      "Climb the community leaderboards",
      "Connect your bank to receive donations",
      "Bookmark collections of locations",
    ],
  },
];

const TIERS = [
  { cycle: "monthly", price: "£25", period: "/ monthly", old: null },
  { cycle: "quarterly", price: "£60", period: "/ every 3 months", old: "£75" },
  { cycle: "yearly", price: "£200", period: "/ yearly", old: "£240" },
];

const TIER_FEATURES = [
  "Start a public action in your area",
  "Collect online signatures with petitions",
  "Earn your OOH supporter badge",
  "Access to our API data streams",
  "Early access to our press releases",
];

const FAQ = [
  { q: "Do I need to pay to use the platform?", a: "No, you don't need to pay to help us out. You can choose a free plan to get started and see what we can do together. Maybe you'll start something amazing." },
  { q: "Are my activities on the platform private?", a: "Yes. We believe privacy is a basic human right. All new sign-ups are completely anonymous, and we ensure all user information is 100% secure. When you create an account, all of your activity remains completely private." },
  { q: "What is the difference between an Anon Spotter and a Spotter?", a: "Anon Spotter (Free) provides anonymous access to basic site tools — operate anonymously, add locations to the map, report advertising, and access member-only content. Spotter (Free) lets you create a public profile to join discussions and climb the leaderboards, connect your bank to receive donations, and bookmark collections." },
  { q: "How is my personal data handled?", a: "All your data is stored securely. Public profiles will never show any of your personal information by default, and users have full control over what others can see on their profile." },
  { q: "What is the goal of the Out Of Hell™ platform?", a: "It is a radical platform designed for mapping, resisting, and replacing corporate outdoor advertising with public art, culture, and truth." },
  { q: "How can I contribute to the movement?", a: "You can contribute by adding locations to the map, reporting advertising locations, and contributing to the community leaderboard. You can also support the movement through the Support Us portal." },
];

export default function Plans() {
  const [commandOpen, setCommandOpen] = useState(false);
  const openCommand = () => setCommandOpen(true);
  const JOIN_URL = "https://ooh.earth/login-registration/";

  return (
    <div className="relative bg-void">
      <ViewfinderCursor />
      <HorizonProgress />
      <Nav onCommand={openCommand} />

      <main>
        {/* Hero */}
        <section className="px-5 pt-28 pb-12 md:px-8 md:pt-36">
          <div className="mx-auto max-w-3xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Plans & Support</span>
            <h1 className="mt-3 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-6xl">
              Fuel the movement.<br />Build the tools.<br />Take back the streets.
            </h1>
            <p className="mt-5 max-w-xl font-display text-sm font-normal leading-[1.4] text-darkgray md:text-base">
              Out Of Hell™ is a radical platform for mapping, resisting, and replacing corporate outdoor advertising with public art, culture, and truth. Choose how you want to plug in and power it forward.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="border-t border-slate2/40 bg-card">
          <div className="px-5 py-16 md:px-8 md:py-20">
            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Designed for anyone</span>
                <h2 className="mt-3 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-4xl">
                  For those who believe public space belongs to the public.
                </h2>
                <ul className="mt-6 space-y-3 font-display text-sm leading-[1.4] text-darkgray">
                  <li>For those who take creative direct action against corporate advertising — document interventions, share tactics, inspire others.</li>
                  <li>No venture capital. No corporate compromise. Just people who believe public space belongs to the public.</li>
                  <li>Adbusting that keeps your city happier and builds commercial-free public-access OOH communities.</li>
                  <li>Join a global network documenting corporate visual pollution. Every pin on the map is data the advertising industry doesn't want public.</li>
                </ul>
              </div>
              <div className="overflow-hidden border border-slate2/60">
                <img src="https://ooh.earth/wp-content/uploads/2026/04/V0y9dTu39TVeFcT18S6UcyVbHA-01-0eia-1024x768.webp" alt="OOH field documentation" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* Tools */}
        <section className="border-t border-slate2/40 bg-void">
          <div className="px-5 py-12 md:px-8">
            <div className="mx-auto flex max-w-4xl flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Globe2 className="h-8 w-8 text-ozone" />
                <p className="max-w-xl font-display text-base font-medium leading-[1.35] text-silver md:text-lg">
                  Tools that make documenting corporate advertising simple — exposing offenses across 9 categories, coordinating resistance from São Paulo to Mumbai, Lagos to London.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Free plans */}
        <section className="border-t border-slate2/40 bg-void">
          <div className="px-5 py-16 md:px-8 md:py-24">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Free · Start now</span>
            <div className="mt-8 grid gap-px border border-slate2/60 bg-slate2/40 md:grid-cols-2">
              {FREE_PLANS.map((p) => (
                <div key={p.name} className="bg-card p-6 md:p-8">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-2xl font-bold text-silver">{p.name}</h3>
                    <span className="font-display text-xl font-black text-ozone">{p.price}</span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">{p.tagline}</p>
                  <ul className="mt-5 space-y-2.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 font-display text-sm text-silver/80">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ozone" /> {f}
                      </li>
                    ))}
                  </ul>
                  <a href={JOIN_URL} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-1.5 border border-slate2 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
                    Get started <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Supporter tiers */}
        <section className="border-t border-slate2/40 bg-card">
          <div className="px-5 py-16 md:px-8 md:py-24">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Supporter · Fuel the build</span>
            <h2 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-6xl">Choose your cadence</h2>
            <div className="mt-10 grid gap-px border border-slate2/60 bg-slate2/40 md:grid-cols-3">
              {TIERS.map((t) => (
                <div key={t.cycle} className="flex flex-col bg-void p-6 md:p-8">
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ozone">{t.cycle}</div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-5xl font-black tracking-[-0.02em] text-silver">{t.price}</span>
                    {t.old && <span className="font-display text-lg text-dim line-through">{t.old}</span>}
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-darkgray">{t.period}</div>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {TIER_FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-2 font-display text-[13px] text-silver/80">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-ozone" /> {f}
                      </li>
                    ))}
                  </ul>
                  <a href={JOIN_URL} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center gap-1.5 bg-ozone px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare">
                    Switch plan <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-slate2/40 bg-void">
          <div className="px-5 py-16 md:px-8 md:py-24">
            <div className="mx-auto max-w-2xl">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// FAQ</span>
              <h2 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-5xl">Frequently asked questions</h2>
              <Accordion type="single" collapsible className="mt-8">
                {FAQ.map((item, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-b border-slate2/60">
                    <AccordionTrigger className="py-5 text-left font-display text-base font-semibold text-silver hover:no-underline hover:text-ozone data-[state=open]:text-ozone">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 font-display text-sm leading-[1.5] text-darkgray">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-slate2/40 bg-card">
          <div className="px-5 py-16 md:px-8">
            <div className="mx-auto flex max-w-3xl flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <p className="font-display text-2xl font-bold leading-[1.2] tracking-[-0.02em] text-silver md:text-3xl">
                Every upload builds the case for change.
              </p>
              <div className="flex gap-3">
                <Link to="/report" className="inline-flex items-center gap-2 bg-ozone px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare">
                  Report a location <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <Link to="/support" className="inline-flex items-center gap-2 border border-slate2 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
                  Donate
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter onCommand={openCommand} />
      <CommandCenter open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}