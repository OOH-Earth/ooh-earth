import { Link } from "react-router-dom";
import { Watch, Tag, Glasses, Monitor, Smartphone, Cpu, ArrowRight, CircleDot } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";
import CompanionWatch from "@/components/ooh/lab/CompanionWatch";

// Devices hub — wearables, companions, and desktop apps for the Hex Engine.
const WEARABLES = [
  { to: "/lab/companion", icon: Watch, title: "OOH Watch", status: "Prototype", desc: "Wrist companion — UWB proximity, secure element, two faces (Field + Hex)." },
  { to: "/lab/devices/field-tag", icon: Tag, title: "NFC Field Tag", status: "Prototype", desc: "Pendant NFC tag — tap-to-claim, tamper-evident, IP68, binds a spot to a wallet." },
  { to: null, icon: Glasses, title: "AR Glasses", status: "Concept", desc: "Heads-up offense overlay — paints the billboard layer onto the field of view." },
  { to: "/lab/companion", icon: Smartphone, title: "Phone Companion", status: "Live", desc: "Five mobile screens — pair, city map, hex state, wallet, DAO." },
];

const DESKTOP = [
  { to: "/lab/devices/desktop", icon: Monitor, title: "Desktop Console", status: "Prototype", desc: "Field-ops desktop app — moderation queue, bulk import, treasury, map overlay." },
  { to: null, icon: Cpu, title: "Field Sync", status: "Concept", desc: "Offline-first desktop relay — caches field reports, syncs on reconnect." },
];

function DeviceCard({ item }) {
  const Icon = item.icon;
  const statusClass = item.status === "Live"
    ? "border-brand-green/50 text-brand-green"
    : item.status === "Prototype"
      ? "border-ozone/50 text-ozone"
      : "border-slate2 text-silver/40";
  const inner = (
    <div className="flex h-full flex-col border border-slate2 bg-card p-5 transition-colors hover:border-ozone/50">
      <div className="flex items-center justify-between">
        <Icon className="h-7 w-7 text-ozone" strokeWidth={1.5} />
        <span className={`border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] ${statusClass}`}>{item.status}</span>
      </div>
      <div className="mt-3 text-base font-bold">{item.title}</div>
      <p className="mt-2 flex-1 font-mono text-[11px] leading-relaxed text-silver/50">{item.desc}</p>
      <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ozone">{item.to ? "Open →" : "Concept"}</div>
    </div>
  );
  return item.to ? <Link to={item.to} className="block h-full">{inner}</Link> : inner;
}

export default function Devices() {
  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-6xl page-top px-6 pb-12">
        <Breadcrumbs items={[{ label: "Lab", to: "/lab" }, { label: "Devices" }]} className="mb-4" />
        <header className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">Devices</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">Wearables · companions · desktop apps</p>
          <span className="ml-auto border border-flare/40 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-flare">Working copy</span>
        </header>

        <p className="my-6 max-w-3xl font-mono text-xs leading-loose text-silver/50">
          The engine lives across surfaces — on the wrist, in the pocket, on the desk, and eventually in the field of view. Every device pairs to the same secure element and signs on a physical press. Prototypes below; each graduates into the main app once proven.
        </p>

        {/* Featured wearable — OOH Watch */}
        <div className="border border-slate2 bg-card p-5">
          <div className="flex items-center gap-2">
            <Watch className="h-4 w-4 text-ozone" />
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Featured wearable · OOH Watch</div>
          </div>
          <div className="mt-5 grid grid-cols-1 items-center gap-6 md:grid-cols-[auto_1fr]">
            <CompanionWatch />
            <div>
              <div className="text-lg font-bold">Wrist companion · prototype</div>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/55">
                A sunlight-legible wrist device that mirrors the engine on the body. UWB rings locate the nearest offense within 2.1m, the secure element signs on a press of the crown, and two faces — Field and Hex — read live state at a glance. Shake to bond with the engine.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[10px]">
                <div className="border border-slate2 p-2"><div className="text-silver/40">UWB</div><div className="text-brand-green">2.1m</div></div>
                <div className="border border-slate2 p-2"><div className="text-silver/40">SE</div><div className="text-ozone">EAL6+</div></div>
                <div className="border border-slate2 p-2"><div className="text-silver/40">FACES</div><div className="text-silver">2</div></div>
              </div>
              <Link to="/lab/companion" className="mt-4 inline-flex items-center gap-2 border border-ozone px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void">Open companion app <ArrowRight className="h-3 w-3" /></Link>
            </div>
          </div>
        </div>

        {/* Wearables grid */}
        <div className="mt-8">
          <div className="flex items-center gap-2"><CircleDot className="h-4 w-4 text-ozone" /><div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Wearables</div></div>
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            {WEARABLES.map((d) => <DeviceCard key={d.title} item={d} />)}
          </div>
        </div>

        {/* Desktop apps grid */}
        <div className="mt-8">
          <div className="flex items-center gap-2"><Monitor className="h-4 w-4 text-ozone" /><div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Desktop apps</div></div>
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            {DESKTOP.map((d) => <DeviceCard key={d.title} item={d} />)}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}