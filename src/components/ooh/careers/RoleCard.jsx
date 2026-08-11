import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin, Briefcase } from "lucide-react";
import { STATUS_META } from "@/components/ooh/careers/roles";

const TYPE_STYLES = {
  Volunteer: "border-ozone/50 text-ozone",
  Contract: "border-flare/50 text-flare",
  "Part-time": "border-silver/40 text-silver",
  Advisory: "border-[#39FF14]/50 text-[#39FF14]",
};

export default function RoleCard({ role }) {
  const st = STATUS_META[role.status] || STATUS_META.future;
  return (
    <Link
      to={`/careers/${role.id}`}
      className="group flex h-full flex-col gap-3 border border-slate2/60 bg-card/40 p-5 transition-colors hover:border-ozone/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`mb-2 inline-flex items-center gap-1.5 border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] ${st.cls}`}>
            <span className={`h-1 w-1 ${st.dot}`} /> {st.label}
          </span>
          <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-silver transition-colors group-hover:text-ozone">{role.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{role.location}</span>
            <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{role.type}</span>
          </div>
        </div>
        <span className={`shrink-0 border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] ${TYPE_STYLES[role.type] || TYPE_STYLES["Part-time"]}`}>
          {role.type}
        </span>
      </div>
      <p className="flex-1 text-sm leading-relaxed text-darkgray">{role.summary}</p>
      <div className="flex flex-wrap gap-1.5">
        {role.tags.map((t) => (
          <span key={t} className="border border-slate2/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-dim/80">{t}</span>
        ))}
      </div>
      <span className="mt-1 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ozone transition-colors group-hover:text-flare">
        View role <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
