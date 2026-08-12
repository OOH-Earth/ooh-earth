import { Megaphone, BusFront, Monitor, Phone, CircleDot } from 'lucide-react';
import KeyGlyph from '@/components/ooh/KeyGlyph';

// Category tally order matches the UI-kit spec bar: data · bus/shelter ·
// digital · field/phone · billboard. Counts are passed live from the map.
const TALLY = [
  { key: 'sticker', label: 'Data', Icon: CircleDot },
  { key: 'transit', label: 'Bus / Shelter', Icon: BusFront },
  { key: 'digital', label: 'Digital', Icon: Monitor },
  { key: 'other', label: 'Field', Icon: Phone },
  { key: 'billboard', label: 'Billboard', Icon: Megaphone },
];

function HexIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
    </svg>
  );
}

export default function SpecsBar({ counts = {}, total = 0, className = '' }) {
  return (
    <div className={`pointer-events-none select-none ${className}`}>
      {/* category tally — dark grey (#333) */}
      <div className="flex items-stretch border border-white/10 bg-[#1a1a1a]/95 backdrop-blur-md">
        {TALLY.map(({ key, label, Icon }) => {
          const n = counts[key] || 0;
          return (
            <div
              key={key}
              className="flex flex-1 items-center justify-center gap-1.5 border-r border-white/5 px-2 py-1.5 last:border-r-0"
            >
              <Icon className="h-3 w-3 text-ozone" />
              <span className="font-mono text-[11px] font-bold tabular-nums text-silver">{n}</span>
              <span className="hidden font-mono text-[8px] uppercase tracking-[0.15em] text-dim sm:inline">
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* utility — neon green (#00FF00) key standard */}
      <div className="flex items-center gap-2 border border-t-0 border-[#00FF00]/40 bg-black/90 px-2 py-1">
        <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#00FF00]">
          Keys
        </span>
        <div className="flex items-center gap-1 border border-[#00FF00]/40 px-1.5 py-0.5">
          <KeyGlyph slug="h60" className="h-3 w-3 text-[#00FF00]" />
          <span className="font-mono text-[8px] font-bold text-[#00FF00]">H60</span>
        </div>
        <div className="flex items-center gap-1 border border-[#00FF00]/40 px-1.5 py-0.5">
          <HexIcon className="h-3 w-3 text-[#00FF00]" />
          <span className="font-mono text-[8px] font-bold text-[#00FF00]">TX30</span>
        </div>
        <span className="ml-auto font-mono text-[8px] uppercase tracking-[0.2em] text-[#00FF00]/60">
          {total} spots
        </span>
      </div>
    </div>
  );
}
