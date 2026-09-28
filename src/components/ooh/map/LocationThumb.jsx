import { useState } from 'react';
import {
  Megaphone,
  Monitor,
  Brush,
  Projector,
  Sticker,
  Frame,
  BusFront,
  MapPin,
  BadgeCheck,
  Waves,
  CircleDot,
  Goal,
} from 'lucide-react';

// Category → icon + accent for placeholders
export const TYPE_META = {
  billboard: { label: 'Billboard', Icon: Megaphone, accent: '#EDFF00' },
  digital: { label: 'Digital', Icon: Monitor, accent: '#EDFF00' },
  painted: { label: 'Painted', Icon: Brush, accent: '#FF5C00' },
  projection: { label: 'Projection', Icon: Projector, accent: '#FF5C00' },
  sticker: { label: 'Sticker', Icon: Sticker, accent: '#EDFF00' },
  mural: { label: 'Mural', Icon: Frame, accent: '#FF5C00' },
  transit: { label: 'Transit', Icon: BusFront, accent: '#EDFF00' },
  skatepark: { label: 'Skatepark', Icon: Waves, accent: '#39FF14' },
  basketball_court: { label: 'Basketball Court', Icon: CircleDot, accent: '#39FF14' },
  multi_use_court: { label: 'Multi-Use Court', Icon: Goal, accent: '#39FF14' },
  other: { label: 'Field', Icon: MapPin, accent: '#B2B2B2' },
};

export const metaFor = (type) => TYPE_META[type] || TYPE_META.other;

// Inline SVG glyphs for raw-HTML contexts (Leaflet/MapLibre popups)
const GLYPH = {
  billboard: `<rect x="6" y="8" width="20" height="12" rx="1" fill="none" stroke="{A}" stroke-width="1.5"/><line x1="10" y1="20" x2="10" y2="26" stroke="{A}" stroke-width="1.5"/><line x1="22" y1="20" x2="22" y2="26" stroke="{A}" stroke-width="1.5"/>`,
  digital: `<rect x="5" y="7" width="22" height="15" rx="1" fill="none" stroke="{A}" stroke-width="1.5"/><line x1="9" y1="11" x2="20" y2="11" stroke="{A}" stroke-width="1" opacity="0.7"/><line x1="9" y1="15" x2="23" y2="15" stroke="{A}" stroke-width="1" opacity="0.7"/><line x1="9" y1="19" x2="17" y2="19" stroke="{A}" stroke-width="1" opacity="0.7"/>`,
  painted: `<path d="M8 22c2-1 3-3 5-3s3 2 5 2 3-3 6-3" fill="none" stroke="{A}" stroke-width="1.5" stroke-linecap="round"/><path d="M10 16c2-1 4-2 6-2s4 1 6 2" fill="none" stroke="{A}" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>`,
  projection: `<path d="M6 16L26 10" stroke="{A}" stroke-width="1.5" stroke-linecap="round"/><rect x="4" y="14" width="4" height="4" fill="{A}"/><path d="M26 8L30 18" stroke="{A}" stroke-width="1" opacity="0.5"/>`,
  sticker: `<circle cx="16" cy="16" r="9" fill="none" stroke="{A}" stroke-width="1.5"/><path d="M16 16L16 25Q22 25 22 19Z" fill="{A}" opacity="0.6"/>`,
  mural: `<rect x="5" y="9" width="22" height="14" fill="none" stroke="{A}" stroke-width="1.5"/><line x1="5" y1="14" x2="27" y2="14" stroke="{A}" stroke-width="1" opacity="0.6"/><line x1="5" y1="19" x2="27" y2="19" stroke="{A}" stroke-width="1" opacity="0.6"/>`,
  transit: `<rect x="7" y="8" width="18" height="14" rx="2" fill="none" stroke="{A}" stroke-width="1.5"/><line x1="7" y1="15" x2="25" y2="15" stroke="{A}" stroke-width="1" opacity="0.6"/><circle cx="11" cy="20" r="1.5" fill="{A}"/><circle cx="21" cy="20" r="1.5" fill="{A}"/>`,
  other: `<path d="M16 7c-4 0-7 3-7 7 0 5 7 11 7 11s7-6 7-11c0-4-3-7-7-7z" fill="none" stroke="{A}" stroke-width="1.5"/><circle cx="16" cy="14" r="2.5" fill="{A}"/>`,
};

