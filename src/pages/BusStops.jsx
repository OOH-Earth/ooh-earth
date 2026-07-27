import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BusFront, Search, ArrowLeft } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import { BUS_STOPS, BUS_STOP_LEGEND } from "@/components/ooh/busStops";
import ProgressInfographic from "@/components/ooh/bus/ProgressInfographic";
import AreaDirectory from "@/components/ooh/bus/AreaDirectory";

export default function BusStops() {
  const [q, setQ] = useState("");
  const [face, setFace] = useState("all");
  const [shape, setShape] = useState("all");

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return BUS_STOPS.filter((b) => {
      if (face !== "all" && b.facing !== face) return false;
      if (shape === "shelter" && b.shape !== "shelter") return false;
      if (shape === "pole" && b.shape === "shelter") return false;
      if (s && !b.name.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [q, face, shape]);

  return (
    <div className="min-h-screen bg-void text-silver">
      <Nav />
      <main className="page-top mx-auto max-w-6xl px-5 pb-24">
        <Link to="/map" className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim hover:text-ozone">
          <ArrowLeft className="h-3.5 w-3.5" /> Atlas
        </Link>

        <div className="flex items-center gap-2">
          <BusFront className="h-4 w-4 text-ozone" />
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// london · accessible bus stops</span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.02em] md:text-4xl">Bus-stop directory</h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-darkgray">
          {BUS_STOPS.length} shelters mapped from the public accessible-bus-stops record. Each has its own page
          listing unit type, facing, and a probable access key — <span className="text-flare">unconfirmed until a field check</span>.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          {BUS_STOP_LEGEND.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
              {l.label}
            </span>
          ))}
        </div>

        <div className="mt-6">
          <ProgressInfographic />
        </div>

        <div className="mt-8 mb-3 flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// Directory</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim/50">by location</span>
          <span className="h-px flex-1 bg-slate2/30" />
        </div>

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 border border-slate2 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-dim" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search stops…"
              className="w-full bg-transparent font-mono text-[12px] text-silver placeholder:text-dim/60 focus:outline-none"
            />
          </div>
          <div className="flex border border-slate2">
            {["all", "pavement", "road"].map((f) => (
              <button
                key={f}
                onClick={() => setFace(f)}
                className={`px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${face === f ? "bg-ozone text-void" : "text-darkgray hover:text-ozone"}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex border border-slate2">
            {["all", "shelter", "pole"].map((sh) => (
              <button
                key={sh}
                onClick={() => setShape(sh)}
                className={`px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${shape === sh ? "bg-ozone text-void" : "text-darkgray hover:text-ozone"}`}
              >
                {sh}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// {list.length} stops</div>
        <AreaDirectory stops={list} />
      </main>
    </div>
  );
}