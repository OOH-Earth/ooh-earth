import Reveal from "@/components/ooh/Reveal";
import { ShieldAlert, Brain, Building2, Cctv, Zap, Languages, Baby, Database, Sun } from "lucide-react";

const CATS = [
  { n: "01", t: "Greenwashing Detection", d: "Corporations dressing pollution as virtue. We document the gap between the ad claim and the real-world impact.", Icon: ShieldAlert, big: true },
  { n: "02", t: "Psychological Manipulation", d: "Ads engineered to exploit anxiety, desire and comparison.", Icon: Brain },
  { n: "03", t: "Public Space Privatization", d: "Corporate seizure of civic surfaces without consent.", Icon: Building2 },
  { n: "04", t: "Surveillance Infrastructure", d: "Screens and sensors that watch the crowd back.", Icon: Cctv },
  { n: "05", t: "Energy Waste Documentation", d: "Digital billboards burning power around the clock.", Icon: Zap },
  { n: "06", t: "Cultural Erasure", d: "Hyperlocal identity overwritten by global brand noise.", Icon: Languages },
  { n: "07", t: "Targeting Children", d: "Predatory placement near schools and playgrounds.", Icon: Baby },
  { n: "08", t: "Data Harvesting", d: "Out-of-home ad tech profiling passers-by.", Icon: Database },
  { n: "09", t: "Light & Noise Pollution", d: "Sleep, wildlife and night skies disrupted.", Icon: Sun },
];

export default function OffenseCategories() {
  return (
    <section className="border-t border-slate2/60 bg-void">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <Reveal>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-ozone">// 9 spot categories</span>
              <h2 className="mt-4 max-w-2xl font-display text-3xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-5xl">
                Every ad tells a story the advertiser doesn't want you to read.
              </h2>
            </div>
            <p className="max-w-xs font-display text-sm leading-relaxed text-darkgray">
              Nine ways corporate advertising shows up — from psychological manipulation to environmental cost, surveillance to cultural erasure.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-2.5 md:grid-cols-3">
          {CATS.map((c, i) => (
            <Reveal key={c.n} delay={i * 0.04}>
              <article className={`group flex h-full flex-col border border-slate2/60 bg-card/40 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-ozone/50 hover:bg-card/80 ${c.big ? "md:col-span-2" : ""}`}>
                <div className="flex items-center justify-between">
                  <c.Icon className="h-5 w-5 text-dim transition-colors group-hover:text-ozone" />
                  <span className="font-mono text-[10px] tabular text-dim/50">{c.n}</span>
                </div>
                <h3 className={`mt-6 font-display font-bold tracking-[-0.02em] text-silver ${c.big ? "text-2xl md:text-3xl" : "text-lg"}`}>{c.t}</h3>
                <p className="mt-2 font-display text-[13px] leading-relaxed text-darkgray">{c.d}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}