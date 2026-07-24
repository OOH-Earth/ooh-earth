import { ArrowUpRight, MapPin, Briefcase } from "lucide-react";

const TYPE_STYLES = {
  Volunteer: "border-ozone/50 text-ozone",
  Contract: "border-flare/50 text-flare",
  "Part-time": "border-silver/40 text-silver",
};

export default function RoleCard({ role }) {
  const mailto = `mailto:hello@oohearth.app?subject=Application · ${encodeURIComponent(role.title)}`;
  return (
    <div className="group flex flex-col gap-3 border border-slate2/60 bg-card/40 p-5 transition-colors hover:border-ozone/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-silver">{role.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{role.location}</span>
            <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{role.type}</span>
          </div>
        </div>
        <span className={`shrink-0 border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] ${TYPE_STYLES[role.type] || TYPE_STYLES["Part-time"]}`}>
          {role.type}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-darkgray">{role.summary}</p>
      <div className="flex flex-wrap gap-1.5">
        {role.tags.map((t) => (
          <span key={t} className="border border-slate2/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-dim/80">{t}</span>
        ))}
      </div>
      <a
        href={mailto}
        className="mt-1 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ozone transition-colors hover:text-flare"
      >
        Apply <ArrowUpRight className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}