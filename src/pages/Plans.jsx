import { useState, useEffect } from "react";
import { Image } from "@/components/ui/image";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Check, ArrowUpRight, Globe2, Loader2, Settings2, Sparkles, Star, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Nav from "@/components/ooh/Nav";
import SiteFooter from "@/components/ooh/SiteFooter";
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

// Three distinct supporter tiers — each for a different kind of backer.
// id matches the server-authoritative PLANS table in createPlanCheckout.
// Billing period (month | year) is an orthogonal toggle; annual = 2 months free.
// Benefits are cumulative and never gate the civic commons — the map, reports,
// and field tools stay open to everyone. Recognition, access, physical goods,
// and a direct line are what deepen with each tier.
const TIERS = [
  {
    id: "accomplice",
    name: "Accomplice",
    who: "For the sympathiser who wants in.",
    line: "Not a bystander. An accomplice.",
    price: { month: 5, year: 50 },
    features: [
      "Accomplice badge on your profile",
      "Your name on the public Supporters wall",
      "The monthly field dispatch — the supporter briefing, before it goes public",
      "A vote in the quarterly roadmap poll — one supporter, one voice",
      "Every cent funds the commons: no ads, copyleft forever",
    ],
  },
  {
    id: "sustainer",
    name: "Sustainer",
    who: "For the regular who wants the tools to thrive.",
    line: "Keep the lights on. Steer the build.",
    featured: true,
    price: { month: 15, year: 150 },
    features: [
      "Everything in Accomplice",
      "Sustainer badge",
      "Early access to new field tools + press, before they go public",
      "Your name in the open-source repo's supporters credits",
      "A standing seat at the monthly community briefing",
    ],
  },
  {
    id: "patron",
    name: "Patron",
    who: "For the backer who can move the needle.",
    line: "Underwrite whole campaigns.",
    price: { month: 50, year: 500 },
    features: [
      "Everything in Sustainer",
      "Patron badge + featured on the Supporters wall",
      "The physical field-credential kit, shipped to you — CR80 card set, lanyard, tri-fold field map",
      "Help fund a named campaign or tool build — with your credit on it",
      "A direct line to the founder to help set priorities",
    ],
  },
];

const FAQ = [
  { q: "Do I need to pay to use the platform?", a: "No. The map, reporting, and field tools are open to everyone — free, and staying that way. Supporter tiers don't unlock the commons; they fund it and add recognition, access, and a few real perks on top. Start on a free plan and see what we can do together." },
  { q: "What's the difference between the three tiers?", a: "Accomplice ($5/mo) is how you get in — a badge, your name on the Supporters wall, the monthly dispatch, and a vote in the roadmap poll. Sustainer ($15/mo) is the backbone — everything in Accomplice plus early access to new tools and press, a credit in the open-source repo, and a seat at the monthly briefing. Patron ($50/mo) moves the needle — everything in Sustainer plus the physical field-credential kit shipped to you, the ability to fund a named campaign or build, and a direct line to the founder. Every tier funds the same open, ad-free commons — the higher tiers just move more of it." },
  { q: "Monthly or annual — what's the difference?", a: "Same tier, same benefits. Annual is billed once a year and works out at two months free versus paying monthly. Pick whichever suits you with the toggle above the tiers; you can change it later in the billing portal." },
  { q: "Are my activities on the platform private?", a: "Yes. We believe privacy is a basic human right. All new sign-ups are completely anonymous, and we ensure all user information is 100% secure. When you create an account, all of your activity remains completely private." },
  { q: "How do supporter plans work?", a: "They're recurring subscriptions, billed monthly or annually, that renew automatically until you cancel. Manage or cancel anytime from the billing portal — no need to email us. Cancelling stops future renewals; you keep your tier until the end of the period you've paid for. Some supporter benefits roll out as the movement grows — your support is what builds them." },
  { q: "What is the goal of the OOH Earth platform?", a: "It is a radical platform designed for mapping, resisting, and replacing corporate outdoor advertising with public art, culture, and truth." },
];

const fmtDate = (ms) => { if (!ms) return ""; try { return new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; } };
const unwrap = (res) => (res && typeof res === "object" && "data" in res ? res.data : res);
const tierName = (id) => TIERS.find((t) => t.id === id)?.name || id || "plan";

