export default function MetroKitPreview() {
  const stats = [
    { v: '42', w: 30 },
    { v: '1.2k', w: 65 },
    { v: '07', w: 45 },
    { v: '99%', w: 90 },
  ];
  return (
    <div className="relative h-full w-full overflow-hidden bg-void p-2.5">
      <div className="absolute inset-0 grid-bg" />
      <div className="relative grid h-full grid-cols-2 gap-1.5">
        {stats.map((s, i) => (
          <div key={i} className="border border-slate2/50 bg-card p-1.5">
            <div className="font-mono text-[7px] uppercase tracking-[0.15em] text-dim">metric</div>
            <div
              className="mt-0.5 font-display text-sm font-black tabular text-ozone animate-flicker"
              style={{ animationDelay: `${i * 0.4}s` }}
            >
              {s.v}
            </div>
            <div className="mt-1 h-0.5 w-full bg-slate2/40">
              <div className="h-full bg-ozone/70" style={{ width: `${s.w}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
