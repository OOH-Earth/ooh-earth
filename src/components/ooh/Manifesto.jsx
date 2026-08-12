export default function Manifesto() {
  return (
    <section className="relative border-t border-slate2/40 bg-void">
      <div className="hi-vis-stripes h-1 w-full opacity-80" />
      <div className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
            // Manifesto
          </span>
          <blockquote className="mt-6 font-display text-3xl font-bold leading-[1.15] tracking-[-0.02em] text-silver md:text-5xl">
            “Industry is the ceaseless piracy of the rich against the poor.”
          </blockquote>
          <cite className="mt-5 block font-mono text-[11px] uppercase tracking-[0.25em] not-italic text-darkgray">
            — Emma Goldman
          </cite>
        </div>

        <div className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-4 border-t border-slate2/40 pt-8 text-center md:flex-row md:justify-between md:text-left">
          <p className="font-display text-sm font-medium leading-[1.4] text-silver/70">
            Break it. Stay steady. Don't fuck around.
          </p>
          <a
            href="https://advertisersanonymous.org/"
            target="_blank"
            rel="noreferrer"
            data-cursor="view"
            className="inline-flex items-center gap-2 border border-ozone px-4 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ozone transition-colors hover:bg-ozone hover:text-void"
          >
            Union made · Advertisers Anonymous
          </a>
        </div>
      </div>
    </section>
  );
}
