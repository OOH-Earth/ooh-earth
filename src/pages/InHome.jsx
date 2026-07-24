import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Nav from "@/components/ooh/Nav";
import DigitalScene from "@/components/ooh/inhome/DigitalScene";
import SignalConstellation from "@/components/ooh/inhome/SignalConstellation";
import ScreenGrid from "@/components/ooh/inhome/ScreenGrid";
import BustList from "@/components/ooh/inhome/BustList";
import BustForm from "@/components/ooh/inhome/BustForm";
import { SEED_BUSTS } from "@/components/ooh/inhome/digitalConfig";
import Walkthrough from "@/components/ooh/Walkthrough";
import { Boxes, Network, Grid3x3, Plus, Loader2, Compass } from "lucide-react";

const VIEWS = [
  { id: "scene", label: "Scene", Icon: Boxes },
  { id: "constellation", label: "Signal", Icon: Network },
  { id: "grid", label: "Grid", Icon: Grid3x3 },
];

const TOUR = [
  { title: "In-Home · Digital Adbusting (Beta)", body: "The ad hell that follows you indoors. This is the digital layer — in-game billboards, AR lenses, browser takeovers, sponsored feeds — where the resistance extends onto the screen." },
  { target: '[data-tour="views"]', title: "Three lenses", body: "Scene: a 3D metaverse field of billboards (drag to orbit, click to select). Signal: a constellation of platforms pulsing around the OOH hub. Grid: every bust as a browser/feed ad-slot tile." },
  { target: '[data-tour="stage"]', title: "Each marker is a bust", body: "Click a billboard, node or tile to inspect a documented digital intervention — platform, target brand, method and proof." },
  { target: '[data-tour="list"]', title: "The roster", body: "Every logged bust by platform, target brand and method. Live data — it grows with every submission, just like the OOH atlas." },
  { target: '[data-tour="log"]', title: "Deploy a bust", body: "Log your own: pick a platform, name the brand, choose the method (overlay / replace / hijack / counter), drop a proof link. It lands here instantly, pending verification." },
  { title: "Beta · demo data", body: "These examples are seeded demo busts. The pipeline — logging, points, brand accountability — mirrors the OOH atlas. Deploy your first real one to take it live." },
];

const toBust = (r) => ({
  id: r.id,
  platform: r.platform || "other",
  platform_name: r.platform_name || "",
  surface: r.surface || "",
  target_brand: r.target_brand || "",
  method: r.method || "overlay",
  region: r.region || "",
  proof_url: r.proof_url || "",
  notes: r.notes || "",
  status: r.status || "pending",
});

const seedBusts = () => SEED_BUSTS.map((b, i) => ({ ...b, id: `seed-${i}`, status: "pending" }));

export default function InHome() {
  const [raw, setRaw] = useState(null);
  const [view, setView] = useState("scene");
  const [selectedId, setSelectedId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("ooh_inhome_tour_v1")) {
      setTourOpen(true);
      localStorage.setItem("ooh_inhome_tour_v1", "1");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const recs = await base44.entities.DigitalBust.list("-created_date", 200);
        if (!cancelled) {
          const busts = (recs || []).filter((r) => r.status !== "rejected").map(toBust);
          setRaw(busts.length ? busts : seedBusts());
        }
      } catch (e) {
        if (!cancelled) setRaw(seedBusts());
      }
    })();
    const unsub = base44.entities.DigitalBust.subscribe((event) => {
      setRaw((cur) => {
        if (!cur || !cur.length || cur[0].id?.startsWith("seed-")) return cur;
        const b = toBust(event.data);
        if (event.type === "create") return [b, ...cur.filter((x) => x.id !== b.id)];
        if (event.type === "update") return b.status === "rejected" ? cur.filter((x) => x.id !== b.id) : cur.map((x) => (x.id === b.id ? b : x));
        if (event.type === "delete") return cur.filter((x) => x.id !== b.id);
        return cur;
      });
    });
    return () => { cancelled = true; if (unsub) unsub(); };
  }, [reloadKey]);

  const busts = raw || [];

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-void">
      <Nav />

      <div className="flex items-center justify-between gap-3 border-b border-slate2/60 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-ozone">IN-HOME</span>
          <span className="border border-flare/60 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-flare">Beta</span>
          <span className="hidden truncate font-mono text-[10px] uppercase tracking-[0.25em] text-dim md:inline">// digital adbusting · demo data</span>
        </div>
        <div data-tour="views" className="flex items-center gap-1.5 border border-slate2/60">
          {VIEWS.map((v) => {
            const Icon = v.Icon;
            const active = view === v.id;
            return (
              <button key={v.id} onClick={() => setView(v.id)} aria-label={v.label}
                className={`flex items-center gap-1.5 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${active ? "bg-ozone text-void" : "text-darkgray hover:text-ozone"}`}>
                <Icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{v.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setTourOpen(true)} aria-label="Tour"
            className="flex items-center gap-1.5 border border-slate2/60 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
            <Compass className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Tour</span>
          </button>
          <button data-tour="log" onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5 border border-ozone bg-ozone px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare">
            <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Log bust</span>
          </button>
        </div>
      </div>

      {!raw ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-ozone" />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div data-tour="list" className="hidden w-[300px] shrink-0 border-r border-slate2/60 lg:flex lg:flex-col">
            <BustList busts={busts} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
          <div data-tour="stage" className="relative min-h-0 flex-1">
            {view === "scene" && <DigitalScene busts={busts} selectedId={selectedId} onSelect={setSelectedId} />}
            {view === "constellation" && <SignalConstellation busts={busts} selectedId={selectedId} onSelect={setSelectedId} />}
            {view === "grid" && <ScreenGrid busts={busts} selectedId={selectedId} onSelect={setSelectedId} />}
            <div className="pointer-events-none absolute bottom-2 left-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
              {view === "scene" ? "// drag to orbit · click a billboard" : view === "constellation" ? "// signal map of digital ad surfaces" : "// ad-slot grid · click a tile"}
            </div>
          </div>
        </div>
      )}

      <BustForm open={formOpen} onClose={() => setFormOpen(false)} onCreated={() => setReloadKey((k) => k + 1)} />
      <Walkthrough open={tourOpen} onClose={() => setTourOpen(false)} steps={TOUR} />
    </div>
  );
}