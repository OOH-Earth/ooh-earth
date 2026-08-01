import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import BrandMark from "@/components/ooh/BrandMark";

// OOH Earth — shared auth shell
// One branded frame for the whole auth flow (login / register / reset):
// mission + operative-rank context on the left, the form slot on the right.
// On the OOH design system (void / ozone / mono / sharp corners).

const TIERS = [
  { label: "Recruit", pts: "0" },
  { label: "Scout", pts: "100" },
  { label: "Field", pts: "500" },
  { label: "Operative", pts: "2k" },
  { label: "Vanguard", pts: "5k" },
];
const TRUST = ["Community-funded", "Copyleft", "No VC", "UN SDG 11.7"];

export const INPUT = "w-full border border-slate2 bg-void py-3 pl-10 pr-3 font-mono text-sm text-silver outline-none transition-colors placeholder:text-darkgray focus:border-ozone";
export const LBL = "font-mono text-[10px] uppercase tracking-[0.2em] text-dim";

export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <header className="flex items-center justify-between border-b border-slate2 px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5 font-brand text-xl tracking-tight text-silver transition-colors hover:text-ozone"><BrandMark className="h-6 w-6" />OOH EARTH</Link>
        <Link to="/map" className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-dim transition-colors hover:text-ozone">
          <MapPin className="h-3.5 w-3.5" /> Explore the map
        </Link>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 lg:grid-cols-2">
        {/* LEFT — mission + rank (shared across the flow) */}
        <div className="flex flex-col justify-center gap-9 px-6 py-12 lg:border-r lg:border-slate2 lg:px-12 lg:py-20">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-ozone">Enter the network</div>
            <h1 className="mt-4 text-3xl font-bold uppercase leading-[1.05] tracking-tight md:text-4xl">Reclaim the<br /><span className="text-ozone">visual commons.</span></h1>
            <p className="mt-4 max-w-md font-mono text-xs leading-loose text-silver/60">
              Map corporate advertising in public space, put every offense on the record, and coordinate the creative response — one city at a time. Community-funded, copyleft, and not for sale.
            </p>
          </div>

          <div>
            <div className={LBL}>Operative rank</div>
            <div className="mt-3 flex flex-wrap items-center gap-1">
              {TIERS.map((t, i) => (
                <div key={t.label} className="flex items-center gap-1">
                  <div className="border border-slate2 px-2 py-1.5 text-center">
                    <div className="font-mono text-[10px] uppercase tracking-wide text-silver/70">{t.label}</div>
                    <div className="font-mono text-[8px] text-dim">{t.pts}</div>
                  </div>
                  {i < TIERS.length - 1 && <ArrowRight className="h-3 w-3 shrink-0 text-slate2" />}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {TRUST.map((t) => <span key={t} className="border border-slate2/60 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-dim">{t}</span>)}
          </div>
        </div>

        {/* RIGHT — form slot */}
        <div className="flex flex-col justify-center px-6 py-12 lg:px-12 lg:py-20">
          <div className="mx-auto w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
