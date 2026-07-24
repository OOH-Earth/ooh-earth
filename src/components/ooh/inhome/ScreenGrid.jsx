import { platformMeta } from "./digitalConfig";
import { BadgeCheck } from "lucide-react";

// Screen-grid map: digital ad surfaces rendered as browser/feed ad-slot tiles.
export default function ScreenGrid({ busts = [], selectedId, onSelect }) {
  return (
    <div className="absolute inset-0 overflow-y-auto p-4">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {busts.length ? (
          busts.map((b) => {
            const meta = platformMeta(b.platform);
            const Icon = meta.Icon;
            const sel = selectedId === b.id;
            const verified = b.status === "verified";
            return (
              <button
                key={b.id}
                onClick={() => onSelect(b.id)}
                className={`group relative flex aspect-[4/5] flex-col overflow-hidden border text-left transition-colors ${sel ? "border-ozone" : "border-slate2/60 hover:border-darkgray"}`}
                style={{ backgroundColor: "#0a0a0a" }}
              >
                <div className="flex items-center gap-1.5 border-b border-slate2/60 px-2 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-flare/70" />
                  <span className="h-1.5 w-1.5 rounded-full bg-dim" />
                  <span className="h-1.5 w-1.5 rounded-full bg-dim" />
                  <span className="ml-1 truncate font-mono text-[8px] uppercase tracking-[0.15em] text-dim">{b.platform_name || meta.label}</span>
                </div>
                <div className="relative flex flex-1 items-center justify-center overflow-hidden grid-bg">
                  {b.proof_url ? (
                    <img src={b.proof_url} alt="" className="h-full w-full object-cover opacity-80" />
                  ) : (
                    <Icon className="h-7 w-7" style={{ color: meta.accent }} strokeWidth={1.5} />
                  )}
                  {verified && (
                    <span className="absolute left-1 top-1 flex items-center gap-1 bg-void/80 px-1 py-0.5 font-mono text-[7px] font-bold uppercase tracking-[0.15em] text-ozone">
                      <BadgeCheck className="h-3 w-3" /> Busted
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void to-transparent p-1.5">
                    <span className="block font-mono text-[7px] uppercase tracking-[0.15em] text-dim">{b.surface}</span>
                    <span className="block truncate font-display text-xs font-bold text-silver">{b.target_brand}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate2/60 px-2 py-1">
                  <span className="font-mono text-[7px] uppercase tracking-[0.15em] text-dim">{b.method}</span>
                  <span className="font-mono text-[7px] uppercase tracking-[0.15em]" style={{ color: meta.accent }}>{meta.label.split(" ")[0]}</span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// no digital busts logged — adbust a surface to begin</div>
        )}
      </div>
    </div>
  );
}