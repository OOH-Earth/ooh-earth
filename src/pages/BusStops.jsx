import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BusFront, Search, ArrowLeft, Key } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import { BUS_STOPS, BUS_STOP_LEGEND } from "@/components/ooh/busStops";
import KeyGlyph from "@/components/ooh/KeyGlyph";

const FACING_COLOR = { pavement: "#880E4F", road: "#FF5252" };

export default function BusStops() {
  const [q, setQ] = useState("");
  const [face, setFace] = useState("all");

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return BUS_STOPS.filter(
      (b) => (face === "all" || b.facing === face) && (!s || b.name.toLowerCase().includes(s))
    );
  }, [q, face]);

  return (
    <div className="min-h-screen bg-void text-silver">
      <Nav />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-24 md:pt-28">
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

        {/* Legend */}
        <div className="mt-5 flex flex-wrap gap-3">
          {BUS_STOP_LEGEND.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
              {l.label}
            </span>
          ))}
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
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
        </div>

        {/* Grid */}
        <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// {list.length} stops</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((b) => (
            <Link
              key={b.id}
              to={`/bus-stop/${b.id}`}
              className="group flex flex-col gap-2 border border-slate2/60 p-3 transition-colors hover:border-ozone/60 hover:bg-slate2/10"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: FACING_COLOR[b.facing] }}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FACING_COLOR[b.facing] }} />
                  {b.facing}
                </span>
                <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.2em] text-flare">
                  <KeyGlyph slug="unknown" className="h-3.5 w-3.5" /> unconfirmed
                </span>
              </div>
              <span className="font-display text-[14px] font-semibold leading-tight text-silver transition-colors group-hover:text-ozone">{b.name}</span>
              <span className="font-mono text-[9px] tabular text-dim/70">{b.lat.toFixed(4)}, {b.lng.toFixed(4)}</span>
            </Link>
          ))}
          {!list.length && (
            <div className="col-span-full py-12 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// no stops match</div>
          )}
        </div>
      </main>
    </div>
  );
}