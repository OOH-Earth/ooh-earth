import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';

// Route-aware next-action suggestions — progressive disclosure of the logical next step.
const ROUTE_HINTS = {
  '/': [{ id: 'home_report', label: 'Log a field bust', to: '/report' }],
  '/map': [{ id: 'map_report', label: 'Document a new billboard', to: '/report' }],
  // No '/report' hint: the contribution page does not solicit funds mid-submission.
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
  const boxRef = useRef(null);

  // While visible, publish this card's height so LiveActivityFeed (also fixed, bottom-left) stacks
  // above it instead of overlapping. 14px = the 6px difference in bottom offsets + an 8px gap.
  useEffect(() => {
    const root = document.documentElement;
    const box = boxRef.current;
    if (!show || !box) {
      root.style.removeProperty('--ooh-nudge-clearance');
      return undefined;
    }
    const publish = () =>
      root.style.setProperty('--ooh-nudge-clearance', `${Math.ceil(box.offsetHeight) + 14}px`);
    publish();
    let ro;
    if (typeof ResizeObserver === 'function') {
      ro = new ResizeObserver(publish);
      ro.observe(box);
    }
    return () => {
      ro?.disconnect();
      root.style.removeProperty('--ooh-nudge-clearance');
    };
  }, [show, hint]);

  useEffect(() => {
    const list = ROUTE_HINTS[pathname];
    // In short landscape the map has no room for a floating card on top of the sheet, header and
    // nav: it would hide the map and its controls. The map's own Report action is the same step.
    const shortMap =
      pathname === '/map' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-height: 499px)').matches;
    const next = shortMap ? null : list?.find((h) => !dismissed(h.id)) || null;
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
      <div
        ref={boxRef}
        className="relative w-[min(92vw,380px)] border border-ozone/40 bg-[#0d0d0d] shadow-[0_0_0_1px_rgba(237,255,0,0.06),0_8px_32px_rgba(0,0,0,0.7),0_0_24px_rgba(237,255,0,0.08)] backdrop-blur-xl"
      >
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
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5">
          <span className="font-mono text-[11px] text-ozone">{'>'}</span>
          <span className="font-mono text-xs text-white">{hint.label}</span>
          <span className="font-mono text-xs text-ozone animate-blink">_</span>
          <div className="ml-auto flex items-center gap-1.5">
            <Link
              to={hint.to}
              onClick={() => dismiss(hint.id)}
              className="flex min-h-11 items-center gap-1 border border-ozone/50 px-3 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ozone text-glow-ozone transition-colors hover:bg-ozone/10 hover:shadow-[0_0_12px_rgba(237,255,0,0.3)]"
            >
              Execute <ArrowRight className="h-3 w-3" />
            </Link>
            <button
              onClick={() => {
                dismiss(hint.id);
                setShow(false);
              }}
              aria-label="Abort"
              className="flex min-h-11 min-w-11 items-center justify-center border border-flare/30 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-flare/60 transition-colors hover:bg-flare/10 hover:text-flare"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
