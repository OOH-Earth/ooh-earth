import { useEffect, useState } from "react";
import Nav from "@/components/ooh/Nav";
import FieldIdCard from "@/components/ooh/fieldid/FieldIdCard";
import FieldIdBack from "@/components/ooh/fieldid/FieldIdBack";
import { base44 } from "@/api/base44Client";
import { IdCard, Printer, Radio } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const TIERS = ["recruit", "field", "veteran", "legend"];

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls = "w-full border border-slate2 bg-card px-3 py-2 font-body text-sm text-silver outline-none focus:border-ozone";

export default function FieldId() {
  const [op, setOp] = useState({ handle: "", name: "", region: "", tier: "recruit", points: 0, verified: false });
  const [ops, setOps] = useState([]);

  useEffect(() => {
    base44.entities.Operative.list()
      .then((list) => setOps(Array.isArray(list) ? list : []))
      .catch(() => setOps([]));
  }, []);

  const set = (k, v) => setOp((o) => ({ ...o, [k]: v }));

  const loadFromRoster = (handle) => {
    const found = ops.find((o) => o.handle === handle);
    if (found) setOp({ handle: found.handle, name: "", region: found.region || "", tier: found.tier || "recruit", points: found.points ?? 0, verified: !!found.verified });
    else setOp((o) => ({ ...o, handle }));
  };

  return (
    <div className="min-h-screen bg-void grid-bg">
      <Nav />

      <div className="fixed left-0 right-0 top-[57px] z-30 border-b border-slate2/60 bg-void/85 backdrop-blur-md md:top-[64px]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-2 md:px-8">
          <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-silver/70">
            <Radio className="h-3 w-3 animate-flicker text-ozone" /> Field ID Kit // Credentialing
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-ozone">ID · LIVE</span>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-5 pb-24 pt-[104px] md:px-8">
        <header className="border-b border-slate2/40 pb-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-ozone">// Field id kit</span>
          <h1 className="mt-3 flex items-center gap-3 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-6xl">
            <IdCard className="h-8 w-8 text-ozone" /> Operative credential
          </h1>
          <p className="mt-4 max-w-2xl font-body text-sm leading-[1.6] text-darkgray">
            Generate a printable field-operative ID badge. Enter your details (or load from the roster), review the credential, and print or save as PDF — carry it in the field as proof of union with the resistance.
          </p>
        </header>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto]">
          {/* Form */}
          <section className="no-print border border-slate2/60 bg-card p-5">
            <div className="mb-4 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-silver">Generate credential</div>
            <div className="space-y-3">
              <Field label="Operative handle">
                <input className={inputCls} value={op.handle} onChange={(e) => set("handle", e.target.value)} placeholder="ghostsignal" />
              </Field>
              {ops.length > 0 && (
                <Field label="Or load from roster">
                  <Select value="" onValueChange={(v) => v && loadFromRoster(v)}>
                    <SelectTrigger className={inputCls}><SelectValue placeholder="— select operative —" /></SelectTrigger>
                    <SelectContent>
                      {ops.map((o) => (
                        <SelectItem key={o.id} value={o.handle}>{o.handle} · {o.tier}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full name"><input className={inputCls} value={op.name} onChange={(e) => set("name", e.target.value)} placeholder="optional" /></Field>
                <Field label="Region"><input className={inputCls} value={op.region} onChange={(e) => set("region", e.target.value)} placeholder="Bangkok" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tier">
                  <Select value={op.tier} onValueChange={(v) => set("tier", v)}>
                    <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Points"><input type="number" className={inputCls} value={op.points} onChange={(e) => set("points", Number(e.target.value))} /></Field>
              </div>
              <label className="flex items-center gap-2 pt-1">
                <input type="checkbox" checked={op.verified} onChange={(e) => set("verified", e.target.checked)} className="h-4 w-4 accent-[#EDFF00]" />
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-silver/70">Verified operative</span>
              </label>
            </div>
          </section>

          {/* Preview + print */}
          <section>
            <div id="field-id-print" className="flex flex-col gap-3">
              <FieldIdCard op={op} />
              <FieldIdBack op={op} />
            </div>
            <button
              onClick={() => window.print()}
              className="no-print mt-3 flex w-[340px] items-center justify-center gap-2 border-2 border-ozone bg-ozone px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare"
            >
              <Printer className="h-4 w-4" /> Print / Save PDF
            </button>
          </section>
        </div>

        <footer className="mt-10 border-t border-slate2/40 pt-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim">// Field ID Kit v1 · non-state credential · carry with honor</p>
        </footer>
      </main>
    </div>
  );
}