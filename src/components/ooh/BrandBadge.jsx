import React from 'react';

// ── Brand minicon registry ──────────────────────────────────────────────────
// Small circular logos for major advertisers / OOH operators, rendered as
// inline SVG so they load instantly and theme cleanly. Unknown brands fall
// back to a branded-initial circle.
//
// Each entry: { bg, fg, svg: (ReactNode) | undefined }
//   bg = background color of the circle
//   fg = foreground (glyph/text) color
//   svg = optional inline SVG for brands with a recognizable mark
// If no svg, the first 1–2 letters of the brand are rendered as a glyph.

const BRAND_LOGOS = {
  // ── Advertisers ──
  "mcdonald's": { bg: '#DA291C', fg: '#FFC72C', svg: <GoldenArches /> },
  mcdonalds: { bg: '#DA291C', fg: '#FFC72C', svg: <GoldenArches /> },
  mcdonald: { bg: '#DA291C', fg: '#FFC72C', svg: <GoldenArches /> },
  'coca-cola': { bg: '#F40009', fg: '#FFFFFF', label: 'Coke' },
  'coca cola': { bg: '#F40009', fg: '#FFFFFF', label: 'Coke' },
  pepsi: { bg: '#004B93', fg: '#FFFFFF', svg: <PepsiGlobe /> },
  pepsico: { bg: '#004B93', fg: '#FFFFFF', label: 'PEP' },
  nestlé: { bg: '#1A1A1A', fg: '#FFFFFF', label: 'N' },
  nestle: { bg: '#1A1A1A', fg: '#FFFFFF', label: 'N' },
  unilever: { bg: '#1F36C7', fg: '#FFFFFF', label: 'U' },
  shell: { bg: '#FBCE07', fg: '#DD1D21', svg: <ShellLogo /> },
  'shell plc': { bg: '#FBCE07', fg: '#DD1D21', svg: <ShellLogo /> },
  bp: { bg: '#00A652', fg: '#FFFFFF', label: 'BP' },
  exxonmobil: { bg: '#D2001C', fg: '#FFFFFF', label: 'EM' },
  exxon: { bg: '#D2001C', fg: '#FFFFFF', label: 'EX' },
  chevron: { bg: '#003D7A', fg: '#ED1C24', label: '>' },
  toyota: { bg: '#EB0A1E', fg: '#FFFFFF', svg: <ToyotaRings /> },
  nike: { bg: '#111111', fg: '#FFFFFF', svg: <NikeSwoosh /> },
  virgin: { bg: '#E10A0A', fg: '#FFFFFF', label: 'V' },
  'virgin group': { bg: '#E10A0A', fg: '#FFFFFF', label: 'V' },
  apple: { bg: '#111111', fg: '#FFFFFF', svg: <AppleGlyph /> },
  samsung: { bg: '#1428A0', fg: '#FFFFFF', label: 'SAM' },
  google: { bg: '#FFFFFF', fg: '#4285F4', label: 'G' },
  meta: { bg: '#0866FF', fg: '#FFFFFF', svg: <MetaInfinity /> },
  facebook: { bg: '#0866FF', fg: '#FFFFFF', label: 'f' },
  amazon: { bg: '#232F3E', fg: '#FF9900', label: 'a' },
  altria: { bg: '#FFFFFF', fg: '#1A1A1A', svg: <AltriaGrid /> },
  'philip morris': { bg: '#0066B3', fg: '#FFFFFF', label: 'PM' },
  'philip morris international': { bg: '#0066B3', fg: '#FFFFFF', label: 'PMI' },
  marlboro: { bg: '#FFFFFF', fg: '#D32E12', label: 'M' },
  'british american tobacco': { bg: '#00563F', fg: '#FFFFFF', label: 'BAT' },
  bat: { bg: '#00563F', fg: '#FFFFFF', label: 'BAT' },
  'anheuser-busch': { bg: '#000000', fg: '#FFFFFF', label: 'AB' },
  'anheuser busch': { bg: '#000000', fg: '#FFFFFF', label: 'AB' },
  budweiser: { bg: '#000000', fg: '#FFFFFF', label: 'B' },
  heineken: { bg: '#00A040', fg: '#FFFFFF', label: 'HE' },
  diageo: { bg: '#000000', fg: '#FFFFFF', label: 'DG' },
  'procter & gamble': { bg: '#003DA5', fg: '#FFFFFF', label: 'P&G' },
  'procter and gamble': { bg: '#003DA5', fg: '#FFFFFF', label: 'P&G' },
  'p&g': { bg: '#003DA5', fg: '#FFFFFF', label: 'P&G' },
  'united airlines': { bg: '#002244', fg: '#FFFFFF', label: 'UA' },
  'american airlines': { bg: '#0078D2', fg: '#FFFFFF', label: 'AA' },
  delta: { bg: '#003366', fg: '#FFFFFF', label: 'DL' },
  lufthansa: { bg: '#05164D', fg: '#FFAD00', label: 'LH' },
  hsbc: { bg: '#DB0011', fg: '#FFFFFF', label: 'HSBC' },
  'jpmorgan chase': { bg: '#0B4DA2', fg: '#FFFFFF', label: 'JPM' },
  jpmorgan: { bg: '#0B4DA2', fg: '#FFFFFF', label: 'JPM' },
  'goldman sachs': { bg: '#7399C6', fg: '#FFFFFF', label: 'GS' },
  visa: { bg: '#1A1F71', fg: '#FFFFFF', label: 'VISA' },
  mastercard: { bg: '#EB001B', fg: '#FFFFFF', svg: <MastercardRings /> },
  alibaba: { bg: '#FF6A00', fg: '#FFFFFF', label: 'ALI' },
  tencent: { bg: '#12B7F5', fg: '#FFFFFF', label: 'TC' },
  bytedance: { bg: '#000000', fg: '#25F4EE', label: 'BD' },
  tiktok: { bg: '#000000', fg: '#25F4EE', label: 'TT' },

  // ── OOH Operators ──
  jcdecaux: { bg: '#E6007E', fg: '#FFFFFF', label: 'JCD' },
  'clear channel outdoor': { bg: '#2B95D6', fg: '#FFFFFF', label: 'CC' },
  'clear channel': { bg: '#2B95D6', fg: '#FFFFFF', label: 'CC' },
  'clear channel uk': { bg: '#2B95D6', fg: '#FFFFFF', label: 'CC' },
  'bauer media outdoor': { bg: '#E2007A', fg: '#FFFFFF', label: 'BM' },
  'bauer media': { bg: '#E2007A', fg: '#FFFFFF', label: 'BM' },
  'lamar advertising': { bg: '#00529B', fg: '#FFFFFF', label: 'LAM' },
  lamar: { bg: '#00529B', fg: '#FFFFFF', label: 'LAM' },
  'outfront media': { bg: '#ED1C24', fg: '#FFFFFF', label: 'OM' },
  outfront: { bg: '#ED1C24', fg: '#FFFFFF', label: 'OM' },
  ströer: { bg: '#FFD200', fg: '#1A1A1A', label: 'STR' },
  stroeer: { bg: '#FFD200', fg: '#1A1A1A', label: 'STR' },
  'ooh!media': { bg: '#0096D6', fg: '#FFFFFF', label: 'oOh' },
  'ocean outdoor': { bg: '#003DA5', fg: '#FFFFFF', label: 'OC' },
  global: { bg: '#6A1B9A', fg: '#FFFFFF', label: 'GLO' },
  'global group': { bg: '#6A1B9A', fg: '#FFFFFF', label: 'GLO' },
  'exterion media': { bg: '#6A1B9A', fg: '#FFFFFF', label: 'EXT' },
  'plan b media': { bg: '#003DA5', fg: '#FFFFFF', label: 'PB' },
  'focus media': { bg: '#005BAC', fg: '#FFFFFF', label: 'FM' },
  'pattison outdoor': { bg: '#0033A0', fg: '#FFFFFF', label: 'PAT' },
  asiaray: { bg: '#E60012', fg: '#FFFFFF', label: 'AR' },
  'alliance media': { bg: '#1A1A1A', fg: '#D4AF37', label: 'AM' },
  'blowup media': { bg: '#00529B', fg: '#FFFFFF', label: 'BUM' },
  broadsign: { bg: '#1B1B1B', fg: '#00C853', label: 'BS' },

  // ── Agencies / Holding companies ──
  wpp: { bg: '#9B003F', fg: '#FFFFFF', label: 'WPP' },
  omnicom: { bg: '#000000', fg: '#FFFFFF', label: 'OMC' },
  'omnicom group': { bg: '#000000', fg: '#FFFFFF', label: 'OMC' },
  publicis: { bg: '#003DA5', fg: '#FFFFFF', label: 'PUB' },
  'publicis groupe': { bg: '#003DA5', fg: '#FFFFFF', label: 'PUB' },
  ipg: { bg: '#000000', fg: '#D4AF37', label: 'IPG' },
  interpublic: { bg: '#000000', fg: '#D4AF37', label: 'IPG' },
  'interpublic group': { bg: '#000000', fg: '#D4AF37', label: 'IPG' },
  dentsu: { bg: '#003DA5', fg: '#FFFFFF', label: 'DEN' },
  havas: { bg: '#ED1C24', fg: '#FFFFFF', label: 'HAV' },
  ogilvy: { bg: '#E60012', fg: '#FFFFFF', label: 'OGV' },
  bbdo: { bg: '#000000', fg: '#FFFFFF', label: 'BBDO' },
  tbwa: { bg: '#000000', fg: '#FF7F00', label: 'TBWA' },
  ddb: { bg: '#000000', fg: '#FFFFFF', label: 'DDB' },
  'saatchi & saatchi': { bg: '#000000', fg: '#FFFFFF', label: 'S&S' },
  'leo burnett': { bg: '#000000', fg: '#FFFFFF', label: 'LB' },
  mccann: { bg: '#000000', fg: '#FFCC00', label: 'MC' },
  'mccann erickson': { bg: '#000000', fg: '#FFCC00', label: 'MC' },
};

