export default function AtlasPreview() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-void">
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute inset-0 flex items-center justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[58%] w-[24%] border border-slate2/50 bg-card" style={{ transform: `translateY(${(i - 1) * 5}px) rotate(${(i - 1) * 4}deg)` }}>
            <div className="h-1.5 bg-ozone/70" />
            <div className="space-y-1 p-1.5">
              <div className="h-1 w-3/4 bg-slate2/60" />
              <div className="h-1 w-1/2 bg-slate2/40" />
              <div className="h-1 w-2/3 bg-slate2/40" />
              <div className="h-1 w-1/3 bg-slate2/30" />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 top-0 h-px bg-ozone/70 animate-scan" />
      <div className="absolute bottom-2 left-2 font-mono text-[8px] uppercase tracking-[0.25em] text-dim/60">// field atlas</div>
    </div>
  );
}