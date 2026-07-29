import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import Nav from "@/components/ooh/Nav";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Map as MapIcon, ShieldCheck, Users, Zap, Eye, EyeOff, Server, KeySquare } from "lucide-react";
import {
  SITEMAP_GROUPS, JOURNEYS, LOOSE_ENDS, AUTH_LABEL, LOOSE_STATUS,
  VISIBILITY, ACCESS_LADDER, ARCHITECTURE,
} from "@/components/ooh/sitemapData";
import { IS_STAGE, APP_ENV } from "@/lib/appEnv";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";

// clearance readers — tolerate flat or nested SDK shapes
const accessOf = (u) => (u && (u.access ?? u.data?.access)) || "member";
const roleOf = (u) => (u && (u.role ?? u.data?.role)) || "user";

function VisBadge({ vis }) {
  const v = VISIBILITY[vis] || VISIBILITY.public;
  return <span className={`shrink-0 border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] ${v.cls}`}>{v.text}</span>;
}

function RouteCard({ r }) {
  const auth = AUTH_LABEL[r.auth] || AUTH_LABEL.none;
  const to = r.path.startsWith("/") && !r.path.includes(":") ? r.path : null;
  const Wrap = to ? Link : "div";
  const wrapProps = to ? { to } : {};
  return (
    <Wrap {...wrapProps} className={`group flex flex-col border p-4 transition-colors ${r.planned ? "border-dashed border-ozone/40 bg-card/40 hover:border-ozone/70" : "border-slate2/50 bg-card hover:border-ozone/40"} ${to ? "cursor-pointer" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <code className="min-w-0 truncate font-mono text-[11px] text-ozone">{r.path}</code>
        <div className="flex shrink-0 items-center gap-1">
          {r.planned && <span className="border border-ozone/50 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-ozone">Planned</span>}
          <VisBadge vis={r.vis} />
          <span className={`border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] ${auth.cls}`}>{auth.text}</span>
        </div>
      </div>
      <h3 className="mt-2 flex items-center gap-1 font-display text-base font-bold tracking-[-0.01em] text-silver">{r.name}{to && <ArrowUpRight className="h-3.5 w-3.5 text-dim opacity-0 transition-opacity group-hover:opacity-100" />}</h3>
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
    </Wrap>
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
  const [user, setUser] = useState(null);
  const [previewPublic, setPreviewPublic] = useState(false);

  useEffect(() => {
    (async () => { try { setUser(await base44.auth.me()); } catch { /* route guard handles auth */ } })();
  }, []);

  const isAdmin = roleOf(user) === "admin" || accessOf(user) === "admin";
  const canInternal = isAdmin && !previewPublic;
  const canStage = canInternal && IS_STAGE;
  const canSee = (vis) => vis === "public" || (vis === "internal" && canInternal) || (vis === "stage" && canStage);

  const groups = SITEMAP_GROUPS
    .map((g) => ({ ...g, routes: g.routes.filter((r) => canSee(r.vis)) }))
    .filter((g) => g.routes.length > 0);
  const visibleRoutes = groups.flatMap((g) => g.routes);
  const totalRoutes = visibleRoutes.filter((r) => !r.planned && r.path.startsWith("/")).length;
  const plannedCount = visibleRoutes.filter((r) => r.planned).length;

  const archRows = ARCHITECTURE.filter((a) => canSee(a.vis));
  const looseRows = LOOSE_ENDS.filter((e) => canSee(e.vis));

  return (
    <div className="relative min-h-screen bg-void page-top">
      <HorizonProgress />
      <Nav />
      <main className="px-5 pb-24 pt-28 md:px-8">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs items={[{ label: "Sitemap" }]} className="mb-6" />
          {/* header */}
          <div className="border-b border-slate2/50 pb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// site map // ux + flows + review</span>
              <span className={`border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.25em] ${IS_STAGE ? "border-[#FF0040]/60 text-[#FF0040]" : "border-[#39FF14]/50 text-[#39FF14]"}`}>
                env · {APP_ENV}
              </span>
            </div>
            <h1 className="mt-2 flex items-center gap-3 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-5xl">
              <MapIcon className="h-7 w-7 text-ozone" /> Sitemap
            </h1>
            <p className="mt-2 font-display text-sm leading-[1.5] text-darkgray">
              Every route in oohearth.app — {totalRoutes} pages{plannedCount ? ` + ${plannedCount} planned` : ""} — with UX explainers, audience, auth, visibility tier, and onward flows. {canInternal ? "Showing all tiers (admin)." : "Public-safe view."}
            </p>
          </div>

          {/* legends + admin controls */}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">Auth:</span>
              {Object.values(AUTH_LABEL).map((a) => (
                <span key={a.text} className={`border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] ${a.cls}`}>{a.text}</span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">Visibility:</span>
              {Object.values(VISIBILITY).map((v) => (
                <span key={v.text} className={`border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] ${v.cls}`}>{v.text}</span>
              ))}
            </div>
            {isAdmin && (
              <button
                onClick={() => setPreviewPublic((p) => !p)}
                className={`flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] transition-colors ${previewPublic ? "border-[#39FF14]/60 text-[#39FF14]" : "border-slate2 text-darkgray hover:border-ozone hover:text-ozone"}`}
              >
                {previewPublic ? <><Eye className="h-3.5 w-3.5" /> Public view — click to restore</> : <><EyeOff className="h-3.5 w-3.5" /> Preview public view</>}
              </button>
            )}
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
          {groups.map((g) => (
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

          {/* access ladder — internal */}
          {canInternal && (
            <section className="mt-12">
              <div className="flex items-center gap-2 border-l-2 border-ozone/60 pl-4">
                <KeySquare className="h-4 w-4 text-ozone" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">Access & clearance ladder</span>
                <VisBadge vis="internal" />
              </div>
              <div className="mt-5 space-y-2">
                {ACCESS_LADDER.map((t) => (
                  <div key={t.tier} className="flex flex-col gap-2 border border-slate2/50 bg-card p-3 md:flex-row md:items-center">
                    <span className={`w-fit shrink-0 border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${t.cls}`}>{t.tier}</span>
                    <code className="shrink-0 font-mono text-[10px] text-dim md:w-56">{t.gate}</code>
                    <p className="font-display text-[12px] leading-relaxed text-darkgray">{t.powers}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* architecture — internal / stage */}
          {archRows.length > 0 && (
            <section className="mt-12">
              <div className="flex items-center gap-2 border-l-2 border-ozone/60 pl-4">
                <Server className="h-4 w-4 text-ozone" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">System architecture</span>
              </div>
              <div className="mt-5 space-y-2">
                {archRows.map((a) => (
                  <div key={a.layer} className="border border-slate2/50 bg-card p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-bold text-silver">{a.layer}</span>
                      <VisBadge vis={a.vis} />
                    </div>
                    <p className="mt-1 font-display text-[12px] leading-relaxed text-darkgray">{a.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* loose ends checklist — internal */}
          {looseRows.length > 0 && (
            <section className="mt-12">
              <div className="flex items-center gap-2 border-l-2 border-flare/60 pl-4">
                <ShieldCheck className="h-4 w-4 text-flare" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-flare">MVP loose-ends checklist</span>
                <VisBadge vis="internal" />
              </div>
              <div className="mt-5 space-y-2">
                {looseRows.map((e) => {
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
          )}

          {/* footer cta */}
          <div className="mt-12 flex flex-wrap gap-2">
            <Link to="/" className="border border-slate2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">← Home</Link>
            {isAdmin && <Link to="/dashboard" className="border-2 border-ozone bg-ozone px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare">Open Console →</Link>}
          </div>
        </div>
      </main>
    </div>
  );
}
