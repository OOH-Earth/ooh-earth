export default function BrandMark({ className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="13" className="stroke-silver/30" strokeWidth="1" />

      {/* Primary orbit ring + satellite — clockwise */}
      <g>
        <g transform="rotate(-25 16 16)">
          <ellipse cx="16" cy="16" rx="15" ry="6" className="stroke-ozone" strokeWidth="1.4" />
        </g>
        <circle cx="31" cy="16" r="1.4" className="fill-ozone" style={{ filter: "drop-shadow(0 0 3px rgba(237,255,0,0.85))" }} />
        <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="9s" repeatCount="indefinite" />
      </g>

      {/* Cross orbit ring — counter-clockwise */}
      <g>
        <g transform="rotate(-25 16 16)">
          <ellipse cx="16" cy="16" rx="6" ry="15" className="stroke-ozone/35" strokeWidth="1" />
        </g>
        <animateTransform attributeName="transform" type="rotate" from="360 16 16" to="0 16 16" dur="13s" repeatCount="indefinite" />
      </g>

      {/* Pulsing core */}
      <circle cx="16" cy="16" r="3.2" className="fill-ozone ooh-core" style={{ filter: "drop-shadow(0 0 5px rgba(237,255,0,0.7))" }} />
    </svg>
  );
}