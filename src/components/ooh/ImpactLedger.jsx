import { useState } from "react";
import { Send, Check } from "lucide-react";

const SERVICES = [
  { id: "mapping", label: "Field Mapping", detail: "Documenting billboard offenses across global coordinates." },
  { id: "production", label: "Creative Production", detail: "Design and fabrication of public-space interventions." },
  { id: "strategy", label: "Resistance Strategy", detail: "Placement planning and creative direction at scale." },
  { id: "placement", label: "Site Placement", detail: "Securing and activating high-impact locations." },
  { id: "documentation", label: "Documentation", detail: "Archiving the visual world for the public record." },
];

export default function ImpactLedger() {
  const [active, setActive] = useState("mapping");
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", org: "", email: "", message: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section id="ledger" className="relative border-t border-white/5 bg-void">
      <div className="grid lg:grid-cols-2">
        {/* Services */}
        <div className="border-r border-white/5 p-6 md:p-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Section 03 — Impact Ledger</span>
          <h2 className="mt-3 font-display text-5xl font-black uppercase leading-none tracking-tight text-silver md:text-6xl">
            Capabilities
          </h2>
          <p className="mt-4 max-w-md font-mono text-[11px] leading-relaxed text-silver/50">
            A union of advertising industry veterans and street artists. Hover a discipline to route it into the inquiry manifest.
          </p>

          <ul className="mt-8 divide-y divide-white/5 border-y border-white/5">
            {SERVICES.map((s) => (
              <li
                key={s.id}
                onMouseEnter={() => setActive(s.id)}
                className="group cursor-pointer py-5 transition-colors"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div className="flex items-baseline gap-3">
                    <span className={`font-mono text-[10px] transition-colors ${active === s.id ? "text-flare" : "text-silver/30"}`}>0{SERVICES.indexOf(s) + 1}</span>
                    <h3 className={`font-display text-2xl font-black uppercase tracking-tight transition-colors md:text-3xl ${active === s.id ? "text-silver" : "text-silver/40"}`}>
                      {s.label}
                    </h3>
                  </div>
                  <span className={`h-px transition-all duration-300 ${active === s.id ? "w-12 bg-flare" : "w-4 bg-silver/20"}`} />
                </div>
                <p className={`mt-2 pl-7 font-mono text-[11px] leading-relaxed transition-opacity ${active === s.id ? "text-silver/60 opacity-100" : "opacity-0"}`}>
                  {s.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Inquiry form — flight manifest */}
        <div className="bg-card p-6 md:p-10">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-silver/50">Live Inquiry Manifest</span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">
              <span className="h-1.5 w-1.5 animate-flicker rounded-full bg-ozone" /> Open
            </span>
          </div>

          {sent ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-ozone">
                <Check className="h-6 w-6 text-ozone" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-black uppercase tracking-tight text-silver">Manifest Logged</h3>
              <p className="mt-2 max-w-xs font-mono text-[11px] leading-relaxed text-silver/50">
                Transmission received. A field operative will route your inquiry within 48 hours.
              </p>
              <button onClick={() => { setSent(false); setForm({ name: "", org: "", email: "", message: "" }); }} className="mt-6 border border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/60 transition-colors hover:border-ozone hover:text-ozone">
                New Transmission
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <ManifestField label="Operative Name">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border-b border-white/10 bg-transparent pb-2 font-mono text-sm text-silver outline-none transition-colors focus:border-ozone"
                  placeholder="Enter name"
                />
              </ManifestField>
              <div className="grid grid-cols-2 gap-5">
                <ManifestField label="Organization">
                  <input
                    value={form.org}
                    onChange={(e) => setForm({ ...form, org: e.target.value })}
                    className="w-full border-b border-white/10 bg-transparent pb-2 font-mono text-sm text-silver outline-none transition-colors focus:border-ozone"
                    placeholder="Optional"
                  />
                </ManifestField>
                <ManifestField label="Signal (Email)">
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border-b border-white/10 bg-transparent pb-2 font-mono text-sm text-silver outline-none transition-colors focus:border-ozone"
                    placeholder="you@signal.earth"
                  />
                </ManifestField>
              </div>
              <ManifestField label="Requested Discipline">
                <select
                  value={active}
                  onChange={(e) => setActive(e.target.value)}
                  className="w-full border-b border-flare/40 bg-transparent pb-2 font-mono text-sm text-silver outline-none focus:border-flare"
                >
                  {SERVICES.map((s) => (
                    <option key={s.id} value={s.id} className="bg-void text-silver">{s.label}</option>
                  ))}
                </select>
              </ManifestField>
              <ManifestField label="Mission Brief">
                <textarea
                  required
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full resize-none border-b border-white/10 bg-transparent pb-2 font-mono text-sm text-silver outline-none transition-colors focus:border-ozone"
                  placeholder="Describe the intervention..."
                />
              </ManifestField>
              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 bg-ozone py-4 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-void transition-colors hover:bg-flare"
              >
                Transmit Inquiry
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function ManifestField({ label, children }) {
  return (
    <label className="block">
      <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-silver/40">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}