import Nav from "@/components/ooh/Nav";
import FieldReport from "@/components/ooh/FieldReport";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Report() {
  return (
    <div className="relative min-h-screen bg-void">
      <HorizonProgress />
      <Nav />
      <main className="px-5 pb-24 pt-28 md:px-8">
        <div className="mx-auto max-w-2xl">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Field protocol · 01</span>
          <h1 className="mt-3 font-display text-5xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-7xl">
            Log an<br />offense
          </h1>
          <p className="mt-4 max-w-md font-display text-sm leading-[1.4] text-darkgray">
            Document the billboard, the painted takeover, the digital screen. Pin it, photograph it, transmit. Every report enters the public record and renders on the live map instantly — no login, no gatekeeper.
          </p>
          <div className="mt-10">
            <FieldReport />
          </div>
          <div className="mt-10 border-t border-slate2/40 pt-6">
            <Link to="/map" className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ozone">
              Open the live map <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}