export default function Plans() {


  const [user, setUser] = useState(null);
  const [sub, setSub] = useState(null);         // active-ish subscription, or null
  const [loadingUser, setLoadingUser] = useState(true);
  const [busy, setBusy] = useState(null);       // tier id or "portal"
  const [notice, setNotice] = useState("");
  const [period, setPeriod] = useState("month"); // "month" | "year"
  const [resume, setResume] = useState(null);    // pre-login checkout intent
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const st = params.get("status");
    if (st === "subscribed") setNotice("You're in — welcome aboard. Your tier may take a few seconds to show up here.");
    else if (st === "cancelled") setNotice("Checkout cancelled — no charge was made.");

    let cancelled = false;
    const loadSub = async (me) => {
      if (!me?.id) return null;
      const subs = await base44.entities.Subscription.filter({ user_id: me.id }, "-created_date", 1).catch(() => []);
      const s = subs?.[0];
      return s && ["active", "trialing", "past_due"].includes(s.status) ? s : null;
    };

    (async () => {
      try {
        const me = await base44.auth.me();
        if (cancelled) return;
        setUser(me);
        let s = await loadSub(me);
        if (cancelled) return;
        setSub(s);

        // Just back from checkout but the webhook may not have landed yet — poll briefly.
        if (st === "subscribed" && !s && me?.id) {
          for (let i = 0; i < 4 && !cancelled; i++) {
            await new Promise((r) => setTimeout(r, 2500));
            s = await loadSub(me);
            if (s) { if (!cancelled) setSub(s); break; }
          }
        }

        // Resume an intent captured before login (logged-out → login → back here).
        if (me?.id && !s) {
          try {
            const raw = sessionStorage.getItem("ooh_plan_intent");
            if (raw) { const intent = JSON.parse(raw); if (intent?.tier) setResume(intent); }
          } catch { /* ignore */ }
        }
      } catch { /* logged out — fine */ }
      finally { if (!cancelled) setLoadingUser(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const startCheckout = async (tier, per) => {
    if (!user?.id) {
      try { sessionStorage.setItem("ooh_plan_intent", JSON.stringify({ tier, period: per })); } catch { /* ignore */ }
      navigate("/login");
      return;
    }
    setBusy(tier);
    try {
      const data = unwrap(await base44.functions.invoke("createPlanCheckout", { tier, period: per }));
      if (data?.url) { try { sessionStorage.removeItem("ooh_plan_intent"); } catch { /* ignore */ } window.location.href = data.url; return; }
      setNotice("Couldn't start checkout — please try again."); setBusy(null);
    } catch (e) {
      setNotice(e?.message === "login_required" ? "Please log in to support." : "Couldn't start checkout — please try again.");
      setBusy(null);
    }
  };

  const openPortal = async () => {
    setBusy("portal");
    try {
      const data = unwrap(await base44.functions.invoke("createBillingPortal", {}));
      if (data?.url) { window.location.href = data.url; return; }
      setNotice("Couldn't open the billing portal — please try again."); setBusy(null);
    } catch { setNotice("Couldn't open the billing portal — please try again."); setBusy(null); }
  };

  const dismissResume = () => { setResume(null); try { sessionStorage.removeItem("ooh_plan_intent"); } catch { /* ignore */ } };

  const JOIN_URL = "/register"; // in-app registration (AuthShell)
  const hasPlan = !!sub;

  return (
    <div className="relative bg-void">
      <ViewfinderCursor />
      <HorizonProgress />
      <Nav />

      <main>
        {/* Hero */}
        <section className="page-top px-5 pb-12 md:px-8">
          <div className="mx-auto max-w-3xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Plans & Support</span>
            <h1 className="mt-3 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-6xl">
              Fuel the movement.<br />Build the tools.<br />Take back the streets.
            </h1>
            <p className="mt-5 max-w-xl font-display text-sm font-normal leading-[1.4] text-darkgray md:text-base">
              OOH Earth is a radical platform for mapping, resisting, and replacing corporate outdoor advertising with public art, culture, and truth. The tools are free for everyone — support keeps them that way.
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
                <Image src="https://oohearth.app/wp-content/uploads/2026/04/V0y9dTu39TVeFcT18S6UcyVbHA-01-0eia-1024x768.webp" alt="OOH field documentation" className="h-full w-full object-cover" />
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
                  <Link to={user ? "/dashboard" : JOIN_URL} className="mt-6 inline-flex items-center gap-1.5 border border-slate2 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
                    {user ? "Go to dashboard" : "Get started"} <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Supporter tiers */}
        <section className="border-t border-slate2/40 bg-card">
          <div className="px-5 py-16 md:px-8 md:py-24">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Supporter · Fuel the build</span>
            <h2 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-6xl">Pick how you back the movement</h2>
            <p className="mt-3 max-w-2xl font-mono text-[11px] uppercase tracking-[0.2em] text-dim">// Three tiers · one commons · cancel anytime</p>

            {notice && (
              <div className="mt-6 flex items-start gap-3 border border-ozone/40 bg-ozone/[0.05] px-4 py-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-ozone" />
                <p className="font-mono text-[11px] leading-relaxed tracking-[0.05em] text-silver/80">{notice}</p>
              </div>
            )}

            {resume && !sub && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-ozone/50 bg-ozone/[0.05] px-4 py-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-ozone">
                  You were about to support as {tierName(resume.tier)} — pick up where you left off?
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => startCheckout(resume.tier, resume.period || "month")} disabled={busy === resume.tier} className="inline-flex items-center gap-1.5 bg-ozone px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare disabled:opacity-50">
                    {busy === resume.tier ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Continue <ArrowUpRight className="h-3.5 w-3.5" /></>}
                  </button>
                  <button onClick={dismissResume} aria-label="Dismiss" className="inline-flex items-center border border-slate2 p-2 text-darkgray transition-colors hover:border-ozone hover:text-ozone">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {sub && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-brand-green/40 bg-brand-green/[0.04] px-4 py-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-brand-green">
                  Active supporter · {tierName(sub.plan_tier)}{sub.plan_period ? ` · ${sub.plan_period === "year" ? "annual" : "monthly"}` : ""}{sub.cancel_at_period_end ? ` · ends ${fmtDate(sub.current_period_end)}` : sub.current_period_end ? ` · renews ${fmtDate(sub.current_period_end)}` : ""}
                </p>
                <button onClick={openPortal} disabled={busy === "portal"} className="inline-flex items-center gap-1.5 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone disabled:opacity-50">
                  {busy === "portal" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Settings2 className="h-3.5 w-3.5" />} Manage / cancel
                </button>
              </div>
            )}

            {/* Billing period toggle */}
            <div className="mt-8 inline-flex items-center gap-1 border border-slate2/60 bg-void p-1">
              {[["month", "Monthly"], ["year", "Annual"]].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setPeriod(val)}
                  className={`inline-flex items-center gap-2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${period === val ? "bg-ozone text-void" : "text-darkgray hover:text-ozone"}`}
                >
                  {label}
                  {val === "year" && <span className={`border px-1 py-0.5 text-[8px] tracking-[0.15em] ${period === val ? "border-void/30 text-void" : "border-brand-green/50 text-brand-green"}`}>2 months free</span>}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-px border border-slate2/60 bg-slate2/40 md:grid-cols-3">
              {TIERS.map((t) => {
                const isCurrent = sub && sub.plan_tier === t.id;
                const amount = t.price[period];
                return (
                  <div key={t.id} className={`relative flex flex-col bg-void p-6 md:p-8 ${isCurrent ? "ring-1 ring-inset ring-brand-green/50" : t.featured ? "ring-1 ring-inset ring-ozone/40" : ""}`}>
                    {t.featured && !isCurrent && (
                      <span className="absolute right-4 top-4 inline-flex items-center gap-1 border border-ozone/50 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-ozone">
                        <Star className="h-2.5 w-2.5" /> Most chosen
                      </span>
                    )}
                    {isCurrent && <span className="absolute right-4 top-4 border border-brand-green/50 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-brand-green">Current</span>}

                    <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ozone">{t.name}</div>
                    <p className="mt-1.5 font-display text-sm font-semibold leading-[1.25] text-silver">{t.line}</p>
                    <p className="mt-1 font-display text-[12px] leading-[1.35] text-darkgray">{t.who}</p>

                    <div className="mt-5 flex items-baseline gap-2">
                      <span className="font-display text-5xl font-black tracking-[-0.02em] text-silver">${amount}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray">/ {period === "year" ? "year" : "month"}</span>
                    </div>
                    <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                      {period === "year" ? `billed yearly · 2 months free` : `billed monthly`}
                    </div>

                    <ul className="mt-6 flex-1 space-y-2.5">
                      {t.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 font-display text-[13px] text-silver/80">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-ozone" /> {f}
                        </li>
                      ))}
                    </ul>

                    {loadingUser ? (
                      <div className="mt-6 flex items-center justify-center border border-slate2 py-3"><Loader2 className="h-4 w-4 animate-spin text-dim" /></div>
                    ) : isCurrent ? (
                      <button onClick={openPortal} disabled={busy === "portal"} className="mt-6 inline-flex items-center justify-center gap-1.5 border border-brand-green/60 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-brand-green transition-colors hover:bg-brand-green hover:text-void disabled:opacity-50">
                        {busy === "portal" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Settings2 className="h-3.5 w-3.5" />} Current — manage
                      </button>
                    ) : hasPlan ? (
                      <button onClick={openPortal} disabled={busy === "portal"} className="mt-6 inline-flex items-center justify-center gap-1.5 border border-slate2 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:border-ozone hover:text-ozone disabled:opacity-50">
                        {busy === "portal" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Change plan"}
                      </button>
                    ) : (
                      <button onClick={() => startCheckout(t.id, period)} disabled={busy === t.id} className={`mt-6 inline-flex items-center justify-center gap-1.5 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] transition-colors disabled:opacity-50 ${t.featured ? "bg-ozone text-void hover:bg-flare" : "border border-ozone/70 text-ozone hover:bg-ozone hover:text-void"}`}>
                        {busy === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>{user ? `Support as ${t.name}` : "Log in to support"} <ArrowUpRight className="h-3.5 w-3.5" /></>}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-4 max-w-3xl font-mono text-[10px] leading-relaxed tracking-[0.05em] text-dim">
              Secure checkout by Stripe. Recurring until cancelled — manage or cancel anytime, no email needed. Some supporter benefits roll out as the movement grows; every payment funds the open, ad-free commons. To change tiers, open <span className="text-silver">Manage / cancel</span>.
            </p>
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

      <SiteFooter />
    </div>
  );
}