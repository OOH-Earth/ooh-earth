import { Link } from "react-router-dom";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";
import CoinFaces from "@/components/ooh/lab/poster/CoinFaces";
import CoinDetails from "@/components/ooh/lab/poster/CoinDetails";
import TheSet from "@/components/ooh/lab/poster/TheSet";

// OOH Earth — Genesis Coin concept poster (Lab). Separated from the Hex Engine
// poster: this one is purely the coin — three faces, the I Ching wheel reverse,
// the action-verb edge, specs, and the set. Built from the canonical coin art.
export default function CoinPoster() {
  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-6xl page-top px-6 pb-12">
        <Breadcrumbs items={[{ label: "Lab", to: "/lab" }, { label: "Coin Poster" }]} className="mb-4" />
        <header className="flex flex-wrap items-baseline gap-4 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">Genesis Coin <span className="text-ozone">Poster</span></h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">Physical artifact · cultural token · network seed</p>
          <div className="ml-auto flex items-center gap-4 font-mono text-xs uppercase tracking-[0.1em]">
            <Link to="/lab/poster" className="text-ozone transition-colors hover:text-ozone/70">Hex Engine →</Link>
            <span className="border border-flare/40 px-2 py-0.5 text-flare">Working copy</span>
          </div>
        </header>

        <div className="mt-6 space-y-6">
          <CoinFaces />
          <CoinDetails />
          <TheSet />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { to: "/lab/coin", label: "Genesis Chip Lab" },
            { to: "/lab/poster", label: "Hex Engine Poster" },
            { to: "/lab", label: "Lab" },
          ].map((l) => (
            <Link key={l.to} to={l.to} className="border border-slate2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/50 transition-colors hover:border-ozone hover:text-ozone">{l.label} →</Link>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}