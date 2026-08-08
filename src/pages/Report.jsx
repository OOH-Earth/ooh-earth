import Nav from "@/components/ooh/Nav";
import FieldReport from "@/components/ooh/FieldReport";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import SiteFooter from "@/components/ooh/SiteFooter";
import { Link } from "react-router-dom";
import { ArrowRight, Map, FileText, Zap } from "lucide-react";
import { useState } from "react";
import CommandCenter from "@/components/ooh/CommandCenter";

export default function Report() {
  const [commandOpen, setCommandOpen] = useState(false);
  return (
    <div className="relative min-h-screen bg-void">
      <HorizonProgress />
      <Nav onCommand={() => setCommandOpen(true)} />
      <CommandCenter open={commandOpen} onClose={() => setCommandOpen(false)} />
      <main className="page-top px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Field protocol · 01</span>
          <h1 className="mt-3 font-display text-5xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-7xl">
            Log an<br />offense
          </h1>
          <p className="mt-4 max-w-md font-display text-sm leading-[1.4] text-darkgray">
            Document the billboard. Identify the brand, the agency, the operator. Classify the harm. Respond. Every report enters the public archive — no login, no gatekeeper.
          </p>

          {/* Quick nav pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/map" className="inline-flex items-center gap-1.5 border border-slate2 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
              <Map className="h-3 w-3" /> Live map
            </Link>
            <Link to="/location/new" className="inline-flex items-center gap-1.5 border border-slate2 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
              <Zap className="h-3 w-3" /> My reports
            </Link>
            <a href="https://cleancreatives.org/asia-f-list" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 border border-slate2 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
              <FileText className="h-3 w-3" /> F-List Asia
            </a>
          </div>

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
      <SiteFooter onCommand={() => setCommandOpen(true)} />
    </div>
  );
}