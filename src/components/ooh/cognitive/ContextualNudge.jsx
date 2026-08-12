import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';

// Route-aware next-action suggestions — progressive disclosure of the logical next step.
const ROUTE_HINTS = {
  '/': [{ id: 'home_report', label: 'Log a field bust', to: '/report' }],
  '/map': [{ id: 'map_report', label: 'Document a new billboard', to: '/report' }],
  '/report': [{ id: 'report_fund', label: 'Fuel the next action window', to: '/campaign' }],
  '/inhome': [{ id: 'inhome_ar', label: 'Deploy the AR lens', to: '/ar' }],
  '/ar': [{ id: 'ar_scan', label: 'Run a TrueCost scan', to: '/scan' }],
};

function dismissed(id) {
  try {
    return localStorage.getItem(`ooh_nudge_${id}`) === '1';
  } catch {
    return false;
  }
}
function dismiss(id) {
  try {
    localStorage.setItem(`ooh_nudge_${id}`, '1');
  } catch {}
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
      if (next.label) window.dispatchEvent(new CustomEvent('ooh-subvocal', { detail: next.label }));
    }, 1400);
    const t2 = setTimeout(() => setShow(false), 14000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pathname]);

  if (!hint) return null;

  return (
    <div
      className={`fixed left-1/2 z-[70] -translate-x-1/2 transition-all duration-300 bottom-[calc(88px+env(safe-area-inset-bottom))] lg:bottom-6 ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <div className="relative w-[min(92vw,380px)] border border-ozone/40 bg-[#0d0d0d] shadow-[0_0_0_1px_rgba(237,255,0,0.06),0_8px_32px_rgba(0,0,0,0.7),0_0_24px_rgba(237,255,0,0.08)] backdrop-blur-xl">
        {/* Scanline overlay */}
        <div className="crt-scanlines pointer-events-none absolute inset-0 opacity-50" />

        {/* Terminal header */}
        <div className="flex items-center justify-between border-b border-ozone/15 px-3 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-ozone" />
            <span className="h-1.5 w-1.5 rounded-full bg-ozone" />
            <span className="h-1.5 w-1.5 rounded-full bg-dim/25" />
            <span className="ml-1.5 font-mono text-[8px] uppercase tracking-[0.18em] text-dim">
              root@ooh:~
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-ozone"
              style={{ boxShadow: '0 0 6px rgba(237,255,0,0.6)' }}
            />
            <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-ozone/60">
              stable
            </span>
          </div>
        </div>

        {/* Command line */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          <span className="font-mono text-[11px] text-ozone">{'>'}</span>
          <span className="font-mono text-xs text-white">{hint.label}</span>
          <span className="font-mono text-xs text-ozone animate-blink">_</span>
          <div className="ml-auto flex items-center gap-1.5">
            <Link
              to={hint.to}
              onClick={() => dismiss(hint.id)}
              className="flex items-center gap-1 border border-ozone/50 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ozone text-glow-ozone transition-colors hover:bg-ozone/10 hover:shadow-[0_0_12px_rgba(237,255,0,0.3)]"
            >
              Execute <ArrowRight className="h-3 w-3" />
            </Link>
            <button
              onClick={() => {
                dismiss(hint.id);
                setShow(false);
              }}
              aria-label="Abort"
              className="flex items-center justify-center border border-flare/30 px-1.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-flare/60 transition-colors hover:bg-flare/10 hover:text-flare"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