// ── SVG glyph components ───────────────────────────────────────────────────

function GoldenArches() {
  return (
    <svg viewBox="0 0 24 24" className="h-[60%] w-[60%]">
      <path
        d="M8 3 C6.5 3 5.5 5 5.5 8 L5.5 14 C5.5 16 5 17 4 17 C5.5 17 6.5 15 6.5 12 L6.5 8 C6.5 6 7 5 8 5 Z"
        fill="#FFC72C"
      />
      <path
        d="M16 3 C17.5 3 18.5 5 18.5 8 L18.5 14 C18.5 16 19 17 20 17 C18.5 17 17.5 15 17.5 12 L17.5 8 C17.5 6 17 5 16 5 Z"
        fill="#FFC72C"
      />
    </svg>
  );
}

function PepsiGlobe() {
  return (
    <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]">
      <circle cx="12" cy="12" r="10" fill="#004B93" />
      <path d="M12 2 A10 10 0 0 1 12 22 L12 12 Z" fill="#FFFFFF" />
      <path d="M12 2 A10 10 0 0 1 22 12 L12 12 Z" fill="#ED1C24" />
      <circle cx="12" cy="12" r="10" fill="none" stroke="#004B93" strokeWidth="2" />
    </svg>
  );
}

function ShellLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]">
      <path
        d="M12 3 L19 7 L17 17 L12 21 L7 17 L5 7 Z"
        fill="#FBCE07"
        stroke="#DD1D21"
        strokeWidth="1.5"
      />
      <path d="M12 3 L12 21 M5 7 L19 7 M7 17 L17 17" stroke="#DD1D21" strokeWidth="1" />
    </svg>
  );
}

