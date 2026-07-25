import Nav from "@/components/ooh/Nav";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import { Link } from "react-router-dom";
import { ArrowRight, Map as MapIcon, ShieldCheck, Users, Zap } from "lucide-react";
import {
  SITEMAP_GROUPS, JOURNEYS, LOOSE_ENDS, AUTH_LABEL, LOOSE_STATUS,
} from "@/components/ooh/sitemapData";

function RouteCard({ r }) {
  const auth = AUTH_LABEL[r.auth] || AUTH_LABEL.none;
  return (
    <div className="flex flex-col border border-slate2/50 bg-card p-4 transition-colors hover:border-ozone/40">
      <div className="flex items-center justify-between gap-2">
        <code className="font-mono text-[11px] text-ozone">{r.path}</code>
        <span className={`shrink-0 border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] ${auth.cls}`}>{auth.text}</span>
      </div>
      <h3 className="mt-2 font-display text-base font-bold tracking-[-0.01em] text-silver">{r.name}</h3>
      <p className="mt-1.5 flex-1 font-display text-[12px] leading-[1.5] text-darkgray">{r.ux}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {r.audience}</span>
      </div>
      {r.flows.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {r.flows.map((f) => (
            <code key={f} className="border border-slate2/60 px-1.5 py-0.5 font-mono text-[9px] text-darkgray">→ {f}</code>
          ))}
        </div>
      )}
    </div>
  );
}

function Journey({ j }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`font-mono text-[9px] uppercase tracking-[0.25em] ${j.color}`}>{j.label}</span>
      {j.steps.map((s, i) => (
        <span key={s} className="flex items-center gap-2">
          <span className="border border-slate2/60 bg-card px-2 py-1 font-mono text-[10px] text-silver">{s}</span>
          {i < j.steps.length - 1 && <ArrowRight className="h-3 w-3 text-dim" />}
        </span>
      ))}
    </div>
  );
}

export default function Sitemap() {
  const totalRoutes = SITEMAP_GROUPS.reduce((n, g) => n + g.routes.length, 0);
  return (
    <div className="relative min-h-screen bg-void page-top">
      <HorizonProgress />
      <Nav />
      <main className="px-5 pb-24 pt-28 md:px-8">
        <div className="mx-auto max-w-6xl">
          {/* header */}
          <div className="border-b border-slate2/50 pb-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// site map // ux + flows + review</span>
            <h1 className="mt-2 flex items-center gap-3 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-5xl">
              <MapIcon className="h-7 w-7 text-ozone" /> Sitemap
            </h1>
            <p className="mt-2 font-display text-sm leading-[1.5] text-darkgray">
              Every route in oohearth.app — {totalRoutes} pages — with UX explainers, audience, auth requirement, and onward flows. Plus visitor journeys and the live MVP loose-ends checklist.
            </p>
          </div>

          {/* legend */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">Auth:</span>
            {Object.values(AUTH_LABEL).map((a) => (
              <span key={a.text} className={`border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] ${a.cls}`}>{a.text}</span>
            ))}
          </div>

          {/* journeys */}
          <section className="mt-8 border border-slate2/60 bg-card p-5">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
              <Zap className="h-4 w-4" /> Visitor journeys
            </div>
            <div className="mt-4 space-y-3">
              {JOURNEYS.map((j) => <Journey key={j.label} j={j} />)}
            </div>
          </section>

          {/* groups */}
          {SITEMAP_GROUPS.map((g) => (
            <section key={g.group} className="mt-10">
              <div className="flex flex-col gap-1 border-l-2 border-ozone/60 pl-4">
                <span className={`font-mono text-[10px] uppercase tracking-[0.3em] ${g.accent}`}>{g.group}</span>
                <p className="font-display text-sm text-darkgray">{g.desc}</p>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {g.routes.map((r) => <RouteCard key={r.path} r={r} />)}
              </div>
            </section>
          ))}

          {/* loose ends checklist */}
          <section className="mt-12">
            <div className="flex items-center gap-2 border-l-2 border-flare/60 pl-4">
              <ShieldCheck className="h-4 w-4 text-flare" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-flare">MVP loose-ends checklist</span>
            </div>
            <div className="mt-5 space-y-2">
              {LOOSE_ENDS.map((e) => {
                const s = LOOSE_STATUS[e.status];
                return (
                  <div key={e.item} className="flex flex-col gap-2 border border-slate2/50 bg-card p-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-sm font-semibold text-silver">{e.item}</div>
                      <p className="mt-0.5 font-display text-[12px] leading-relaxed text-darkgray">{e.note}</p>
                    </div>
                    <span className={`shrink-0 border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] ${s.cls}`}>{s.text}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* footer cta */}
          <div className="mt-12 flex flex-wrap gap-2">
            <Link to="/" className="border border-slate2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">← Home</Link>
            <Link to="/portfolio" className="border-2 border-ozone bg-ozone px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare">Open Portfolio →</Link>
          </div>
        </div>
      </main>
    </div>
  );
}