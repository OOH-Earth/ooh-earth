import CopyField from './CopyField';

const TYPE = [
  {
    name: 'Display Mark',
    className: 'font-brand text-5xl leading-none tracking-[-0.03em] text-silver',
    spec: "font-family: 'Lacquer'; font-size: 48px; line-height: 1; letter-spacing: -0.03em;",
  },
  {
    name: 'Heading 1',
    className: 'font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-silver',
    spec: "font-family: 'Inter Tight'; font-weight: 700; font-size: 36px; line-height: 1.02; letter-spacing: -0.02em;",
  },
  {
    name: 'Heading 2',
    className: 'font-display text-2xl font-bold leading-[1.05] tracking-[-0.02em] text-silver',
    spec: "font-family: 'Inter Tight'; font-weight: 700; font-size: 24px; line-height: 1.05; letter-spacing: -0.02em;",
  },
  {
    name: 'Heading 3',
    className: 'font-display text-lg font-bold tracking-[-0.01em] text-silver',
    spec: "font-family: 'Inter Tight'; font-weight: 700; font-size: 18px; letter-spacing: -0.01em;",
  },
  {
    name: 'Body',
    className: 'font-body text-sm leading-[1.6] text-darkgray',
    spec: "font-family: 'Inter Tight'; font-weight: 400; font-size: 14px; line-height: 1.6; letter-spacing: -0.005em;",
  },
  {
    name: 'Label · Mono',
    className: 'font-mono text-[10px] uppercase tracking-[0.3em] text-ozone',
    spec: "font-family: 'Inter Tight'; font-weight: 500; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3em;",
  },
  {
    name: 'Caption',
    className: 'font-mono text-[9px] uppercase tracking-[0.25em] text-dim',
    spec: "font-family: 'Inter Tight'; font-weight: 400; font-size: 9px; text-transform: uppercase; letter-spacing: 0.25em;",
  },
];

export default function TypeScale() {
  return (
    <div className="space-y-3">
      {TYPE.map((t) => (
        <div
          key={t.name}
          className="grid gap-3 border border-slate2/50 bg-card p-4 md:grid-cols-[1.4fr_1fr] md:items-center"
        >
          <div className="overflow-hidden">
            <span className="block font-mono text-[9px] uppercase tracking-[0.3em] text-dim">
              {t.name}
            </span>
            <span className={`mt-1 block truncate ${t.className}`}>Aa Bb · OOH Earth</span>
          </div>
          <CopyField label="CSS" value={t.spec} />
        </div>
      ))}
    </div>
  );
}
