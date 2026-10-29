import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

// CONTAINED (2026-10): this panel used to ask an LLM (with web search) for "real or highly
// probable" ad units in an area, geocode the model's invented addresses and offer to save them as
// Location records. Nothing verified those units, so the generation and the write path are
// removed. Existing records and the manual tools (Report, Capture) are untouched. Restore only
// by wiring a sourced dataset with provenance, not by re-enabling model-generated units; the
// previous implementation is recoverable from git history.
export default function UnitFinder({ open, onClose }) {
  const panelRef = useRef(null);
  useFocusTrap(panelRef, open, { label: 'AI Unit Finder' });

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col border-l border-slate2/70 bg-void shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate2/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ozone" />
            <span className="font-display text-sm font-black uppercase tracking-[0.3em] text-silver">
              AI Unit Finder
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center text-dim transition-colors hover:text-ozone"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-6" data-testid="unit-finder-unavailable" role="status">
          <p className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.2em] text-flare">
            // Unavailable
          </p>
          <p className="font-display text-sm leading-relaxed text-darkgray">
            This tool used to list model-generated guesses of advertising units. They were not
            verified against any source, so it has been switched off and nothing is added to the map
            from it. Records already on the map are unchanged.
          </p>
          <p className="font-display text-sm leading-relaxed text-darkgray">
            To add a real unit, document it yourself with the Report form or Capture, with a photo
            and a location.
          </p>
          <Link
            to="/report"
            onClick={onClose}
            className="flex min-h-[44px] items-center justify-center border border-ozone bg-ozone px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare"
          >
            Open the report form
          </Link>
        </div>
      </div>
    </div>
  );
}
