import CopyField from './CopyField';

const CORE = [
  { name: 'VOID', hex: '#000000', token: '--c-void', note: 'canvas' },
  { name: 'SMOKE', hex: '#F1F1F1', token: '--c-silver', note: 'primary text' },
  { name: 'SLATE', hex: '#333333', token: '--c-slate2', note: 'surfaces · borders' },
  { name: 'DIM', hex: '#666666', token: '--c-dim', note: 'muted text' },
  { name: 'DARKGRAY', hex: '#ACACAC', token: '--c-darkgray', note: 'body text' },
  { name: 'OZONE', hex: '#EDFF00', token: '--c-ozone', note: 'primary accent · hi-vis' },
  { name: 'FLARE', hex: '#FF5C00', token: '--c-flare', note: 'secondary accent · neon' },
];

const EXTENDED = [
  { name: 'PINK', hex: '#FF5470' },
  { name: 'BLUE', hex: '#1F51FF' },
  { name: 'GREEN', hex: '#39FF14' },
  { name: 'DEEPPINK', hex: '#FF007F' },
  { name: 'ORANGE', hex: '#FFA500' },
];

export default function BrandPalette() {
  return (
    <div className="space-y-6">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {CORE.map((c) => (
          <CopyField
            key={c.name}
            label={`${c.name} · ${c.note}`}
            value={c.hex}
            note={`var(${c.token})`}
            swatch={c.hex}
          />
        ))}
      </div>
      <div>
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim/60">
          // Extended signal colors
        </span>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {EXTENDED.map((c) => (
            <CopyField key={c.name} label={c.name} value={c.hex} swatch={c.hex} />
          ))}
        </div>
      </div>
    </div>
  );
}
