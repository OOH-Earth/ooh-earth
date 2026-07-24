// Access-key glyphs matched to the oohearth.app/access-keys icon set.
// Each is a schematic SVG so the key type is visually identifiable on
// bus-stop detail pages and the key registry.

const PATHS = {
  "4-way-utility": (
    <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v8M12 14v8M2 12h8M14 12h8" />
      <path d="M10 4l2-2 2 2M10 20l2 2 2-2M4 10l-2 2 2 2M20 10l2 2-2 2" />
    </g>
  ),
  cemusapin: (
    <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
      <path d="M5 4a9 9 0 100 16" />
      <path d="M5 4v16" />
      <circle cx="5" cy="4" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="5" cy="20" r="1.4" fill="currentColor" stroke="none" />
    </g>
  ),
  circle: (
    <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M2 12h4M18 12h4" />
      <path d="M6 10v4M18 10v4" />
    </g>
  ),
  "circle-set": (
    <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="1.5" />
      <circle cx="12" cy="12" r="5" />
      <path d="M7 12h10" />
    </g>
  ),
  "circle-wall": (
    <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
      <path d="M5 12a7 7 0 0114 0" />
      <path d="M5 12a7 7 0 009 6.6" />
    </g>
  ),
  h60: (
    <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round">
      <path d="M9 3h6l3 5-6 10-6-10z" transform="translate(0,0)" />
      <path d="M9 3l3 5 3-5" />
      <circle cx="12" cy="12" r="2.4" />
    </g>
  ),
  "jcd-superlock": (
    <g stroke="currentColor" strokeWidth="1.6" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
    </g>
  ),
  "large-square": (
    <g stroke="currentColor" strokeWidth="1.6" fill="currentColor" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="1.5" />
    </g>
  ),
  "small-square": (
    <g stroke="currentColor" strokeWidth="1.6" fill="currentColor" strokeLinejoin="round">
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <rect x="4" y="4" width="16" height="16" rx="1.5" fill="none" />
    </g>
  ),
  "t-handle": (
    <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="6" r="4" />
      <path d="M12 10v12" />
      <path d="M8 22h8" />
      <path d="M9 6h6" />
    </g>
  ),
  none: (
    <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M6 12h12" />
    </g>
  ),
  unknown: (
    <g stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 9a3 3 0 015.5-1.6A3 3 0 0113 11c-.8.5-1 1-1 1.8v.2" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" stroke="none" />
    </g>
  ),
};

export default function KeyGlyph({ slug, className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      {PATHS[slug] || PATHS.unknown}
    </svg>
  );
}