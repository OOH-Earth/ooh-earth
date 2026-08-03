import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Send, CheckCircle2 } from "lucide-react";

// Public contact form — posts to the captureLead backend function, which
// writes a FundingLead (channel="lead", a pledge / interest signal only).
export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const field = "w-full border border-slate2 bg-void px-3 py-2.5 font-mono text-sm text-silver outline-none transition-colors placeholder:text-dim focus:border-ozone";
  const label = "font-mono text-[9px] uppercase tracking-[0.25em] text-dim";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.message) { setError("Email and message are required."); return; }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("captureLead", {
        name: form.name, email: form.email, message: form.message, amount: 0,
      });
      if (res.data?.ok) setSent(true);
      else setError(res.data?.error || "Something went wrong.");
    } catch (e) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="border border-ozone/40 bg-ozone/5 p-6">
        <CheckCircle2 className="h-6 w-6 text-ozone" />
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">Transmission received</p>
        <p className="mt-2 font-display text-sm leading-relaxed text-darkgray">
          Thanks — we read every message and will reply to {form.email}.
        </p>
        <button
          onClick={() => { setSent(false); setForm({ name: "", email: "", message: "" }); }}
          className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ozone hover:underline"
        >
          Send another →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={`mt-1 ${field}`} placeholder="Your name" />
        </div>
        <div>
          <label className={label}>Email *</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={`mt-1 ${field}`} placeholder="you@email.com" />
        </div>
      </div>
      <div>
        <label className={label}>Message *</label>
        <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={`mt-1 ${field}`} placeholder="How can we help?" />
      </div>
      {error && <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-flare">{error}</p>}
      <button type="submit" disabled={loading}
        className="flex items-center gap-2 bg-ozone px-6 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-void transition-colors hover:bg-flare disabled:opacity-40">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {loading ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}