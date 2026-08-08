import { Image } from "@/components/ui/image";
import { X, ExternalLink, Globe, Building2, MapPin, Layers } from "lucide-react";

export default function MediaCorpDetail({ corp, onClose }) {
  if (!corp) return null;
  const scopeColor = corp.scope === "global" ? "text-ozone" : corp.scope === "regional" ? "text-flare" : "text-darkgray";

  return (
    <div className="absolute inset-0 z-[1100] flex justify-end bg-void/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-slate2/60 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand imagery header */}
        <div className="relative h-48 shrink-0 overflow-hidden border-b border-slate2/60">
          <Image src={corp.image_url} alt={corp.name} className="h-full w-full" fittingType="fill" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
          <button onClick={onClose} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center border border-slate2 bg-void/80 text-silver backdrop-blur-md transition-colors hover:border-flare hover:text-flare">
            <X className="h-4 w-4" />
          </button>
          {/* Scope badge */}
          <div className="absolute left-3 top-3 flex items-center gap-1.5 border border-slate2 bg-void/80 px-2 py-1 backdrop-blur-md">
            <span className={`h-2 w-2 rounded-full ${corp.scope === "global" ? "bg-ozone" : corp.scope === "regional" ? "bg-flare" : "bg-darkgray"}`} />
            <span className={`font-mono text-[8px] font-bold uppercase tracking-[0.2em] ${scopeColor}`}>{corp.scope}</span>
          </div>
          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-silver">{corp.name}</h2>
            <div className="mt-1 flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
              <MapPin className="h-2.5 w-2.5" /> {corp.hq}
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <p className="font-display text-[13px] leading-[1.5] text-darkgray">{corp.desc}</p>

          {/* Stats grid */}
          <div className="mt-4 grid grid-cols-2 gap-px border border-slate2/60 bg-slate2/40">
            <div className="bg-void px-3 py-2.5">
              <div className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                <Globe className="h-2.5 w-2.5" /> Countries
              </div>
              <div className="mt-0.5 font-display text-lg font-bold text-silver">{corp.countries || "—"}</div>
            </div>
            <div className="bg-void px-3 py-2.5">
              <div className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                <Layers className="h-2.5 w-2.5" /> Panels
              </div>
              <div className="mt-0.5 font-display text-lg font-bold text-silver">{corp.panels ? corp.panels.toLocaleString() : "—"}</div>
            </div>
            <div className="bg-void px-3 py-2.5">
              <div className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
                <Building2 className="h-2.5 w-2.5" /> Parent
              </div>
              <div className="mt-0.5 font-display text-[11px] leading-tight text-silver">{corp.parent || "—"}</div>
            </div>
            <div className="bg-void px-3 py-2.5">
              <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim">Scope</div>
              <div className={`mt-0.5 font-display text-sm font-bold uppercase ${scopeColor}`}>{corp.scope}</div>
            </div>
          </div>

          {/* Operating regions */}
          <div className="mt-4">
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">Operating regions</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {corp.regions.map((r) => (
                <span key={r} className="px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] border border-slate2 text-darkgray">{r}</span>
              ))}
            </div>
          </div>

          {/* External link */}
          {corp.url && (
            <a href={corp.url} target="_blank" rel="noreferrer"
              className="mt-5 flex items-center justify-center gap-2 border border-ozone bg-ozone/10 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void">
              <ExternalLink className="h-3.5 w-3.5" /> Visit {corp.name}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}