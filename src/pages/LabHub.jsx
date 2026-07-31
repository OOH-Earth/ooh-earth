import { Link } from "react-router-dom";
import { Coins, Grid3x3, Music, Smartphone, FileText, Box, Ruler, Activity, Image as ImageIcon } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";

// OOH Earth — Hex Engine Lab (hub)
// Built on the OOH Earth design system. Landing for the Hex Engine / Genesis
// Coin prototype area; pieces graduate into the main app once proven.

const CARDS = [
  { to: "/lab/coin", icon: Coins, title: "Genesis Coin", desc: "The meme coin you can hold — obverse, reverse, edge, tokenomics.", live: true },
  { to: "/lab/simulator", icon: Grid3x3, title: "Hex Engine Simulator", desc: "Working 64-state device — rings, Ba Gua dial, BLE frame log.", live: true },
  { to: "/lab/device", icon: Box, title: "3D Device", desc: "Interactive brass coin-cube — six rotating faces, spin, explode, HUD.", live: true },
  { to: "/lab/livingcoin", icon: Ruler, title: "Living Coin", desc: "Coin-cube production spec — technical drawings, six rotating brass faces.", live: true },
  { to: "/lab/sequencer", icon: Music, title: "I Ching Sequencer", desc: "64-step sequencer across King Wen, Fuxi & protocol orderings.", live: true },
  { to: "/lab/companion", icon: Smartphone, title: "Companion App", desc: "Five mobile screens: pair, map, hex, wallet, DAO.", live: true },
  { to: "/lab/spec", icon: FileText, title: "Engineering Spec", desc: "State machine, BLE GATT, frame format, screen inventory.", live: true },
  { to: "/lab/poster", icon: ImageIcon, title: "Concept Poster", desc: "2400px infographic — concept art pending media upload.", live: true },
  { to: "/lab/status", icon: Activity, title: "Status Report", desc: "Lab engineering log — build register, revisions, pipeline, roadmap.", live: true },
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
