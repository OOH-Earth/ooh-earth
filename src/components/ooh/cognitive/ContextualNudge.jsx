import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";

// Route-aware next-action suggestions — progressive disclosure of the logical next step.
const ROUTE_HINTS = {
  "/": [
    { id: "home_atlas", label: "Survey the resistance atlas", to: "/map" },
    { id: "home_report", label: "Log a field bust", to: "/report" },
  ],
  "/map": [{ id: "map_report", label: "Document a new billboard", to: "/report" }],
  "/report": [{ id: "report_fund", label: "Fuel the next action window", to: "/campaign" }],
  "/inhome": [{ id: "inhome_ar", label: "Deploy the AR lens", to: "/ar" }],
  "/ar": [{ id: "ar_scan", label: "Run a TrueCost scan", to: "/scan" }],
};

function dismissed(id) {
  try { return localStorage.getItem(`ooh_nudge_${id}`) === "1"; } catch { return false; }
}
function dismiss(id) {
  try { localStorage.setItem(`ooh_nudge_${id}`, "1"); } catch {}
}

export default function ContextualNudge() {
  const { pathname } = useLocation();
  const [hint, setHint] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const list = ROUTE_HINTS[pathname];
    const next = list?.find((h) => !dismissed(h.id)) || null;
    setHint(next);
    setShow(false);
    if (!next) return;
    const t1 = setTimeout(() => {
      setShow(true);
      if (next.label) window.dispatchEvent(new CustomEvent("ooh-subvocal", { detail: next.label }));
    }, 1400);
    const t2 = setTimeout(() => setShow(false), 14000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pathname]);

  if (!hint) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 transition-all duration-500 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 border border-ozone/40 bg-void/85 px-4 py-2.5 backdrop-blur-md">
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim">Next</span>
        <span className="text-xs text-silver">{hint.label}</span>
        <Link
          to={hint.to}
          onClick={() => dismiss(hint.id)}
          className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:text-flare"
        >
          {hint.to.replace("/", "") || "go"}
          <ArrowRight className="h-3 w-3" />
        </Link>
        <button
          onClick={() => { dismiss(hint.id); setShow(false); }}
          aria-label="Dismiss"
          className="text-dim transition-colors hover:text-silver"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}