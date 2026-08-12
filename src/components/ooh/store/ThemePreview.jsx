export default function ThemePreview() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-void">
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute left-3 top-3 h-2.5 w-2.5 rounded-full bg-ozone animate-pulse shadow-[0_0_12px_rgba(237,255,0,0.6)]" />
      <div className="absolute left-7 right-3 top-3.5 flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-0.5 flex-1 bg-slate2/50" />
        ))}
      </div>
      <div className="absolute inset-x-3 top-7 bottom-7 grid grid-cols-2 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border border-slate2/40 bg-card p-1">
            <div
              className="h-1 w-1/2 bg-ozone/60 animate-flicker"
              style={{ animationDelay: `${i * 0.35}s` }}
            />
            <div className="mt-1 h-1.5 w-3/4 bg-slate2/50" />
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-2.5 hi-vis-stripes opacity-80" />
    </div>
  );
}
