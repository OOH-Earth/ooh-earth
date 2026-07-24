const CODE = [
  "Document every corporate advertising offense on the public record.",
  "Reclaim the visual commons — no vandalism, no harm, no destruction.",
  "Operate with integrity: verified, union-made, open-source.",
];

export default function FieldIdBack({ op }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="relative w-[340px] select-none overflow-hidden border border-slate2 bg-void" style={{ height: "214px" }}>
      <div className="px-3 pt-3">
        <div className="font-mono text-[8px] uppercase tracking-[0.25em] text-ozone">// Operative code of conduct</div>
        <ol className="mt-1.5 space-y-0.5">
          {CODE.map((c, i) => (
            <li key={i} className="flex gap-1.5 font-body text-[9px] leading-tight text-darkgray">
              <span className="font-mono tabular text-ozone">{String(i + 1).padStart(2, "0")}</span>
              <span>{c}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mx-3 mt-2 grid grid-cols-2 gap-2 border-t border-slate2/40 pt-2">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[0.25em] text-dim">Channels</div>
          <div className="font-mono text-[8px] leading-tight text-silver/70">instagram · twitch · zora · $OOHEX</div>
        </div>
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[0.25em] text-dim">Aligned</div>
          <div className="font-mono text-[8px] leading-tight text-silver/70">UN SDGs · open-source</div>
        </div>
      </div>

      <div className="absolute bottom-[8px] left-3 right-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-[7px] uppercase tracking-[0.25em] text-dim">Signature</div>
            <div className="mt-0.5 h-4 w-24 border-b border-silver/40" />
          </div>
          <div className="text-right">
            <div className="font-mono text-[7px] uppercase tracking-[0.25em] text-dim">Issued</div>
            <div className="font-mono text-[8px] text-silver/80">{today}</div>
          </div>
        </div>
      </div>

      <div className="hi-vis-stripes absolute bottom-0 left-0 right-0 h-[6px]" />
    </div>
  );
}