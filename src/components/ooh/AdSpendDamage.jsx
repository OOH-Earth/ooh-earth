export default function AdSpendDamage() {
  return (
    <section id="ad-spend" className="border-t border-slate2/40 bg-void">
      <div className="px-5 py-16 md:px-8 md:py-24">
        <div className="flex flex-col gap-4 border-b border-slate2/40 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
              // Ad spend and emissions
            </span>
            <h2 className="mt-3 font-display text-5xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-7xl">
              Ad spend
              <br />
              and emissions
            </h2>
          </div>
          <p className="max-w-sm font-display text-sm font-normal leading-[1.4] text-darkgray">
            Reserved for published outdoor-advertising spend figures set beside published emissions
            data, each with a cited source and date. None are shown at the moment.
          </p>
        </div>

        <div
          role="status"
          data-testid="ad-spend-unavailable"
          className="mt-10 border border-slate2/60 p-6 font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-dim"
        >
          // Unavailable: brand-by-brand ad-spend and emissions figures were AI-generated and not
          verified against published sources, so they are not shown. They return only with cited,
          dated sources.
        </div>
      </div>
    </section>
  );
}
