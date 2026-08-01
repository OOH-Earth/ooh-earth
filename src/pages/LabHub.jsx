import { Link } from "react-router-dom";
import { Coins, Grid3x3, Music, Smartphone, FileText, Box, Ruler, Activity, Image as ImageIcon, UserPlus, Layers, Watch } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";
import { useLabGate } from "@/components/ooh/LabGate";

// OOH Earth — Hex Engine Lab (hub)
// Built on the OOH Earth design system. Landing for the Hex Engine / Genesis
// Coin prototype area; pieces graduate into the main app once proven.

const CARDS = [
  { to: "/lab/coin", icon: Coins, title: "Genesis Chip", desc: "The crypto chip you can hold — physical artifact, 64mm Ø, 1:1 on-chain twin.", live: true },
  { to: "/lab/token", icon: Layers, title: "Genesis Token", desc: "$OOHEX fungible token — community currency, rewards, governance, burn.", live: true },
  { to: "/lab/simulator", icon: Grid3x3, title: "Hex Engine Simulator", desc: "Working 64-state device — rings, Ba Gua dial, BLE frame log.", live: true },
  { to: "/lab/device", icon: Box, title: "3D Device", desc: "Interactive brass coin-cube — six rotating faces, spin, explode, HUD.", live: true },
  { to: "/lab/livingcoin", icon: Ruler, title: "Living Coin", desc: "Coin-cube production spec — technical drawings, six rotating brass faces.", live: true },
  { to: "/lab/sequencer", icon: Music, title: "I Ching Sequencer", desc: "64-step sequencer across King Wen, Fuxi & protocol orderings.", live: true },
  { to: "/lab/companion", icon: Smartphone, title: "Phone Companion", desc: "Five mobile screens: pair, map, hex, wallet, DAO.", live: true },
  { to: "/lab/devices", icon: Watch, title: "Devices", desc: "Wearables & desktop apps — OOH Watch, NFC field tag, desktop console.", live: true },
  { to: "/lab/spec", icon: FileText, title: "Engineering Spec", desc: "State machine, BLE GATT, frame format, screen inventory.", live: true },
  { to: "/lab/poster", icon: ImageIcon, title: "Concept Poster", desc: "2400px infographic — concept art pending media upload.", live: true },
  { to: "/lab/status", icon: Activity, title: "Status Report", desc: "Lab engineering log — build register, revisions, pipeline, roadmap.", live: true },
  { to: "/lab/nft", icon: ImageIcon, title: "NFT Creator", desc: "3D subvertising card studio — slab casing, grading labels, artwork mint.", live: true },
];

function Card({ item }) {
  const Icon = item.icon;
  return (
    <div className={`flex h-full flex-col border border-slate2 bg-card p-5 transition-colors ${item.live ? "hover:border-ozone/50" : "opacity-60"}`}>
      <Icon className={`h-9 w-9 ${item.live ? "text-ozone" : "text-silver/40"}`} strokeWidth={1.5} />
      <div className="mt-3 text-lg font-bold">{item.title}</div>
      <p className="mt-2 flex-1 font-mono text-[11px] leading-relaxed text-silver/50">{item.desc}</p>
      <div className={`mt-4 font-mono text-[11px] uppercase tracking-[0.12em] ${item.live ? "text-ozone" : "text-silver/40"}`}>
        {item.live ? "Open →" : "In build"}
      </div>
    </div>
  );
}

export default function LabHub() {
  const { isAuthenticated } = useLabGate();
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

        {!isAuthenticated && (
          <div className="mb-6 flex flex-wrap items-center gap-3 border border-ozone/30 bg-ozone/5 px-4 py-3">
            <UserPlus className="h-4 w-4 text-ozone" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/70">Browse freely — register an operative handle to generate, export & mint</span>
            <Link to="/register" className="ml-auto border border-ozone px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void">Register</Link>
          </div>
        )}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          {CARDS.map((c) => (c.to
            ? <Link key={c.title} to={c.to} className="block"><Card item={c} /></Link>
            : <Card key={c.title} item={c} />
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}