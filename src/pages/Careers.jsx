import { Mail, ArrowUpRight, Users, Sparkles } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import Reveal from "@/components/ooh/Reveal";
import SiteFooter from "@/components/ooh/SiteFooter";
import RoleCard from "@/components/ooh/careers/RoleCard";
import { ROLES, VALUES, PROCESS, APPLY_EMAIL } from "@/components/ooh/careers/roles";

export default function Careers() {
  const mailto = `mailto:${APPLY_EMAIL}?subject=Joining OOH Earth`;
  return (
    <div className="min-h-screen bg-void">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate2/40 px-4 pt-28 pb-16 md:px-8 md:pt-36 md:pb-24">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-5xl">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Careers · Join us</span>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-silver md:text-6xl">
            We're building the world's first open atlas of <span className="text-ozone text-glow-ozone">street-level ad media</span>.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-darkgray md:text-lg">
            OOH Earth is in public beta — community-funded, open-source, and run by a lean core team plus a global volunteer network. We're looking for operatives, engineers and organisers who want to make public-space advertising visible, accountable and subvertible.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={mailto} className="group inline-flex items-center gap-2 border-2 border-ozone bg-ozone px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare">
              <Mail className="h-4 w-4" /> Apply now <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a href="#roles" className="inline-flex items-center gap-2 border border-slate2 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:border-ozone hover:text-ozone">
              <Users className="h-4 w-4" /> Open roles
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
            <span>· {ROLES.length} open roles</span>
            <span>· Remote-first</span>
            <span>· Volunteer + paid contracts</span>
            <span>· Public beta</span>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-b border-slate2/40 px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-silver md:text-3xl">What we look for</h2>
            <p className="mt-2 max-w-2xl text-sm text-darkgray">Four things that matter more than credentials.</p>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-px border border-slate2/40 bg-slate2/40 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <Reveal key={v.title}>
                <div className="flex h-full flex-col gap-3 bg-void p-5">
                  <Sparkles className="h-5 w-5 text-ozone" />
                  <h3 className="font-display text-base font-semibold tracking-[-0.01em] text-silver">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-darkgray">{v.body}</p>
                </div>
              </Reveal>
            ))}
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
                <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-silver md:text-3xl">Looking for</h2>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">{ROLES.length} positions</span>
            </div>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {ROLES.map((r) => (
              <Reveal key={r.id}>
                <RoleCard role={r} />
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
              We're always looking for sharp, principled people. Tell us what you'd build at OOH Earth and we'll find a place for you.
            </p>
            <a href={mailto} className="mt-6 inline-flex items-center gap-2 border-2 border-ozone bg-ozone px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare">
              <Mail className="h-4 w-4" /> {APPLY_EMAIL}
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}