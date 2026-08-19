export default function BrandCollection({ brandCounts = [] }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ozone">
          // Brands Discovered
        </span>
        <span className="font-mono text-[9px] tabular text-dim">{brandCounts.length} distinct</span>
      </div>
      {brandCounts.length === 0 ? (
        <div className="border border-slate2/60 bg-card p-8 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
          // No brands identified yet — file a report to start your collection
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {brandCounts.map(({ brand, count }) => (
            <div
              key={brand}
              className="flex items-center gap-2 border border-slate2/60 bg-card px-3 py-2"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-silver">
                {brand}
              </span>
              <span className="font-mono text-[10px] font-bold tabular text-ozone">×{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
