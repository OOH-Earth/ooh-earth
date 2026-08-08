import { useEffect } from "react";
import Nav from "@/components/ooh/Nav";
import FieldReport from "@/components/ooh/FieldReport";
import FieldProtocolGuide from "@/components/ooh/report/FieldProtocolGuide";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import SiteFooter from "@/components/ooh/SiteFooter";
import TerminalTooltip from "@/components/ooh/TerminalTooltip";
import { useWalkthrough } from "@/lib/walkthroughContext";
import { Link } from "react-router-dom";
import { ArrowRight, Map, Zap, Compass } from "lucide-react";

const TOUR_STEPS = [
  {
    target: '[data-tour="report-header"]',
    title: "Start Adbusting",
    body: "This is the field console — your entry point for documenting OOH advertising in public space. Every report enters the public archive. No login, no gatekeeper.",
  },
  {
    target: '[data-tour="report-protocol"]',
    title: "Field Protocol Manual",
    body: "Tap here to open the 4-step safety card foldout. It walks you through Document → Identify → Classify → Respond. Read before deployment.",
  },
  {
    target: '[data-tour="report-form"]',
    title: "The Report Form",
    body: "Fill in the 4-step form: pin the spot with GPS, identify the brand and agency, classify the harm, then log any adbust intervention. Your data saves to the live atlas.",
  },
  {
    target: '[data-tour="report-map-link"]',
    title: "Live Atlas",
    body: "When you're done, jump to the live map to see your report alongside the rest of the network. Every pin is a piece of reclaimed visual commons.",
  },
];

export default function Report() {
  const { registerSteps, startTour } = useWalkthrough();

  useEffect(() => {
    registerSteps(TOUR_STEPS);
  }, [registerSteps]);

  return (
    <div className="relative min-h-screen bg-void">
      <HorizonProgress />
      <Nav />
      <main className="page-top px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Field protocol · 01</span>
          <div data-tour="report-header" className="mt-3 flex items-start gap-3">
            <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-7xl">
              Start<br />Adbusting
            </h1>
            <TerminalTooltip
              label="field console"
              text="The entry point for documenting OOH advertising in public space. Reports enter the public archive."
            />
          </div>
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
            <button
              onClick={startTour}
              className="inline-flex items-center gap-1.5 border-2 border-ozone bg-ozone px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare"
            >
              <Compass className="h-3 w-3" /> Start walkthrough
            </button>
          </div>

          {/* Interactive protocol guide */}
          <div className="mt-8" data-tour="report-protocol">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">/ Tap to open the safety foldout</span>
              <TerminalTooltip
                label="protocol manual"
                text="4-step foldout: Document, Identify, Classify, Respond. Read this before heading into the field."
              />
            </div>
            <FieldProtocolGuide />
          </div>

          <div className="mt-10" data-tour="report-form">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">/ Fill the 4-step report form below</span>
              <TerminalTooltip
                label="report form"
                text="GPS pins the spot. Step 2 identifies the brand/agency. Step 3 classifies harm. Step 4 logs any adbust intervention."
              />
            </div>
            <FieldReport />
          </div>

          <div className="mt-10 border-t border-slate2/40 pt-6" data-tour="report-map-link">
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