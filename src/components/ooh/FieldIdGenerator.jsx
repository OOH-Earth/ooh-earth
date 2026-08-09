import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import FieldIdCard from "@/components/ooh/fieldid/FieldIdCard";
import FieldIdBack from "@/components/ooh/fieldid/FieldIdBack";
import { IdCard, Printer } from "lucide-react";

const TIERS = ["recruit", "field", "veteran", "legend"];
const inputCls = "w-full border border-slate2 bg-card px-3 py-2 font-body text-sm text-silver outline-none focus:border-ozone";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export default function FieldIdGenerator() {
  const [op, setOp] = useState({ handle: "", name: "", region: "", tier: "recruit", points: 0, verified: false });
  const [ops, setOps] = useState([]);

  useEffect(() => {
    base44.entities.Operative.list()
      .then((list) => setOps(Array.isArray(list) ? list : []))
      .catch(() => setOps([]));
  }, []);

  useEffect(() => {
    const cleanup = () => document.body.classList.remove("printing-field-id");
    window.addEventListener("afterprint", cleanup);
    return () => { window.removeEventListener("afterprint", cleanup); cleanup(); };
  }, []);

  const set = (k, v) => setOp((o) => ({ ...o, [k]: v }));
  const loadFromRoster = (handle) => {
    const found = ops.find((o) => o.handle === handle);
    if (found) setOp({ handle: found.handle, name: "", region: found.region || "", tier: found.tier || "recruit", points: found.points ?? 0, verified: !!found.verified });
    else setOp((o) => ({ ...o, handle }));
  };
  const printCard = () => {
    document.body.classList.add("printing-field-id");
    window.print();
  };

  return (
    <section className="border-t border-slate2/40 px-5 py-14 md:px-8">
      <div className="mx-auto max-w-5xl">
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-ozone">// Tactical credential</span>
        <h2 className="mt-3 flex items-center gap-3 font-display text-3xl font-bold tracking-[-0.02em] text-silver md:text-5xl">
          <IdCard className="h-7 w-7 text-ozone" /> Generate your field ID
        </h2>
        <p className="mt-3 max-w-2xl font-body text-sm leading-[1.6] text-darkgray">
          Mint a printable member credential right here. Enter your details or load from the roster, preview the badge, and print or save as PDF — carry proof of membership in the field.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_auto]">
          <div className="no-print space-y-3 border border-slate2/60 bg-card p-5">
            <div className="mb-1 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-silver">Credential builder</div>
            <Field label="Member handle">
              <input className={inputCls} value={op.handle} onChange={(e) => set("handle", e.target.value)} placeholder="ghostsignal" />
            </Field>
            {ops.length > 0 && (
              <Field label="Or load from roster">
                <select className={inputCls} value="" onChange={(e) => e.target.value && loadFromRoster(e.target.value)}>
                  <option value="">— select member —</option>
                  {ops.map((o) => (
                    <option key={o.id} value={o.handle}>{o.handle} · {o.tier}</option>
                  ))}
                </select>
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full name"><input className={inputCls} value={op.name} onChange={(e) => set("name", e.target.value)} placeholder="optional" /></Field>
              <Field label="Region"><input className={inputCls} value={op.region} onChange={(e) => set("region", e.target.value)} placeholder="Bangkok" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tier">
                <select className={inputCls} value={op.tier} onChange={(e) => set("tier", e.target.value)}>
                  {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Points"><input type="number" className={inputCls} value={op.points} onChange={(e) => set("points", Number(e.target.value))} /></Field>
            </div>
            <label className="flex items-center gap-2 pt-1">
              <input type="checkbox" checked={op.verified} onChange={(e) => set("verified", e.target.checked)} className="h-4 w-4 accent-[#EDFF00]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-silver/70">Verified member</span>
            </label>
            <Link to="/field-id" className="mt-1 inline-block font-mono text-[9px] uppercase tracking-[0.25em] text-ozone transition-colors hover:text-flare">Full credential kit →</Link>
          </div>

          <div>
            <div className="print-scope flex flex-col gap-3">
              <FieldIdCard op={op} />
              <FieldIdBack op={op} />
            </div>
            <button
              onClick={printCard}
              className="no-print mt-3 flex w-[340px] items-center justify-center gap-2 border-2 border-ozone bg-ozone px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare"
            >
              <Printer className="h-4 w-4" /> Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}