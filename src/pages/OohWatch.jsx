import { Link } from "react-router-dom";
import { Watch, ArrowRight, Radio, Hexagon, Battery, Droplet, Cpu, Bluetooth, ShieldCheck } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";
import CompanionWatch from "@/components/ooh/lab/CompanionWatch";

// OOH Watch — dedicated page for the wrist companion prototype.
const SPECS = [
  ["UWB", "2.1m proximity"],
  ["Secure element", "EAL6+ on-device"],
  ["Display", "1.9″ OLED · sunlight"],
  ["Battery", "7 days · low-power"],
  ["Water", "IP68 · 1.5m / 60 min"],
  ["Crown", "PRESS to sign"],
  ["Faces", "Field · Hex"],
  ["Pairing", "BLE 5.3 · shake to bond"],
];

const FACES = [
  { icon: Radio, name: "Field", desc: "Live time, shake-to-bond ring, and three complications — nearby offenses, UWB distance, and $OOH balance. The default field face." },
  { icon: Hexagon, name: "Hex", desc: "Read-only mirror of the engine's hexagram state — the active glyph, its binary, and meaning. Glanceable on the wrist." },
];

const FLOW = ["Shake to bond", "BLE 5.3 pair", "SE attestation", "Bind to wallet"];

export default function OohWatch() {
  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-5xl page-top px-6 pb-12">
        <Breadcrumbs items={[{ label: "Lab", to: "/lab" }, { label: "Devices", to: "/lab/devices" }, { label: "OOH Watch" }]} className="mb-4" />
        <header className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">OOH <span className="text-ozone">Watch</span></h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">Wrist companion · prototype</p>
          <span className="ml-auto border border-flare/40 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-flare">Prototype</span>
        </header>

        {/* hero */}
        <div className="mt-6 border border-slate2 bg-card p-6">
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[auto_1fr]">
            <div className="flex justify-center"><CompanionWatch /></div>
            <div>
              <div className="text-lg font-bold">Wrist companion · two faces</div>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/55">
                A sunlight-legible wrist device that mirrors the engine on the body. UWB rings locate the nearest offense within 2.1m, the secure element signs on a PRESS of the crown, and two faces — Field and Hex — read live state at a glance. Shake to bond with the engine.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-widest text-silver/40">
                <span className="flex items-center gap-1 border border-slate2 px-2 py-1"><Bluetooth className="h-3 w-3" /> BLE 5.3</span>
                <span className="flex items-center gap-1 border border-slate2 px-2 py-1"><Cpu className="h-3 w-3" /> SE EAL6+</span>
                <span className="flex items-center gap-1 border border-slate2 px-2 py-1"><Battery className="h-3 w-3" /> 7 days</span>
                <span className="flex items-center gap-1 border border-slate2 px-2 py-1"><Droplet className="h-3 w-3" /> IP68</span>
              </div>
            </div>
          </div>
        </div>

        {/* faces */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {FACES.map((f) => (
            <div key={f.name} className="border border-slate2 bg-card p-5">
              <div className="flex items-center gap-2"><f.icon className="h-4 w-4 text-ozone" /><div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">{f.name} face</div></div>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/55">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* pairing flow */}
        <div className="mt-6 border border-slate2 bg-card p-5">
          <div className="flex items-center gap-2"><Watch className="h-4 w-4 text-ozone" /><div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Pairing flow</div></div>
          <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-silver/65">
            {FLOW.map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <span className="border border-slate2 px-2 py-1">{s}</span>
                {i < FLOW.length - 1 && <ArrowRight className="h-3 w-3 text-ozone" />}
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-silver/50"><ShieldCheck className="h-4 w-4 text-brand-green" /> The crown PRESS triggers on-device signing — the app composes, the secure element signs.</div>
        </div>

        {/* specs */}
        <div className="mt-6 border border-slate2 bg-card p-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Specs</div>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[11px] md:grid-cols-4">
            {SPECS.map(([k, v]) => (<div key={k}><div className="text-[9px] uppercase tracking-widest text-silver/40">{k}</div><div className="text-silver/80">{v}</div></div>))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link to="/lab/devices" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver/50 transition-colors hover:text-ozone"><ArrowRight className="h-3 w-3 rotate-180" /> Back to devices</Link>
          <Link to="/lab/companion" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver/50 transition-colors hover:text-ozone">Phone companion <ArrowRight className="h-3 w-3" /></Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}