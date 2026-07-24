import { useState } from "react";
import { Send, Check } from "lucide-react";

const SERVICES = [
  { id: "mapping", label: "Field cartography", detail: "Documenting billboard offenses across global coordinates — an open civic record of the visual commons." },
  { id: "production", label: "Creative production", detail: "Design and fabrication of public-space interventions that reclaim attention from corporate enclosure." },
  { id: "strategy", label: "Disruption strategy", detail: "Placement planning and creative direction at city and regional scale, mapped to UN SDG outcomes." },
  { id: "placement", label: "Site activation", detail: "Securing and activating high-impact public locations with local chapters." },
  { id: "documentation", label: "Public-record archiving", detail: "Archiving the visual world as evidence — greenwashing, extraction and disinformation on the record." },
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
    <section id="ledger" className="relative border-t border-slate2/40 bg-void">
      <div className="grid lg:grid-cols-2">
        {/* Capabilities */}
        <div className="border-r border-slate2/40 p-6 md:p-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Section 04 — Impact ledger</span>
          <h2 className="mt-3 font-display text-5xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-6xl">
            Capabilities
          </h2>
          <p className="mt-4 max-w-md font-display text-sm font-normal leading-[1.4] text-darkgray">
            A union of advertising-industry veterans and street artists operating as a non-state disruption agency. Hover a discipline to route it into the inquiry manifest.
          </p>

          <ul className="mt-8 divide-y divide-slate2/40 border-y border-slate2/40">
            {SERVICES.map((s, i) => (
              <li
                key={s.id}
                onMouseEnter={() => setActive(s.id)}
                className="group cursor-pointer py-5"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div className="flex items-baseline gap-3">
                    <span className={`font-mono text-[10px] transition-colors ${active === s.id ? "text-flare" : "text-dim"}`}>0{i + 1}</span>
                    <h3 className={`font-display text-2xl font-bold leading-[1.1] tracking-[-0.02em] transition-colors md:text-3xl ${active === s.id ? "text-silver" : "text-darkgray"}`}>
                      {s.label}
                    </h3>
                  </div>
                  <span className={`h-px transition-all duration-300 ${active === s.id ? "w-12 bg-flare" : "w-4 bg-slate2"}`} />
                </div>
                <p className={`mt-2 pl-7 font-display text-sm font-normal leading-[1.4] transition-opacity ${active === s.id ? "text-silver/60 opacity-100" : "opacity-0"}`}>
                  {s.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Inquiry manifest */}
        <div className="bg-card p-6 md:p-10">
          <div className="flex items-center justify-between border-b border-slate2/40 pb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-darkgray">Live inquiry manifest</span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">
              <span className="h-1.5 w-1.5 animate-flicker rounded-full bg-ozone" /> Open
            </span>
          </div>

          {sent ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-ozone">
                <Check className="h-6 w-6 text-ozone" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold tracking-[-0.02em] text-silver">Manifest logged</h3>
              <p className="mt-2 max-w-xs font-display text-sm font-normal leading-[1.4] text-darkgray">
                Transmission received. A field operative will route your inquiry within 48 hours.
              </p>
              <button onClick={() => { setSent(false); setForm({ name: "", org: "", email: "", message: "" }); }} className="mt-6 border border-slate2 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
                New transmission
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <ManifestField label="Operative name">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border-b border-slate2 bg-transparent pb-2 font-display text-sm font-normal text-silver outline-none transition-colors focus:border-ozone"
                  placeholder="Enter name"
                />
              </ManifestField>
              <div className="grid grid-cols-2 gap-5">
                <ManifestField label="Organization">
                  <input
                    value={form.org}
                    onChange={(e) => setForm({ ...form, org: e.target.value })}
                    className="w-full border-b border-slate2 bg-transparent pb-2 font-display text-sm font-normal text-silver outline-none transition-colors focus:border-ozone"
                    placeholder="Optional"
                  />
                </ManifestField>
                <ManifestField label="Signal (email)">
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border-b border-slate2 bg-transparent pb-2 font-display text-sm font-normal text-silver outline-none transition-colors focus:border-ozone"
                    placeholder="you@signal.earth"
                  />
                </ManifestField>
              </div>
              <ManifestField label="Requested discipline">
                <select
                  value={active}
                  onChange={(e) => setActive(e.target.value)}
                  className="w-full border-b border-flare/50 bg-transparent pb-2 font-display text-sm font-normal text-silver outline-none focus:border-flare"
                >
                  {SERVICES.map((s) => (
                    <option key={s.id} value={s.id} className="bg-void text-silver">{s.label}</option>
                  ))}
                </select>
              </ManifestField>
              <ManifestField label="Mission brief">
                <textarea
                  required
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full resize-none border-b border-slate2 bg-transparent pb-2 font-display text-sm font-normal text-silver outline-none transition-colors focus:border-ozone"
                  placeholder="Describe the intervention..."
                />
              </ManifestField>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 bg-ozone py-4 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-void transition-colors hover:bg-flare hover:text-void"
              >
                Transmit inquiry
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
      <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}