// Escape HTML entities for safe interpolation into raw HTML strings
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// HTML string for popup contexts — real photo w/ CONFIRMED badge, else glyph
// placeholder. The glyph placeholder is always rendered first (as the base
// layer) and the photo is overlaid on top of it — if the photo 404s (some
// records only ever had a resized derivative stored, not the original; see
// docs/ops/ooh-earth/02-INCIDENT-MOBILE-LOCATIONS.md), the broken <img>'s own
// onerror removes just itself, revealing the already-designed placeholder
// underneath instead of a bare black rectangle. Dimensions never change.
export function thumbHTML(m) {
  const meta = metaFor(m.type);
  const accent = meta.accent;
  const glyph = (GLYPH[m.type] || GLYPH.other).replace(/\{A\}/g, accent);
  const leadPill =
    m.status !== 'verified'
      ? `<span style="position:absolute;left:4px;top:4px;border:1px solid rgba(255,92,0,0.5);background:rgba(10,10,10,0.7);padding:1px 4px;font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:#FF5C00;font-family:'Inter Tight',sans-serif">Lead</span>`
      : '';
  const placeholder = `<div style="position:relative;width:100%;height:110px;background:#0a0a0a;background-image:linear-gradient(rgba(241,241,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(241,241,241,0.04) 1px,transparent 1px);background-size:14px 14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px">
    ${leadPill}
    <span style="display:flex;height:40px;width:40px;align-items:center;justify-content:center;border-radius:999px;border:1px solid ${accent}55">
      <svg viewBox="0 0 32 32" width="22" height="22" fill="none">${glyph}</svg>
    </span>
    <span style="font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:hsl(var(--muted-foreground));opacity:0.75;font-family:'Inter Tight',sans-serif">No photo yet</span>
    <span style="position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:${accent};opacity:0.85;font-family:'Inter Tight',sans-serif">${meta.label}</span>
  </div>`;
  if (!m.image) return placeholder;
  return `<div style="position:relative;width:100%;height:110px">
    ${placeholder}
    <div style="position:absolute;inset:0">
      <img src="${esc(m.image)}" alt="${esc(m.title)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block" onerror="this.parentElement.remove()" />
      <svg viewBox="0 0 24 24" width="14" height="14" style="position:absolute;left:4px;top:4px"><path d="M12 2l2.4 1.8 3 .2.9 2.9 2.2 2-1 2.8 1 2.8-2.2 2-.9 2.9-3 .2L12 22l-2.4-1.8-3-.2-.9-2.9-2.2-2 1-2.8-1-2.8 2.2-2 .9-2.9 3-.2z" fill="#EDFF00"/><path d="M9 12l2 2 4-4" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
  </div>`;
}

// React thumbnail — real photo w/ CONFIRMED badge, else designed category
// glyph. If the photo 404s (see thumbHTML's comment above — same underlying
// data issue), onError falls back to the same designed placeholder used when
// there's no image at all, instead of a bare broken-image box.
export default function LocationThumb({ m, className = '', imgClassName = '' }) {
  const { Icon, accent } = metaFor(m.type);
  const [imgFailed, setImgFailed] = useState(false);
  if (m.image && !imgFailed) {
    return (
      <div className={`relative shrink-0 overflow-hidden ${className}`}>
        <img
          src={m.image}
          alt={m.title}
          className={`h-full w-full object-cover ${imgClassName}`}
          onError={() => setImgFailed(true)}
        />
        <BadgeCheck className="absolute left-1 top-1 h-4 w-4 text-ozone drop-shadow-[0_0_3px_rgba(0,0,0,0.8)]" />
      </div>
    );
  }
  return (
    <div
      className={`relative flex shrink-0 flex-col items-center justify-center gap-1 grid-bg ${className}`}
      style={{ backgroundColor: '#0a0a0a' }}
    >
      {m.status !== 'verified' && (
        <span className="absolute left-1 top-1 border border-flare/50 bg-void/70 px-1 py-0.5 font-mono text-[6px] font-bold uppercase tracking-[0.2em] text-flare">
          Lead
        </span>
      )}
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full border"
        style={{ borderColor: `${accent}55` }}
      >
        <Icon className="h-5 w-5" style={{ color: accent }} strokeWidth={1.5} />
      </span>
      <span className="font-mono text-[6px] font-bold uppercase tracking-[0.2em] text-dim/75">
        No photo yet
      </span>
      <span
        className="absolute bottom-1 font-mono text-[7px] font-bold uppercase tracking-[0.2em]"
        style={{ color: accent, opacity: 0.8 }}
      >
        {metaFor(m.type).label}
      </span>
    </div>
  );
}
