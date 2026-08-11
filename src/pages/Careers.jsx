import { useEffect, useState } from "react";
import { Mail, ArrowUpRight, Users, Coins, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { isAdmin } from "@/lib/clearance";
import Nav from "@/components/ooh/Nav";
import Reveal from "@/components/ooh/Reveal";
import SiteFooter from "@/components/ooh/SiteFooter";
import RoleCard from "@/components/ooh/careers/RoleCard";
import { ROLES as BASE_ROLES, VALUES, PROCESS, APPLY_EMAIL, CATEGORIES, SUPPORT, LOOK_FOR } from "@/components/ooh/careers/roles";

// Merge live status/visibility overrides from the CareerRoleStatus entity (edited
// at /careers/admin) onto the code-defined role content. Falls back to roles.js
// defaults until the console has provisioned records, or if the fetch fails.
function useLiveRoles() {
  const [roles, setRoles] = useState(BASE_ROLES);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const recs = await base44.entities.CareerRoleStatus.list("sort_order");
        if (!alive || !recs?.length) return;
        const merged = BASE_ROLES.map((r) => {
          const rec = recs.find((x) => x.role_id === r.id);
          return rec ? { ...r, status: rec.status, visible: rec.visible !== false } : r;
        }).filter((r) => r.visible !== false && r.status !== "draft");
        setRoles(merged);
      } catch {
        // keep static fallback
      }
    })();
    return () => { alive = false; };
  }, []);
  return roles;
}

export default function Careers() {
  const ROLES = useLiveRoles();
  const { user } = useAuth();
  const admin = !!user && isAdmin(user);
  const mailto = `mailto:${APPLY_EMAIL}?subject=Joining OOH Earth`;
  return (
    <div className="min-h-screen bg-void">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate2/40 page-top px-4 pb-16 md:px-8 md:pb-24">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-5xl">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Careers · Join us</span>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-silver md:text-6xl">
            We're building the world's first open atlas of <span className="text-ozone text-glow-ozone">street-level ad media</span>.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-darkgray md:text-lg">
            OOH Earth is in public beta — community-funded, open-source, and run by a lean core team plus a global volunteer network. We're looking for members, engineers and organisers who want to make public-space advertising visible, accountable and subvertible.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={mailto} className="group inline-flex items-center gap-2 border-2 border-ozone bg-ozone px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare">
              <Mail className="h-4 w-4" /> Apply now <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a href="#roles" className="inline-flex items-center gap-2 border border-slate2 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:border-ozone hover:text-ozone">
              <Users className="h-4 w-4" /> Open roles
            </a>
            {admin && (
              <Link to="/careers/admin" className="inline-flex items-center gap-2 border border-slate2 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-silver/70 transition-colors hover:border-ozone hover:text-ozone">
                <ShieldCheck className="h-4 w-4" /> Control Panel
              </Link>
            )}
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
            <span>· {ROLES.filter((r) => r.status === "live").length} live roles</span>
            <span>· {ROLES.filter((r) => r.status === "future").length} future needs</span>
            <span>· {ROLES.filter((r) => r.type === "Volunteer").length} volunteer</span>
            <span>· Community-funded</span>
          </div>
        </div>
      </section>

      {/* Open roles */}
      <section id="roles" className="border-b border-slate2/40 px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Open roles</span>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-silver md:text-3xl">Jobsboard</h2>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">{ROLES.length} positions</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 bg-[#39FF14]" /> Live role — apply now</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 bg-flare" /> Future need — register interest</span>
            </div>
          </Reveal>
          <div className="mt-10 space-y-12">
            {CATEGORIES.map((cat) => {
              const rank = { live: 0, future: 1, filled: 2, draft: 3 };
              const inCat = ROLES.filter((r) => r.category === cat && r.status !== "draft").sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9));
              if (!inCat.length) return null;
              return (
                <div key={cat}>
                  <div className="flex items-baseline justify-between gap-3 border-b border-slate2/40 pb-2">
                    <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-silver">{cat}</h3>
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">{inCat.length} roles</span>
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {inCat.map((r) => (
                      <Reveal key={r.id}><RoleCard role={r} /></Reveal>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What we look for */}
      <section className="border-b border-slate2/40 px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Who thrives here</span>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-silver md:text-3xl">Who thrives here</h2>
            <p className="mt-2 max-w-2xl text-sm text-darkgray">We've stopped reading CVs too closely. Some of the best members we know had never mapped a thing before their first walk; some of the most decorated never shipped at all. The five things below are what really tells us who'll do their best work here — and, honestly, who we'll enjoy the ride with.</p>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {LOOK_FOR.map((v, i) => (
              <Reveal key={v.title}>
                <div className="flex h-full gap-4 border border-slate2/50 bg-card/40 p-5">
                  <span className="font-mono text-sm font-black text-ozone">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="font-display text-base font-semibold tracking-[-0.01em] text-silver">{v.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-darkgray">{v.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* What we stand for */}
      <section className="border-b border-slate2/40 px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-flare">// Lines we hold</span>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-silver md:text-3xl">What we stand for</h2>
            <p className="mt-2 max-w-2xl text-sm text-darkgray">Same standard for a paid contractor and a first-week volunteer. These don't bend.</p>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-px border border-slate2/40 bg-slate2/40 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <Reveal key={v.title}>
                <div className="flex h-full flex-col gap-3 bg-void p-5">
                  <span className="h-1.5 w-1.5 bg-flare" />
                  <h3 className="font-display text-base font-semibold tracking-[-0.01em] text-silver">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-darkgray">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Support for volunteers */}
      <section className="border-b border-slate2/40 px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Volunteers</span>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-silver md:text-3xl">Volunteering shouldn't cost you</h2>
            <p className="mt-2 max-w-2xl text-sm text-darkgray">Most of the network is volunteer-run — but we back our people. Honest support, and no false promises of a salary.</p>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-px border border-slate2/40 bg-slate2/40 sm:grid-cols-2 lg:grid-cols-4">
            {SUPPORT.map((s) => (
              <Reveal key={s.title}>
                <div className="flex h-full flex-col gap-3 bg-void p-5">
                  <Coins className="h-5 w-5 text-ozone" />
                  <h3 className="font-display text-base font-semibold tracking-[-0.01em] text-silver">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-darkgray">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-b border-slate2/40 px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-silver md:text-3xl">How we hire</h2>
            <p className="mt-2 max-w-2xl text-sm text-darkgray">Short, transparent, no hoops.</p>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-px border border-slate2/40 bg-slate2/40 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((p) => (
              <Reveal key={p.step}>
                <div className="flex h-full flex-col gap-2 bg-void p-5">
                  <span className="font-mono text-[10px] tabular text-ozone">{p.step}</span>
                  <h3 className="font-display text-base font-semibold tracking-[-0.01em] text-silver">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-darkgray">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 md:px-8 md:py-28">
        <div className="relative mx-auto max-w-3xl overflow-hidden border border-slate2/60 bg-card/40 p-8 text-center md:p-12">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] text-silver md:text-4xl">Don't see your role?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-darkgray md:text-base">
              You don't need our permission to start. Map an ad near you today — or pitch the role you think we're missing. And if you can't give time, funding the movement is its own kind of joining.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href={mailto} className="inline-flex items-center gap-2 border-2 border-ozone bg-ozone px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare">
                <Mail className="h-4 w-4" /> Pitch your role
              </a>
              <Link to="/campaign" className="inline-flex items-center gap-2 border border-slate2 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:border-ozone hover:text-ozone">
                <Coins className="h-4 w-4" /> Fund the movement
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}