import Reveal from "@/components/ooh/Reveal";
import { Link } from "react-router-dom";
import { MapPin, Camera, Tag, Upload, Search, Users, FileText, Brush, ArrowUpRight } from "lucide-react";

const STEPS = [
  { n: "01", t: "Spot a billboard in your area", d: "Notice the surface. Every offense starts with someone who stops walking.", Icon: MapPin },
  { n: "02", t: "Photograph the ad infrastructure", d: "Capture the structure, the placement, the context. Evidence over opinion.", Icon: Camera },
  { n: "03", t: "Tag the offense category", d: "Classify the harm across the nine categories of corporate advertising.", Icon: Tag },
  { n: "04", t: "Upload to the global map", d: "Drop the pin. The record is public, dated, and geolocated forever.", Icon: Upload },
  { n: "05", t: "Research the corporate owner", d: "Trace the billboard to the operator, the brand, the money behind it.", Icon: Search },
  { n: "06", t: "Connect with local activists", d: "Find the people already working your borough or city.", Icon: Users },
  { n: "07", t: "File a planning objection", d: "Turn documentation into pressure. Councils respond to records.", Icon: FileText },
  { n: "08", t: "Document the creative resistance", d: "Log the subvertising action. The counter-narrative becomes the archive.", Icon: Brush },
];

export default function FieldWorkflow() {
  return (
    <section className="border-t border-slate2/60 bg-void">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <Reveal>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-ozone">// union made by subvertisers & advertising industry war veterans</span>
          <h2 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-5xl">
            Join a global network documenting corporate visual pollution.
          </h2>
          <p className="mt-5 max-w-2xl font-display text-base leading-relaxed text-darkgray">
            Every pin on the map is data the advertising industry doesn't want public. Every upload builds the case for change.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-px border border-slate2/60 bg-slate2/30 md:grid-cols-2">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.03}>
              <div className="group flex h-full items-start gap-5 bg-void p-6 transition-colors hover:bg-card/60 md:p-8">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-slate2/60 transition-colors group-hover:border-ozone/60 group-hover:bg-ozone/10">
                  <s.Icon className="h-4 w-4 text-darkgray transition-colors group-hover:text-ozone" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[10px] tabular text-ozone">{s.n}</span>
                    <h3 className="font-display text-base font-semibold tracking-[-0.01em] text-silver md:text-lg">{s.t}</h3>
                  </div>
                  <p className="mt-1.5 font-display text-[13px] leading-relaxed text-darkgray">{s.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-12 flex flex-wrap gap-3">
            <Link to="/map" className="group inline-flex items-center gap-2 border-2 border-ozone bg-ozone px-6 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare">
              Explore the map <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link to="/campaign" className="group inline-flex items-center gap-2 border border-slate2/60 px-6 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:border-ozone/60 hover:text-ozone">
              Fund the build <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}