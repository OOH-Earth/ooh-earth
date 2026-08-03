import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";

const CATEGORIES = ["library", "plugin", "uikit", "theme", "nft", "physical"];
const STATUSES = ["available", "free", "upcoming", "sold_out", "in_build"];

const EMPTY = {
  title: "", subtitle: "", description: "", content: "",
  category: "library", price_usd: 0, status: "available",
  image_url: "", file_url: "", external_url: "",
  edition_size: "", edition_sold: 0, tags: "", featured: false, sort_order: 0,
};

function toForm(item) {
  if (!item) return { ...EMPTY };
  return {
    ...EMPTY,
    ...item,
    tags: Array.isArray(item.tags) ? item.tags.join(", ") : (item.tags || ""),
    edition_size: item.edition_size ?? "",
    price_usd: item.price_usd ?? 0,
  };
}

export default function StoreItemEditor({ item, open, onClose, onSave }) {
  const [form, setForm] = useState(toForm(item));
  const [busy, setBusy] = useState(false);

  useEffect(() => { setForm(toForm(item)); }, [item, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim()) return;
    setBusy(true);
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle?.trim() || "",
      description: form.description?.trim() || "",
      content: form.content?.trim() || "",
      category: form.category,
      price_usd: Number(form.price_usd) || 0,
      status: form.status,
      image_url: form.image_url?.trim() || "",
      file_url: form.file_url?.trim() || "",
      external_url: form.external_url?.trim() || "",
      edition_size: form.edition_size === "" ? undefined : Number(form.edition_size),
      edition_sold: Number(form.edition_sold) || 0,
      tags: String(form.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      featured: !!form.featured,
      sort_order: Number(form.sort_order) || 0,
    };
    try {
      await onSave(payload);
      onClose();
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[88vh] overflow-y-auto max-w-2xl bg-card border-slate2 text-silver">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold tracking-[-0.01em]">
            {item ? "Edit store item" : "New store item"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <Field label="Title *">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} className="bg-void border-slate2" />
          </Field>

          <Field label="Subtitle / tagline">
            <Input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} className="bg-void border-slate2" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="bg-void border-slate2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger className="bg-void border-slate2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Price USD (0 = free)">
              <Input type="number" min="0" step="0.01" value={form.price_usd}
                onChange={(e) => set("price_usd", e.target.value)} className="bg-void border-slate2" />
            </Field>
            <Field label="Edition size">
              <Input type="number" min="0" value={form.edition_size}
                onChange={(e) => set("edition_size", e.target.value)} className="bg-void border-slate2" placeholder="∞" />
            </Field>
            <Field label="Sort order">
              <Input type="number" value={form.sort_order}
                onChange={(e) => set("sort_order", e.target.value)} className="bg-void border-slate2" />
            </Field>
          </div>

          <Field label="Description (short)">
            <Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)}
              className="bg-void border-slate2 resize-none" />
          </Field>

          <Field label="Content (markdown body — library / research docs)">
            <Textarea rows={6} value={form.content} onChange={(e) => set("content", e.target.value)}
              className="bg-void border-slate2 resize-y font-mono text-[11px] leading-relaxed" />
          </Field>

          <Field label="Image URL">
            <Input value={form.image_url} onChange={(e) => set("image_url", e.target.value)}
              className="bg-void border-slate2 font-mono text-[10px]" placeholder="https://…" />
          </Field>

          <Field label="File URL (deliverable download)">
            <Input value={form.file_url} onChange={(e) => set("file_url", e.target.value)}
              className="bg-void border-slate2 font-mono text-[10px]" placeholder="https://…" />
          </Field>

          <Field label="External URL (buy / drop — Zora, mschf…)">
            <Input value={form.external_url} onChange={(e) => set("external_url", e.target.value)}
              className="bg-void border-slate2 font-mono text-[10px]" placeholder="https://…" />
          </Field>

          <Field label="Tags (comma-separated)">
            <Input value={form.tags} onChange={(e) => set("tags", e.target.value)}
              className="bg-void border-slate2" placeholder="research, bristol, billboard" />
          </Field>

          <label className="flex items-center justify-between border border-slate2 bg-void px-3 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/70">Featured spotlight</span>
            <Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
          </label>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-slate2 bg-transparent text-silver hover:bg-slate2/30">
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !form.title.trim()} className="bg-ozone text-void hover:bg-flare hover:text-void">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : item ? "Save changes" : "Create item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-mono text-[9px] uppercase tracking-[0.2em] text-silver/50">{label}</Label>
      {children}
    </div>
  );
}