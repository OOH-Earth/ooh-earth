import { useParams, Link } from "react-router-dom";
import { Mail, ArrowUpRight, ArrowLeft, MapPin, Briefcase, Clock, Coins, Check, Sparkles } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import Reveal from "@/components/ooh/Reveal";
import SiteFooter from "@/components/ooh/SiteFooter";
import { ROLES, SUPPORT, APPLY_EMAIL } from "@/components/ooh/careers/roles";

const TYPE_STYLES = {
  Volunteer: "border-ozone/50 text-ozone",
  Contract: "border-flare/50 text-flare",
  "Part-time": "border-silver/40 text-silver",
};

function List({ title, items, mark: Mark = Check, tone = "text-ozone" }) {
  if (!items?.length) return null;
  return (
    <div>
      <h2 className="font-display text-lg font-bold tracking-[-0.01em] text-silver">{title}</h2>
      <ul className="mt-3 space-y-2.5">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2.5 text-sm leading-relaxed text-darkgray">
            <Mark className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} /> {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CareerRole() {
  const { id } = useParams();
  const role = ROLES.find((r) => r.id === id);

  if (!role) {
    return (
      <div className="min-h-screen bg-void">
        <Nav />
        <div className="page-top px-4 py-24 text-center md:px-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-flare">// Role not found</p>
          <Link to="/careers" className="mt-4 inline-flex items-center gap-2 border border-slate2 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver hover:border-ozone hover:text-ozone">
            <ArrowLeft className="h-3.5 w-3.5" /> All roles
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const mailto = `mailto:${APPLY_EMAIL}?subject=${encodeURIComponent(`Application · ${role.title}`)}`;
  const related = ROLES.filter((r) => r.category === role.category && r.id !== role.id).slice(0, 3);
  const isVolunteer = role.type === "Volunteer";

  return (
    <div className="min-h-screen bg-void">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate2/40 page-top px-4 pb-12 md:px-8 md:pb-16">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-3xl">
          <Link to="/careers" className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-dim transition-colors hover:text-ozone">
            <ArrowLeft className="h-3.5 w-3.5" /> All roles
          </Link>
          <div className="mt-5 flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// {role.category}</span>
            <span className={`border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] ${TYPE_STYLES[role.type] || TYPE_STYLES["Part-time"]}`}>{role.type}</span>
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-silver md:text-6xl">{role.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-darkgray md:text-lg">{role.summary}</p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.22em] text-dim">
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-silver/60" /> {role.location}</span>
            <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5 text-silver/60" /> {role.type}</span>
            {role.commitment && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-silver/60" /> {role.commitment}</span>}
            {role.comp && <span className="flex items-center gap-1.5"><Coins className="h-3.5 w-3.5 text-silver/60" /> {role.comp}</span>}
          </div>

          <a href={mailto} className="mt-7 group inline-flex items-center gap-2 border-2 border-ozone bg-ozone px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare">
            <Mail className="h-4 w-4" /> Apply for this role <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </section>

      {/* Body */}
      <section className="px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-3xl gap-10">
          <Reveal>
            <div>
              <h2 className="font-display text-lg font-bold tracking-[-0.01em] text-silver">About the role</h2>
              <p className="mt-3 text-sm leading-relaxed text-darkgray md:text-base">{role.about}</p>
              {role.tags?.length ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {role.tags.map((t) => (
                    <span key={t} className="border border-slate2/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-dim/80">{t}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </Reveal>

          <Reveal><List title="What you'll do" items={role.responsibilities} mark={ArrowUpRight} tone="text-ozone" /></Reveal>
          <Reveal><List title="What we're looking for" items={role.requirements} mark={Check} tone="text-flare" /></Reveal>
          <Reveal><List title="What you'll get" items={role.gain} mark={Sparkles} tone="text-[#39FF14]" /></Reveal>

          {isVolunteer && (
            <Reveal>
              <div className="border border-ozone/30 bg-card/40 p-5">
                <h2 className="flex items-center gap-2 font-display text-base font-bold tracking-[-0.01em] text-silver">
                  <Coins className="h-4 w-4 text-ozone" /> Support for volunteers
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-darkgray">
                  This is a volunteer role — but volunteering shouldn't cost you money. Here's what we back you with:
                </p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {SUPPORT.map((s) => (
                    <li key={s.title} className="border border-slate2/50 bg-void/40 p-3">
                      <div className="font-display text-sm font-semibold text-silver">{s.title}</div>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-darkgray">{s.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          )}

          {/* Apply band */}
          <Reveal>
            <div className="relative overflow-hidden border border-slate2/60 bg-card/40 p-6 text-center md:p-8">
              <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
              <div className="relative">
                <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-silver md:text-3xl">Sound like you?</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-darkgray">
                  Send a short note — who you are, why this role, and a link or two. No take-homes, no hoops.
                </p>
                <a href={mailto} className="mt-5 inline-flex items-center gap-2 border-2 border-ozone bg-ozone px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare">
                  <Mail className="h-4 w-4" /> Apply · {role.title}
                </a>
              </div>
            </div>
          </Reveal>

          {/* Related */}
          {related.length > 0 && (
            <Reveal>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">// More in {role.category}</span>
                <div className="mt-3 flex flex-col divide-y divide-slate2/40 border border-slate2/40">
                  {related.map((r) => (
                    <Link key={r.id} to={`/careers/${r.id}`} className="group flex items-center justify-between gap-3 p-4 transition-colors hover:bg-slate2/20">
                      <div>
                        <div className="font-display text-base font-semibold text-silver transition-colors group-hover:text-ozone">{r.title}</div>
                        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">{r.type} · {r.location}</div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-dim transition-colors group-hover:text-ozone" />
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
