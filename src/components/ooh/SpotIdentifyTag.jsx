import Reveal from "@/components/ooh/Reveal";

const TRI_A = ["Spot.", "Identify.", "Tag."];
const TRI_B = ["Map.", "Collect.", "Digitalise."];
const PILLS = ["#Adbusters", "#Subvertisers", "#Urban activists", "#Artists", "#Remote teams", "#Policy advocates", "#Community organizers"];

export default function SpotIdentifyTag() {
  return (
    <section className="border-t border-slate2/60 bg-void">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <Reveal>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-ozone">// resistance with infrastructure</span>
          <h2 className="mt-4 font-display text-4xl font-bold leading-[0.95] tracking-[-0.02em] text-silver md:text-6xl">
            Adbusting that keeps<br />
            your city <span className="text-ozone">happier</span>
          </h2>
          <p className="mt-5 max-w-xl font-display text-base leading-relaxed text-darkgray">
            And actively builds commercial-free public access OOH communities — infrastructure that gives the streets back to the people who use them.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-3 md:grid-cols-2">
          <Reveal delay={0.05}>
            <div className="group flex h-full flex-col justify-between border border-slate2/60 p-8 transition-colors hover:border-ozone/50">
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                {TRI_A.map((w) => (
                  <span key={w} className="font-display text-3xl font-bold tracking-[-0.02em] text-silver/80 transition-colors group-hover:text-silver md:text-5xl">{w}</span>
                ))}
              </div>
              <span className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-dim">// field capture</span>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="group flex h-full flex-col justify-between border border-slate2/60 p-8 transition-colors hover:border-ozone/50">
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                {TRI_B.map((w) => (
                  <span key={w} className="font-display text-3xl font-bold tracking-[-0.02em] text-silver/80 transition-colors group-hover:text-ozone md:text-5xl">{w}</span>
                ))}
              </div>
              <span className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-dim">// open archive</span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-wrap items-center gap-2">
            {PILLS.map((p) => (
              <span key={p} className="border border-slate2/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone/50 hover:text-ozone">{p}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}