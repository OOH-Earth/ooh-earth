// Ad Free Streets — circular seal (Y2K). Struck-billboard mark + curved lockup.
// Uses Orbitron (loaded in index.html) for the curved text. Theme-aware.
export default function AdFreeStreetsBadge({ className = "h-40 w-40" }) {
  const id = "afs";
  return (
    <svg viewBox="0 0 300 300" className={className} fill="none" aria-hidden="true">
      <defs>
        <path id={`${id}-top`} d="M 22 150 A 128 128 0 0 1 278 150" />
        <path id={`${id}-bot`} d="M 22 150 A 128 128 0 0 0 278 150" />
      </defs>

      <circle cx="150" cy="150" r="142" className="fill-void stroke-ozone" strokeWidth="4" />
      <circle cx="150" cy="150" r="118" className="stroke-flare" strokeWidth="2" opacity="0.7" />

      <text className="fill-ozone" style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 900, fontSize: 26, letterSpacing: "8px" }}>
        <textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">AD FREE STREETS</textPath>
      </text>
      <text className="fill-foreground/90" style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 500, fontSize: 17, letterSpacing: "6px" }}>
        <textPath href={`#${id}-bot`} startOffset="50%" textAnchor="middle">RECLAIM PUBLIC SPACE</textPath>
      </text>

      {/* struck billboard */}
      <g className="stroke-flare" strokeLinecap="round" strokeWidth="2.6" fill="none">
        <rect x="130" y="128" width="40" height="22" rx="2" />
        <line x1="135" y1="135" x2="160" y2="135" strokeWidth="1.6" opacity="0.6" />
        <line x1="135" y1="141" x2="165" y2="141" strokeWidth="1.6" opacity="0.6" />
        <line x1="142" y1="150" x2="142" y2="168" />
        <line x1="158" y1="150" x2="158" y2="168" />
        <path d="M142 168 L158 174 M158 168 L142 174" strokeWidth="1.8" />
      </g>
      <g className="stroke-ozone" strokeLinecap="round" strokeWidth="3" fill="none">
        <circle cx="150" cy="150" r="34" />
        <line x1="126" y1="126" x2="174" y2="174" />
      </g>
    </svg>
  );
}
