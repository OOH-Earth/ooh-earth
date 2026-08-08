import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";

// Route-aware next-action suggestions — progressive disclosure of the logical next step.
const ROUTE_HINTS = {
  "/": [
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
      className={`fixed left-1/2 z-[70] -translate-x-1/2 transition-all duration-300 bottom-[calc(88px+env(safe-area-inset-bottom))] lg:bottom-6 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[#323637] px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/35">Next</span>
        <span className="text-xs font-medium text-white">{hint.label}</span>
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
          className="text-white/30 transition-colors hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}