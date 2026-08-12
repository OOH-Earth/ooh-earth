const HARM_TAGS = [
  { value: 'greenwashing', label: 'Greenwashing / Climate misinfo', sdg: 'SDG 13' },
  { value: 'child_targeting', label: 'Child targeting', sdg: 'WHO / UNICEF' },
  { value: 'discrimination', label: 'Discrimination / Exclusion', sdg: 'SDG 5/10' },
  { value: 'psychological', label: 'Psychological manipulation', sdg: 'EU DSA' },
  { value: 'fossil_promotion', label: 'Fossil fuel promotion', sdg: 'UN Fossil Phasout' },
  { value: 'junk_food', label: 'Health / Junk food marketing', sdg: 'WHO' },
  { value: 'debt_norms', label: 'Economic exploitation / Debt norms', sdg: 'SDG 8' },
  { value: 'gentrification', label: 'Gentrification / Land use', sdg: 'Right to City' },
  { value: 'surveillance', label: 'Surveillance / Facial recognition', sdg: 'Digital Rights' },
  { value: 'cultural_erasure', label: 'Cultural erasure', sdg: 'SDG 10' },
  { value: 'behavioural_targeting', label: 'Behavioural / manipulative design', sdg: 'EU DSA' },
  { value: 'gender_harm', label: 'Sexism / Body image harm', sdg: 'SDG 5' },
];

const CONDITIONS = [
  { value: 'functional', label: '✅ Functional' },
  { value: 'neglected', label: '⚠️ Neglected' },
  { value: 'damaged', label: '❌ Damaged' },
  { value: 'abandoned', label: '🕳 Abandoned' },
  { value: 'reclaimed', label: '🧱 Reclaimed' },
  { value: 'upgraded', label: '🔧 Recently upgraded' },
];

const inp =
  'w-full bg-void border border-slate2 px-4 py-3 font-display text-sm text-silver outline-none transition-colors placeholder:text-dim focus:border-ozone';

export default function ReportStep3Classify({ data, onChange }) {
  const toggleHarm = (v) => {
    const tags = data.harm_tags || [];
    onChange({ harm_tags: tags.includes(v) ? tags.filter((t) => t !== v) : [...tags, v] });
  };

  return (
    <div className="space-y-8">
      {/* Harm statement */}
      <div>
        <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
          What is this ad doing to this space?
        </label>
        <p className="mb-2 font-mono text-[10px] text-dim/60">
          To this community? To you? Speak with truth — not for clicks, but for change.
        </p>
        <textarea
          value={data.harm_statement}
          onChange={(e) => onChange({ harm_statement: e.target.value })}
          rows={4}
          placeholder="Tell us what's wrong with this ad and why it doesn't belong here…"
          className={`${inp} resize-none`}
        />
      </div>

      {/* Harm tags */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
          Categorise the violation <span className="text-dim/50">(select all that apply)</span>
        </label>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {HARM_TAGS.map((h) => {
            const active = (data.harm_tags || []).includes(h.value);
            return (
              <button
                key={h.value}
                type="button"
                onClick={() => toggleHarm(h.value)}
                className={`flex items-start gap-2.5 border p-3 text-left transition-colors ${active ? 'border-flare/50 bg-flare/5' : 'border-slate2/60 bg-card hover:border-slate2'}`}
              >
                <span
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 border ${active ? 'border-flare bg-flare' : 'border-slate2'}`}
                />
                <div>
                  <div
                    className={`font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${active ? 'text-flare' : 'text-darkgray'}`}
                  >
                    {h.label}
                  </div>
                  <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim/60">
                    {h.sdg}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Infrastructure condition */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
          Infrastructure condition
        </label>
        <div className="grid grid-cols-2 gap-px border border-slate2/60 bg-slate2/40 sm:grid-cols-3">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange({ condition: c.value })}
              className={`px-3 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] transition-colors ${data.condition === c.value ? 'bg-ozone text-void' : 'bg-card text-darkgray hover:text-silver'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Field notes */}
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
          Field notes <span className="text-dim/50">(optional)</span>
        </label>
        <textarea
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={3}
          placeholder="Context, counter-narrative, observations…"
          className={`${inp} resize-none`}
        />
      </div>
    </div>
  );
}
