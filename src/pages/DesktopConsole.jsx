import { Link } from "react-router-dom";
import { Monitor, ArrowRight, LayoutDashboard, Map as MapIcon, ShieldCheck, Coins, Upload, Settings, Wifi } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";

// Desktop Console — field-ops desktop app prototype (mock window).
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: MapIcon, label: "Map overlay" },
  { icon: ShieldCheck, label: "Moderation", active: true },
  { icon: Coins, label: "Treasury" },
  { icon: Upload, label: "Bulk import" },
  { icon: Settings, label: "Settings" },
];

const QUEUE = [
  ["LOC-8421", "Billboard · Sukhumvit", "pending"],
  ["LOC-8420", "Transit · Victory Mon.", "pending"],
  ["LOC-8419", "Painted · Khlong Toei", "verified"],
  ["LOC-8418", "Digital · Siam", "pending"],
  ["LOC-8417", "Sticker · Asoke", "rejected"],
];

const SPECS = [
  ["Runtime", "Tauri · Rust core"],
  ["Sync", "Offline-first · Web7"],
  ["Bulk", "CSV / KML / GeoJSON"],
  ["Export", "PDF · PNG · GeoJSON"],
  ["Auth", "Wallet + SE bridge"],
  ["OS", "macOS · Win · Linux"],
];

const statusColor = (s) => s === "verified" ? "text-brand-green" : s === "rejected" ? "text-flare" : "text-ozone";

export default function DesktopConsole() {
  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-6xl page-top px-6 pb-12">
        <Breadcrumbs items={[{ label: "Lab", to: "/lab" }, { label: "Devices", to: "/lab/devices" }, { label: "Desktop Console" }]} className="mb-4" />
        <header className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">Desktop <span className="text-ozone">Console</span></h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">Field-ops desktop app · prototype</p>
          <span className="ml-auto border border-flare/40 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-flare">Prototype</span>
        </header>

        {/* mock desktop window */}
        <div className="mt-6 overflow-hidden border border-slate2 bg-card">
          <div className="flex items-center gap-2 border-b border-slate2 bg-void px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-flare" />
            <span className="h-2.5 w-2.5 rounded-full bg-ozone" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate2" />
            <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/50">OOH · Field Console</span>
            <span className="ml-auto flex items-center gap-1 font-mono text-[9px] text-brand-green"><Wifi className="h-3 w-3" /> synced</span>
          </div>

          <div className="grid min-h-[420px] grid-cols-[160px_1fr]">
            <div className="border-r border-slate2 bg-void/60 p-3">
              {NAV_ITEMS.map((n) => (
                <div key={n.label} className={`flex items-center gap-2 px-2 py-2 font-mono text-[10px] uppercase tracking-wider ${n.active ? "border-l-2 border-ozone bg-ozone/5 text-ozone" : "text-silver/50"}`}>
                  <n.icon className="h-3.5 w-3.5" strokeWidth={1.5} /> {n.label}
                </div>
              ))}
            </div>

            <div className="p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">Moderation queue · 24 pending</div>
              <div className="mt-3 border border-slate2/50 font-mono text-xs text-silver/70">
                {QUEUE.map(([id, name, st], i) => (
                  <div key={id} className={`flex items-center justify-between px-3 py-2 ${i % 2 ? "bg-void/30" : ""}`}>
                    <span className="text-silver/40">{id}</span>
                    <span className="flex-1 px-3 text-silver/80">{name}</span>
                    <span className={`text-[9px] uppercase tracking-widest ${statusColor(st)}`}>{st}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="border border-slate2 p-3">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-silver/40">Map overlay</div>
                  <div className="mt-2 h-16 border border-slate2/50 bg-void grid-bg" />
                </div>
                <div className="border border-slate2 p-3">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-silver/40">Treasury</div>
                  <div className="mt-1 text-xl font-bold text-ozone">$48,210</div>
                  <div className="font-mono text-[8px] text-silver/40">+ 2.5% royalty stream</div>
                </div>
                <div className="border border-dashed border-ozone/40 p-3 text-center">
                  <Upload className="mx-auto h-5 w-5 text-ozone/70" strokeWidth={1.5} />
                  <div className="mt-2 font-mono text-[9px] uppercase tracking-widest text-silver/50">Drop CSV / KML</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* build spec */}
        <div className="mt-6 border border-slate2 bg-card p-5">
          <div className="flex items-center gap-2"><Monitor className="h-4 w-4 text-ozone" /><div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Build spec</div></div>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[11px] md:grid-cols-3">
            {SPECS.map(([k, v]) => (<div key={k}><div className="text-[9px] uppercase tracking-widest text-silver/40">{k}</div><div className="text-silver/80">{v}</div></div>))}
          </div>
          <p className="mt-4 font-mono text-[11px] leading-relaxed text-silver/50">A thick-client for field ops: moderate submissions in bulk, import KML/CSV spot data, watch the treasury, and overlay the offense map on a big screen. Offline-first — caches every report and syncs over Web7 on reconnect.</p>
        </div>

        <Link to="/lab/devices" className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver/50 transition-colors hover:text-ozone"><ArrowRight className="h-3 w-3 rotate-180" /> Back to devices</Link>
      </div>
      <SiteFooter />
    </div>
  );
}