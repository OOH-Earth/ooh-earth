import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sparkles } from 'lucide-react';

/**
 * #320 Live Canvas checkpoint -- the only implementation step the decision
 * package (docs/ops/ooh-earth/12-LIVE-CANVAS-CHECKPOINT.md) authorizes
 * before the owner resolves its 5 open publishing/rights/moderation
 * questions: "A nonpersistent preview using approved existing assets can
 * explore composition later, with an always-visible CONCEPT label. Do not
 * add saving, sharing, publishing or ownership claims until the checkpoint
 * is resolved."
 *
 * Scope, deliberately narrow:
 * - Reuses the Location's own already-fetched, already-public cover photo
 *   (`loc.image_url`) -- no upload, no new asset, no new fetch.
 * - The caption is plain component state. It is never written to
 *   localStorage, sessionStorage, or any entity -- closing this dialog or
 *   navigating away loses it completely. There is no save/share/export/
 *   publish action anywhere in this component, intentionally.
 * - The "CONCEPT · NOT LIVE" label is permanent and not dismissible or
 *   configurable -- it is not a moderation status and must never be
 *   confused with one (contrast with the real pending/verified/rejected
 *   badges in `@/lib/statusBadge.js`, which this intentionally does not
 *   reuse, to avoid implying this has any moderation state at all).
 * - No backend call, no entity read/write, no new role or permission.
 *
 * Out of scope here, and NOT implemented: persistent storage, publishing,
 * public visibility to anyone but the person looking at their own screen
 * right now, collaboration, export, rights declarations, or moderation.
 * Those remain the 5 unresolved owner decisions in the checkpoint doc.
 */
export default function ConceptPreview({ loc }) {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState('');

  const close = () => {
    setOpen(false);
    setCaption('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="concept-preview-open"
        className="inline-flex items-center gap-1.5 border border-slate2 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
      >
        <Sparkles className="h-3 w-3" /> Preview concept (local, not saved)
      </button>

      <Dialog open={open} onOpenChange={(next) => !next && close()}>
        <DialogContent
          data-testid="concept-preview-dialog"
          className="max-w-2xl border-slate2 bg-void p-2 sm:p-4"
        >
          <div className="flex items-center gap-2 border border-flare/50 bg-flare/[0.06] px-3 py-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-flare">
              Concept · Not live
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-dim">
              Visible only to you, on this screen. Nothing here is saved, shared, or published.
            </span>
          </div>

          {loc?.image_url ? (
            <div className="relative mt-3">
              <img
                src={loc.image_url}
                alt={`${loc.title || 'Location'} -- unmodified existing photo`}
                className="max-h-[60vh] w-full object-contain"
              />
              <span className="pointer-events-none absolute left-2 top-2 border border-flare bg-void/85 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-flare">
                Concept · Not live
              </span>
              {caption && (
                <p className="pointer-events-none absolute bottom-2 left-2 right-2 bg-void/80 px-2 py-1.5 text-[13px] leading-snug text-silver">
                  {caption}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 border border-dashed border-slate2 p-6 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-dim">
              No existing photo here yet to preview a concept against.
            </p>
          )}

          <label className="mt-3 block">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-dim">
              Describe the idea (not saved)
            </span>
            <input
              value={caption}
              onChange={(event) => setCaption(event.target.value.slice(0, 140))}
              placeholder="e.g. a mural across the lower third"
              maxLength={140}
              className="mt-1 w-full border border-slate2 bg-card px-3 py-2 font-mono text-[12px] text-silver outline-none focus-visible:border-ozone"
            />
          </label>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={close}
              className="border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-dim hover:border-flare hover:text-flare"
            >
              Close (discards this)
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
