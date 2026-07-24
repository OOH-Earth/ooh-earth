import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { PLATFORMS, METHODS } from "./digitalConfig";

const empty = {
  platform: "metaverse_game",
  platform_name: "",
  surface: "",
  target_brand: "",
  method: "overlay",
  region: "",
  proof_url: "",
  notes: "",
};

export default function BustForm({ open, onClose, onCreated }) {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.target_brand.trim()) {
      setError("Target brand required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await base44.entities.DigitalBust.create({
        platform: form.platform,
        platform_name: form.platform_name,
        surface: form.surface,
        target_brand: form.target_brand,
        method: form.method,
        region: form.region,
        proof_url: form.proof_url,
        notes: form.notes,
        status: "pending",
      });
      setForm(empty);
      onCreated && onCreated();
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to log bust.");
    } finally {
      setLoading(false);
    }
  };

  const field = "font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg border-slate2 bg-void p-0">
        <DialogHeader className="border-b border-slate2/60 px-5 py-4">
          <DialogTitle className="font-display text-lg font-bold text-silver">Log a digital bust</DialogTitle>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">// in-home adbusting · screen surface</p>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className={field}>Platform</Label>
              <select
                value={form.platform}
                onChange={(e) => set("platform", e.target.value)}
                className="w-full border border-slate2 bg-void px-3 py-2 font-mono text-sm text-silver outline-none focus:border-ozone"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className={field}>App / game</Label>
              <Input value={form.platform_name} onChange={(e) => set("platform_name", e.target.value)} placeholder="Roblox, Chrome, Instagram…" className="border-slate2 bg-void font-mono text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className={field}>Target brand *</Label>
              <Input value={form.target_brand} onChange={(e) => set("target_brand", e.target.value)} placeholder="Shell, Coca-Cola…" className="border-slate2 bg-void font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className={field}>Method</Label>
              <select
                value={form.method}
                onChange={(e) => set("method", e.target.value)}
                className="w-full border border-slate2 bg-void px-3 py-2 font-mono text-sm text-silver outline-none focus:border-ozone"
              >
                {METHODS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className={field}>Surface</Label>
            <Input value={form.surface} onChange={(e) => set("surface", e.target.value)} placeholder="in-game billboard, banner ad, sponsored post…" className="border-slate2 bg-void font-mono text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className={field}>Virtual region / URL</Label>
            <Input value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="Brookhaven Sector 4, theguardian.com…" className="border-slate2 bg-void font-mono text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className={field}>Proof URL</Label>
            <Input value={form.proof_url} onChange={(e) => set("proof_url", e.target.value)} placeholder="screenshot / video link" className="border-slate2 bg-void font-mono text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className={field}>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="border-slate2 bg-void font-mono text-sm" />
          </div>
          {error && <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-flare">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray">Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-ozone font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void hover:bg-flare">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Deploy bust"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}