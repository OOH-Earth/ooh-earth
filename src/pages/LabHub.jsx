import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Coins, Grid3x3, Music, Smartphone, FileText, Box, Ruler, Activity, Image as ImageIcon, UserPlus, Layers, Watch, ShieldCheck, Loader2 } from "lucide-react";
import { LAB_PROJECTS } from "@/components/ooh/labProjects";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";
import { useLabGate } from "@/components/ooh/LabGate";
import { useAuth } from "@/lib/AuthContext";
import { isAdmin } from "@/lib/clearance";
import { base44 } from "@/api/base44Client";

// Curated icon + description per prototype path. Access / status / visibility /
// ordering are owned by the LabPrototype entity and edited at /lab/admin.
const META = {
  "/lab/nft": { icon: ImageIcon, title: "NFT Creator", desc: "3D subvertising card studio — slab casing, grading labels, artwork mint." },
  "/lab/sequencer": { icon: Music, title: "I Ching Sequencer", desc: "64-step sequencer across King Wen, Fuxi & protocol orderings." },
  "/lab/poster": { icon: ImageIcon, title: "Hex Engine Poster", desc: "Concept art — the 3D Ba Gua sphere, mechanics of the hand, 64 states." },
  "/lab/coin-poster": { icon: Coins, title: "Genesis Coin Poster", desc: "Concept art — three faces, I Ching wheel, action-verb edge, the set." },
  "/lab/coin": { icon: Coins, title: "Genesis Chip", desc: "The crypto chip you can hold — physical artifact, 64mm Ø, 1:1 on-chain twin." },
  "/lab/token": { icon: Layers, title: "Genesis Token", desc: "$OOHEX fungible token — community currency, rewards, governance, burn." },
  "/lab/simulator": { icon: Grid3x3, title: "Hex Engine Simulator", desc: "Working 64-state device — rings, Ba Gua dial, BLE frame log." },
  "/lab/device": { icon: Box, title: "3D Device", desc: "Interactive brass coin-cube — six rotating faces, spin, explode, HUD." },
  "/lab/livingcoin": { icon: Ruler, title: "Living Coin", desc: "Coin-cube production spec — technical drawings, six rotating brass faces." },
  "/lab/companion": { icon: Smartphone, title: "Phone Companion", desc: "Five mobile screens: pair, map, hex, wallet, DAO." },
  "/lab/devices": { icon: Watch, title: "Devices", desc: "Wearables & desktop apps — OOH Watch, NFC field tag, desktop console." },
  "/lab/spec": { icon: FileText, title: "Engineering Spec", desc: "State machine, BLE GATT, frame format, screen inventory." },
  "/lab/status": { icon: Activity, title: "Status Report", desc: "Lab engineering log — build register, revisions, pipeline, roadmap." },
};

// Registry-defined projects inherit their hub metadata (icon / title / desc) here,
// so a new entry in LAB_PROJECTS needs no separate META edit.
LAB_PROJECTS.forEach((p) => { if (!META[p.path]) META[p.path] = { icon: p.icon, title: p.title, desc: p.desc }; });

function Card({ rec }) {
  const meta = META[rec.path] || { icon: Box, title: rec.title, desc: "" };
  const Icon = meta.icon;
  const live = rec.status === "live";
  const publicAccess = rec.access === "public";
  return (
    <div className="flex h-full flex-col border border-slate2 bg-card p-5 transition-colors hover:border-ozone/50">
      <div className="flex items-center justify-between">
        <Icon className="h-9 w-9 text-ozone" strokeWidth={1.5} />
        <span className={`border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] ${publicAccess ? "border-ozone/50 text-ozone" : "border-flare/40 text-flare"}`}>{publicAccess ? "Public" : "Agency / Investor"}</span>
      </div>
      <div className="mt-3 text-lg font-bold">{rec.title || meta.title}</div>
      <p className="mt-2 flex-1 font-mono text-[11px] leading-relaxed text-silver/50">{meta.desc}</p>
      <div className={`mt-4 font-mono text-[11px] uppercase tracking-[0.12em] ${live ? "text-ozone" : "text-flare"}`}>
        {live ? "Open →" : "In build"}
      </div>
    </div>
  );
}

export default function LabHub() {
  const { isAuthenticated } = useLabGate();
  const { user } = useAuth();
  const admin = !!user && isAdmin(user);
  const [items, setItems] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const recs = await base44.entities.LabPrototype.list("sort_order");
        const list = recs.filter((r) => r.visible !== false);
        // Surface a registry project ONLY when it has no record yet. Once the console
        // has provisioned a row, respect it fully — including visible:false. (Checking
        // the filtered `list` here would re-add hidden projects and defeat the toggle.)
        LAB_PROJECTS.forEach((p) => {
          if (!recs.some((r) => r.path === p.path)) {
            list.unshift({ path: p.path, title: p.title, status: p.status || "in_build", access: p.access || "restricted", sort_order: -1 });
          }
        });
        if (alive) setItems(list);
      } catch {
        if (alive) setItems([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-6xl page-top px-6 pb-12">
        <Breadcrumbs items={[{ label: "Lab" }]} className="mb-4" />
        <header className="flex flex-wrap items-baseline gap-4 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">Hex Engine <span className="text-ozone">Lab</span></h1>
          <span className="ml-auto border border-flare/40 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-flare">Working copy · WIP</span>
        </header>

        <p className="my-6 max-w-2xl font-mono text-xs leading-loose text-silver/50">
          The tangible I Ching controller and Genesis Coin for the oohearth.app ecosystem — street-art maps, DAO, wallet, proof-of-presence. Prototype area; pieces graduate into the main app once proven.
        </p>

        {admin && (
          <Link to="/lab/admin" className="mb-6 inline-flex items-center gap-2 border border-slate2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/70 transition-colors hover:border-ozone hover:text-ozone">
            <ShieldCheck className="h-3.5 w-3.5" /> Control Panel
          </Link>
        )}

        {!isAuthenticated && (
          <div className="mb-6 flex flex-wrap items-center gap-3 border border-ozone/30 bg-ozone/5 px-4 py-3">
            <UserPlus className="h-4 w-4 text-ozone" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/70">Browse freely — register an operative handle to generate, export & mint</span>
            <Link to="/register" className="ml-auto border border-ozone px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void">Register</Link>
          </div>
        )}

        {items === null ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-ozone" />
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
            {items.map((r) => (
              <Link key={r.path} to={r.path} className="block"><Card rec={r} /></Link>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}