function ToyotaRings() {
  return (
    <svg viewBox="0 0 24 24" className="h-[60%] w-[60%]">
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="4" ry="10" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="10" ry="10" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
    </svg>
  );
}

function NikeSwoosh() {
  return (
    <svg viewBox="0 0 24 24" className="h-[50%] w-[60%]">
      <path d="M2 16 C6 14 14 6 22 6 C18 10 10 18 4 19 C6 16 8 14 10 12 Z" fill="#FFFFFF" />
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]">
      <path
        d="M18 14 C18 18 15 20 12 20 C9 20 6 18 6 14 C6 12 7 10 8 9 C9 10 10 11 12 11 C14 11 15 10 16 9 C17 10 18 12 18 14 Z M12 4 C12 6 11 7 9 7 C9 5 10 4 12 4 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function MetaInfinity() {
  return (
    <svg viewBox="0 0 24 24" className="h-[50%] w-[60%]">
      <path
        d="M4 12 C4 8 6 6 8 8 C10 10 10 14 12 16 C14 18 16 18 18 16 C20 14 20 10 18 8 C16 6 14 6 12 8 C10 10 10 14 8 16 C6 18 4 16 4 12 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
      />
    </svg>
  );
}

function AltriaGrid() {
  const colors = ['#E2231A', '#F7A800', '#3DAE2B', '#004B93', '#9E2896', '#6D6E71'];
  return (
    <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]">
      {colors.slice(0, 6).map((c, i) => (
        <rect
          key={i}
          x={2 + (i % 3) * 7}
          y={2 + Math.floor(i / 3) * 7}
          width="6"
          height="6"
          fill={c}
        />
      ))}
    </svg>
  );
}

function MastercardRings() {
  return (
    <svg viewBox="0 0 24 16" className="h-[45%] w-[55%]">
      <circle cx="9" cy="8" r="6" fill="#EB001B" opacity="0.9" />
      <circle cx="15" cy="8" r="6" fill="#F79E1B" opacity="0.9" />
    </svg>
  );
}

// ── Lookup ──────────────────────────────────────────────────────────────────

const normalize = (s) => (s || '').toLowerCase().trim();

export function lookupBrand(name) {
  const key = normalize(name);
  if (!key) return null;
  // exact match
  if (BRAND_LOGOS[key]) return { name, ...BRAND_LOGOS[key] };
  // partial match (brand name contains key or vice versa)
  for (const [brand, info] of Object.entries(BRAND_LOGOS)) {
    if (key.includes(brand) || brand.includes(key)) return { name, ...info };
  }
  return null;
}

// ── Components ──────────────────────────────────────────────────────────────

export function BrandIcon({ name, size = 20, className = '' }) {
  const brand = lookupBrand(name);
  if (!brand) {
    // Fallback — neutral circle with first letter
    const initial = (name || '?').trim().charAt(0).toUpperCase();
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full border border-slate2/50 bg-secondary font-mono text-[9px] font-bold text-darkgray ${className}`}
        style={{ width: size, height: size }}
      >
        {initial}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 ${className}`}
      style={{ width: size, height: size, background: brand.bg, color: brand.fg }}
    >
      {brand.svg || (
        <span className="font-mono text-[8px] font-bold leading-none">
          {brand.label || name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}

export function BrandBadge({ name, className = '' }) {
  if (!name?.trim()) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 border border-slate2/50 bg-card px-2 py-1 ${className}`}
    >
      <BrandIcon name={name} size={16} />
      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-silver">
        {name}
      </span>
    </span>
  );
}

export default BrandBadge;
