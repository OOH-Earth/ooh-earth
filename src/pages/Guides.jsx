import { useEffect, useState } from "react";
import Nav from "@/components/ooh/Nav";
import JourneySteps from "@/components/ooh/guides/JourneySteps";
import StatusMatrix from "@/components/ooh/guides/StatusMatrix";
import { Radio, Compass, AlertTriangle } from "lucide-react";

function Panel({ id, icon: Icon, idx, title, status, children }) {
  return (
    <section id={id} className="border border-slate2/60 bg-card">
      <div className="flex items-center justify-between border-b border-slate2/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <Icon className="h-3.5 w-3.5 text-ozone" />
          <span className="font-mono text-[9px] text-dim">{idx}</span>
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-silver">{title}</h2>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-ozone">
          <span className="h-1.5 w-1.5 bg-ozone animate-flicker" /> {status}
        </span>
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

function useClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString("en-GB", { hour12: false, timeZone: "Asia/Bangkok" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export default function Guides() {
  const clock = useClock();
  return (
    <div className="min-h-screen bg-void grid-bg">
      <Nav />

      <div className="fixed left-0 right-0 top-[calc(57px+env(safe-area-inset-top))] z-30 border-b border-slate2/60 bg-void/85 backdrop-blur-md md:top-[calc(64px+env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-2 md:px-8">
          <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-silver/85">
            <Radio className="h-3 w-3 animate-flicker text-ozone" /> Field Manual // Operations
          </span>
          <span className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
            <span className="hidden sm:inline">BKK · {clock}</span>
            <span className="text-ozone">GUIDES · LIVE</span>
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-5 pb-24 page-top md:px-8">
        <header className="border-b border-slate2/40 pb-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-ozone">// Field manual</span>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-6xl">Guides &amp; gap report</h1>
          <p className="mt-4 max-w-2xl font-body text-sm leading-[1.6] text-darkgray">
            A start-to-finish manual for operating the OOH Street Art & Adbusting Maps app — from first landing to running the dashboard — followed by an honest capability matrix showing exactly what is live, what is gated, and where the gaps remain.
          </p>
        </header>

        <div className="mt-6 space-y-3">
          <Panel id="journey" icon={Compass} idx="01" title="User journey · beginning to end" status="9 steps">
            <JourneySteps />
          </Panel>

          <Panel id="gaps" icon={AlertTriangle} idx="02" title="Capability status & gaps" status="actuals">
            <p className="mb-4 font-body text-sm leading-[1.55] text-darkgray">
              Where the build stands against the mission. Live = shipping now; Beta = functional but incomplete; Gated = requires published HTTPS; Gap = not yet wired or awaiting data.
            </p>
            <StatusMatrix />
          </Panel>
        </div>

        <footer className="mt-8 border-t border-slate2/40 pt-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim">// open-source · union-made · field manual v1</p>
        </footer>
      </main>
    </div>
  );
}