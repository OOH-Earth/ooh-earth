import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Hand } from "lucide-react";

export default function ClaimLeadDialog({ open, onClose, location, onClaimed = null }) {
  const [handle, setHandle] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setHandle(""); setNote(""); setError(""); };

  const submit = async () => {
    if (!handle.trim() || !location) return;
    setSubmitting(true);
    setError("");
    try {
      // LeadClaim.create is admin-only in entity RLS -- claimLead is the
      // validated server-side write path (checks the location is real,
      // trims/bounds free text, rejects an already-claimed lead).
      const { data } = await base44.functions.invoke("claimLead", {
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
      setError("Could not submit claim — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => { reset(); onClose?.(); };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="border-slate2 bg-void">
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
            <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray">Member handle</Label>
            <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@ghostsignal" className="font-mono text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray">Recon note (optional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="When you plan to document this site…" rows={3} className="font-mono text-sm" />
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">// adopting a lead assigns it to your handle · document it to earn field credit</p>
          {error && <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-flare" role="alert">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close} className="font-mono text-[10px] uppercase tracking-[0.2em]">Cancel</Button>
          <Button onClick={submit} disabled={submitting || !handle.trim()} className="font-mono text-[10px] uppercase tracking-[0.2em]">
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Claim lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}