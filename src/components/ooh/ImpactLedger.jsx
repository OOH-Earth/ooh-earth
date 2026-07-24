import { Mail, ArrowUpRight } from "lucide-react";

export default function ImpactLedger() {
  return (
    <section id="ledger" className="relative border-t border-slate2/40 bg-void">
      <div className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-4xl">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Section 04 — Contact</span>
          <h2 className="mt-3 font-display text-5xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-7xl">
            Open a channel
          </h2>
          <p className="mt-4 max-w-md font-display text-sm font-normal leading-[1.4] text-darkgray">
            Direct line to the resistance. Signal an intervention, request field support, or route a brief.
          </p>

          <div className="mt-10 border-t border-slate2/40 pt-8">
            <a
              href="mailto:hello@oohearth.app"
              data-cursor="view"
              className="group inline-flex items-baseline gap-3 font-display text-3xl font-bold tracking-[-0.02em] text-silver transition-colors hover:text-ozone md:text-5xl"
            >
              <Mail className="h-7 w-7 translate-y-1 text-ozone md:h-9 md:w-9" />
              hello@oohearth.app
              <ArrowUpRight className="h-6 w-6 translate-y-1 text-dim transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ozone md:h-8 md:w-8" />
            </a>
          </div>

          <p className="mt-6 max-w-sm font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
            Opens your mail client · A field operative routes every transmission within 48 hours.
          </p>
        </div>
      </div>
    </section>
  );
}