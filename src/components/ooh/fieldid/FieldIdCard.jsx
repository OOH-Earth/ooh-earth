import BrandMark from "@/components/ooh/BrandMark";

const TIER = {
  recruit: { label: "RECRUIT", cls: "border-silver/50 text-silver" },
  field: { label: "FIELD", cls: "border-ozone text-ozone" },
  veteran: { label: "VETERAN", cls: "border-flare text-flare" },
  legend: { label: "LEGEND", cls: "border-ozone text-ozone text-glow-ozone" },
};

function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return h >>> 0;
}

function memberId(handle) {
  const h = hash(handle || "operative");
  return `OOH-${(h % 9000 + 1000).toString()}-${(h >> 8) % 100}`;
}

function PseudoQR({ seed }) {
  const size = 21;
  let h = hash(seed || "x");
  const cells = [];
  for (let i = 0; i < size * size; i++) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    cells.push((h >> 16) & 1);
  }
  const Finder = ({ r, c }) => (
    <div className="absolute border-2 border-silver" style={{ top: `${(r / size) * 100}%`, left: `${(c / size) * 100}%`, width: `${(7 / size) * 100}%`, height: `${(7 / size) * 100}%` }}>
      <div className="absolute inset-[18%] border border-silver" />
      <div className="absolute inset-[40%] bg-silver" />
    </div>
  );
  return (
    <div className="relative aspect-square w-full bg-void p-[2px]">
      <div className="grid h-full w-full" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {cells.map((on, i) => (
          <div key={i} className={on ? "bg-silver" : "bg-transparent"} />
        ))}
      </div>
      <Finder r={0} c={0} />
      <Finder r={0} c={size - 7} />
      <Finder r={size - 7} c={0} />
    </div>
  );
}

export default function FieldIdCard({ op }) {
  const tier = TIER[op.tier] || TIER.recruit;
  const initials = (op.name || op.handle || "OOH").slice(0, 2).toUpperCase();
  return (
    <div className="relative w-[340px] select-none overflow-hidden border border-slate2 bg-void" style={{ height: "214px" }}>
      <div className="hi-vis-stripes flex h-[26px] items-center justify-between px-3">
        <span className="bg-void px-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-ozone">Out Of Hell™</span>
        <span className="bg-void px-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-ozone">Field Operative</span>
      </div>

      <div className="absolute right-2 top-[30px]"><BrandMark className="h-7 w-7" /></div>

      <div className="flex gap-3 px-3 pt-2">
        <div className="flex h-16 w-14 shrink-0 items-center justify-center border border-slate2 bg-card font-brand text-2xl text-ozone">{initials}</div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[8px] uppercase tracking-[0.25em] text-dim">Operative</div>
          <div className="truncate font-display text-xl font-bold leading-tight tracking-[-0.02em] text-silver">{op.handle || "ghost"}</div>
          <div className="mt-0.5 font-body text-[10px] leading-tight text-darkgray">{op.name}</div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className={`border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em] ${tier.cls}`}>{tier.label}</span>
            {op.verified && <span className="border border-ozone px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-ozone">Verified</span>}
          </div>
        </div>
      </div>

      <div className="absolute bottom-[8px] left-3 right-3 flex items-end justify-between">
        <div className="font-mono text-[8px] leading-tight text-dim">
          <div>REGION · <span className="text-silver/80">{op.region || "—"}</span></div>
          <div>ID · <span className="text-silver/80">{memberId(op.handle)}</span></div>
          <div>PTS · <span className="text-ozone tabular">{op.points ?? 0}</span></div>
        </div>
        <div className="w-14"><PseudoQR seed={op.handle + op.tier} /></div>
      </div>
    </div>
  );
}