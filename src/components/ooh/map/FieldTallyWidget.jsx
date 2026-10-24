import { useState, useEffect, useRef } from 'react';
import { X, BarChart3 } from 'lucide-react';

// Shared field tally widget — closable, terminal-styled.
// Renders on both flat (Leaflet) and globe (MapLibre) maps.
// Renders in normal flow: the parent (Map.jsx's overlay frame) owns its position, so it can
// never collide with sibling overlays or sit under the mobile bottom sheet.
// Closable — collapses to a small button. State persists via localStorage; with no stored
// choice it starts open from md up and collapsed on phones, where vertical space is scarce.
export default function FieldTallyWidget({ markers = [], clusters = 0 }) {
  const [open, setOpen] = useState(() => {
    try {
      const stored = localStorage.getItem('ooh-tally-open');
      if (stored !== null) return stored !== 'false';
    } catch {}
    return !window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    try {
      localStorage.setItem('ooh-tally-open', open ? 'true' : 'false');
    } catch {}
  }, [open]);

  // Open and collapsed are different buttons; hand focus to the new one after a user toggle so a
  // keyboard user does not drop to <body> (which also broke Escape in the parent panel).
  const toggleRef = useRef(null);
  const userToggled = useRef(false);
  useEffect(() => {
    if (userToggled.current) {
      userToggled.current = false;
      toggleRef.current?.focus();
    }
  }, [open]);
  const toggle = (value) => {
    userToggled.current = true;
    setOpen(value);
  };

  const spots = markers.length;
  const verified = markers.filter((m) => m.status === 'verified').length;
  const leads = markers.filter((m) => !m.image && m.status !== 'verified').length;

  const stats = [
    { k: 'Spots', v: spots, c: '#EDFF00' },
    { k: 'Clusters', v: clusters, c: '#FF5C00' },
    { k: 'Leads', v: leads, c: '#FF5C00' },
    { k: 'Verified', v: verified, c: '#39FF14' },
  ];

  if (!open) {
    return (
      <button
        ref={toggleRef}
        onClick={() => toggle(true)}
        aria-label="Show field tally"
        className={`pointer-events-auto relative flex min-h-10 items-center gap-1.5 border border-slate2/70 bg-void/85 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ozone backdrop-blur-md transition-colors hover:border-ozone`}
      >
        <BarChart3 className="h-3 w-3" />
        <span>Tally</span>
        <span className="text-silver tabular">{spots}</span>
      </button>
    );
  }

  return (
    <div
      className={`pointer-events-auto relative flex flex-col border border-slate2/70 bg-void/85 backdrop-blur-md`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate2/60 px-2.5 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-ozone animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
            Field tally
          </span>
        </div>
        <button
          ref={toggleRef}
          onClick={() => toggle(false)}
          aria-label="Hide field tally"
          className="flex h-10 w-10 items-center justify-center text-dim transition-colors hover:text-flare"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-px bg-slate2/40 [@media(max-height:600px)]:grid-cols-4">
        {stats.map((x) => (
          <div key={x.k} className="bg-void px-2.5 py-1.5">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">{x.k}</div>
            <div className="font-mono text-sm font-bold tabular" style={{ color: x.c }}>
              {x.v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
