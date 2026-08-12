// OOH Earth — full wireframe-globe emblem (Y2K / Orbital Perspective).
// Detailed version for hero, share cards, and the brand guide. Theme-aware:
// ozone = hi-vis primary, flare = orange orbit, node = green pop.
export default function OohEmblem({ className = 'h-24 w-24', reticle = true, animate = false }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" aria-hidden="true">
      {reticle && (
        <path
          d="M18 40 L18 18 L40 18 M160 18 L182 18 L182 40 M182 160 L182 182 L160 182 M40 182 L18 182 L18 160"
          className="stroke-ozone"
          strokeWidth="5"
          strokeLinecap="square"
          opacity="0.9"
        />
      )}

      {/* faint back-orbit */}
      <g transform="rotate(-24 100 100)" opacity="0.45">
        <ellipse cx="100" cy="100" rx="82" ry="30" className="stroke-flare" strokeWidth="2.8" />
      </g>

      {/* globe */}
      <g className="stroke-ozone" strokeLinecap="round">
        <circle cx="100" cy="100" r="58" strokeWidth="3.2" />
        <ellipse cx="100" cy="100" rx="19.7" ry="58" strokeWidth="2.6" />
        <ellipse cx="100" cy="100" rx="39.4" ry="58" strokeWidth="2.6" />
        <line x1="100" y1="42" x2="100" y2="158" strokeWidth="2.6" />
        <line x1="42" y1="100" x2="158" y2="100" strokeWidth="2.6" />
        <line x1="60.6" y1="75.6" x2="139.4" y2="75.6" strokeWidth="2.4" />
        <line x1="60.6" y1="124.4" x2="139.4" y2="124.4" strokeWidth="2.4" />
      </g>

      {/* front orbit + satellite */}
      <g>
        <g transform="rotate(-24 100 100)">
          <path
            d="M 18 100 A 82 30 0 0 0 182 100"
            className="stroke-flare"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <circle
          cx="30.9"
          cy="132.6"
          r="6.4"
          fill="#39FF14"
          style={{ filter: 'drop-shadow(0 0 4px rgba(57,255,20,0.85))' }}
        />
        <circle cx="30.9" cy="132.6" r="2.8" fill="#fff" />
        {animate && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 100 100"
            to="360 100 100"
            dur="14s"
            repeatCount="indefinite"
          />
        )}
      </g>
    </svg>
  );
}
