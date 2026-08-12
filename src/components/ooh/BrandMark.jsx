// OOH Earth brandmark — Y2K wireframe globe on an orbital ring (Orbital Perspective).
// Theme-aware via tokens (ozone = hi-vis primary, flare = orange). Same 0..32 viewBox
// and { className } API as before, so every consumer (nav, field-ID cards, UI kit) is unchanged.
export default function BrandMark({ className = 'h-6 w-6', animate = true }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      {/* faint back-orbit for depth */}
      <g transform="rotate(-24 16 16)" opacity="0.4">
        <ellipse cx="16" cy="16" rx="13.6" ry="5" className="stroke-flare" strokeWidth="1" />
      </g>

      {/* wireframe globe */}
      <g className="stroke-ozone" strokeLinecap="round">
        <circle cx="16" cy="16" r="11.5" strokeWidth="1.5" />
        <ellipse cx="16" cy="16" rx="4.8" ry="11.5" strokeWidth="1.1" />
        <line x1="16" y1="4.5" x2="16" y2="27.5" strokeWidth="1.1" />
        <line x1="4.5" y1="16" x2="27.5" y2="16" strokeWidth="1.1" />
        <line x1="5.96" y1="10.4" x2="26.04" y2="10.4" strokeWidth="1" />
        <line x1="5.96" y1="21.6" x2="26.04" y2="21.6" strokeWidth="1" />
      </g>

      {/* front orbit ring + satellite — rotates */}
      <g>
        <g transform="rotate(-24 16 16)">
          <path
            d="M 2.4 16 A 13.6 5 0 0 0 29.6 16"
            className="stroke-flare"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <circle
          cx="29.6"
          cy="16"
          r="1.7"
          className="fill-flare"
          style={{ filter: 'drop-shadow(0 0 3px rgba(255,92,0,0.9))' }}
        />
        {animate && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 16 16"
            to="360 16 16"
            dur="10s"
            repeatCount="indefinite"
          />
        )}
      </g>
    </svg>
  );
}
