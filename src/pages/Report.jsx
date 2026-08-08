import Nav from "@/components/ooh/Nav";
import FieldReport from "@/components/ooh/FieldReport";
import FieldProtocolGuide from "@/components/ooh/report/FieldProtocolGuide";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import SiteFooter from "@/components/ooh/SiteFooter";
import { Link } from "react-router-dom";
import { ArrowRight, Map, Zap } from "lucide-react";


export default function Report() {
  return (
    <div className="relative min-h-screen bg-void">
      <HorizonProgress />
      <Nav />
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
          </div>

          {/* Interactive protocol guide */}
          <div className="mt-8">
            <FieldProtocolGuide />
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
      <SiteFooter />
    </div>
  );
}