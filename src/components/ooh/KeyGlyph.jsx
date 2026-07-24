// Inline SVG glyphs for each access-key type — schematic representations
// (hex, circle barrel, square socket, T-handle, pin, lock, etc.).
// Used on bus-stop pages and the key registry so each key is visually identifiable.

const PATHS = {
  "4-way-utility": (
    <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
      <circle cx="12" cy="12" r="2.4" />
    </g>
  ),
  cemusapin: (
    <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
      <path d="M12 3v10" />
      <circle cx="12" cy="16" r="3.2" />
      <path d="M10 19l2 3 2-3" />
    </g>
  ),
  circle: (
    <g stroke="currentColor" strokeWidth="1.6" fill="none">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
    </g>
  ),
  "circle-set": (
    <g stroke="currentColor" strokeWidth="1.6" fill="none">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="9" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </g>
  ),
  "circle-wall": (
    <g stroke="currentColor" strokeWidth="1.6" fill="none">
      <path d="M4 20V8a8 8 0 0116 0v12" />
      <circle cx="12" cy="12" r="3" />
    </g>
  ),
  h60: (
    <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round">
      <path d="M9 3h6l-1 5h-4z" />
      <path d="M11 8v11a1 1 0 001 1 1 1 0 001-1V8" />
      <circle cx="12" cy="13" r="1" fill="currentColor" stroke="none" />
    </g>
  ),
  "jcd-superlock": (
    <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
      <rect x="7" y="11" width="10" height="8" rx="1.5" />
      <path d="M9 11V8a3 3 0 016 0v3" />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" />
    </g>
  ),
  "large-square": (
    <g stroke="currentColor" strokeWidth="1.6" fill="none">
      <rect x="5" y="5" width="14" height="14" rx="1.5" />
      <rect x="9" y="9" width="6" height="6" fill="currentColor" stroke="none" />
    </g>
  ),
  "small-square": (
    <g stroke="currentColor" strokeWidth="1.6" fill="none">
      <rect x="5" y="5" width="14" height="14" rx="1.5" />
      <rect x="10" y="10" width="4" height="4" fill="currentColor" stroke="none" />
    </g>
  ),
  "t-handle": (
    <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
      <path d="M5 7h14" />
      <path d="M12 7v13" />
      <path d="M9 20h6" />
    </g>
  ),
  none: (
    <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
      <circle cx="12" cy="12" r="7" />
      <path d="M8 12h8" />
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