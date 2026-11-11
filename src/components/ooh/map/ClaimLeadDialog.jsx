import { useId, useLayoutEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Hand } from 'lucide-react';

export default function ClaimLeadDialog({ open, onClose, location, onClaimed = null }) {
  const [handle, setHandle] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const uid = useId();
  // The dialog has no Radix Trigger (the Claim button lives in a card), so remember what had focus when
  // it opened and give focus back there on close. Layout effect: runs before Radix moves focus inside.
  const openerRef = useRef(null);
  useLayoutEffect(() => {
    if (open) openerRef.current = document.activeElement;
  }, [open]);
  const handleId = `${uid}-handle`;
  const noteId = `${uid}-note`;
  const errorId = `${uid}-error`;

  const reset = () => {
    setHandle('');
    setNote('');
    setError('');
  };

  const submit = async () => {
    if (!handle.trim() || !location) return;
    setSubmitting(true);
    setError('');
    try {
      // LeadClaim.create is admin-only in entity RLS -- claimLead is the
      // validated server-side write path (checks the location is real,
      // trims/bounds free text, rejects an already-claimed lead).
      const { data } = await base44.functions.invoke('claimLead', {
        location_id: location.id,
        operative_handle: handle.trim(),
        note: note.trim(),
      });
      if (data?.error) {
        setError(data.error);
        return;
      }
      reset();
      onClaimed?.();
      onClose?.();
    } catch {
      setError('Could not submit claim — try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    reset();
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent
        className="border-slate2 bg-void"
        onCloseAutoFocus={(e) => {
          const el = openerRef.current;
          if (el && el.isConnected && typeof el.focus === 'function') {
            e.preventDefault();
            el.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg text-silver">
            <Hand className="h-4 w-4 text-flare" /> Claim a lead
          </DialogTitle>
          <DialogDescription className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
            {location?.title}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label
              htmlFor={handleId}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray"
            >
              Member handle
            </Label>
            <Input
              id={handleId}
              required
              aria-required="true"
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? errorId : undefined}
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@ghostsignal"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor={noteId}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray"
            >
              Recon note (optional)
            </Label>
            <Textarea
              id={noteId}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="When you plan to document this site…"
              rows={3}
              className="font-mono text-sm"
            />
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
            // adopting a lead assigns it to your handle · document it to earn field credit
          </p>
          {error && (
            <p
              id={errorId}
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-flare"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={close}
            className="font-mono text-[10px] uppercase tracking-[0.2em]"
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={submitting || !handle.trim()}
            className="font-mono text-[10px] uppercase tracking-[0.2em]"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Claim lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
