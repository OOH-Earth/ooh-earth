import { Link } from 'react-router-dom';

export default function MiniGlobe() {
  return (
    <Link
      to="/map"
      aria-label="Open orbital atlas"
      title="Orbital atlas"
      className="group relative flex items-center gap-2 border border-slate2 bg-void/50 py-1 pl-1.5 pr-2.5 transition-colors hover:border-ozone/70 hover:bg-void/80"
    >
      <span className="relative block">
        <span className="absolute inset-0 rounded-full bg-ozone/25 blur-[6px] transition-colors duration-300 group-hover:bg-ozone/45" />
        <svg viewBox="0 0 40 40" className="relative h-8 w-8">
          <circle
            cx="20"
            cy="20"
            r="12.5"
            fill="#080808"
            stroke="rgb(var(--c-ozone))"
            strokeOpacity="0.4"
            strokeWidth="0.8"
          />

          {/* rotating graticule + field dots */}
          <g>
            <ellipse
              cx="20"
              cy="20"
              rx="12.5"
              ry="4.5"
              fill="none"
              stroke="rgb(var(--c-silver))"
              strokeOpacity="0.28"
              strokeWidth="0.5"
            />
            <ellipse
              cx="20"
              cy="20"
              rx="12.5"
              ry="9"
              fill="none"
              stroke="rgb(var(--c-silver))"
              strokeOpacity="0.18"
              strokeWidth="0.4"
            />
            <ellipse
              cx="20"
              cy="20"
              rx="4.5"
              ry="12.5"
              fill="none"
              stroke="rgb(var(--c-silver))"
              strokeOpacity="0.28"
              strokeWidth="0.5"
            />
            <ellipse
              cx="20"
              cy="20"
              rx="9"
              ry="12.5"
              fill="none"
              stroke="rgb(var(--c-silver))"
              strokeOpacity="0.18"
              strokeWidth="0.4"
            />
            <line
              x1="20"
              y1="7.5"
              x2="20"
              y2="32.5"
              stroke="rgb(var(--c-silver))"
              strokeOpacity="0.3"
              strokeWidth="0.4"
            />
            <line
              x1="7.5"
              y1="20"
              x2="32.5"
              y2="20"
              stroke="rgb(var(--c-silver))"
              strokeOpacity="0.3"
              strokeWidth="0.4"
            />
            <circle cx="15" cy="16" r="1.2" fill="rgb(var(--c-ozone))" />
            <circle cx="25" cy="19" r="1" fill="rgb(var(--c-flare))" />
            <circle cx="19" cy="25" r="0.9" fill="#39FF14" />
            <circle cx="26" cy="13" r="0.8" fill="rgb(var(--c-ozone))" />
            <circle cx="13" cy="22" r="0.7" fill="rgb(var(--c-flare))" />
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 20 20"
              to="360 20 20"
              dur="20s"
              repeatCount="indefinite"
            />
          </g>

          <circle cx="20" cy="20" r="12.5" fill="url(#mini-shade)" />
          <defs>
            <radialGradient id="mini-shade" cx="35%" cy="32%" r="78%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.10" />
              <stop offset="55%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
            </radialGradient>
          </defs>

          {/* orbit + satellite */}
          <g>
            <ellipse
              cx="20"
              cy="20"
              rx="17"
              ry="6.5"
              fill="none"
              stroke="rgb(var(--c-ozone))"
              strokeOpacity="0.55"
              strokeWidth="0.7"
            />
            <circle
              cx="37"
              cy="20"
              r="1.4"
              fill="rgb(var(--c-ozone))"
              style={{ filter: 'drop-shadow(0 0 2.5px rgba(237,255,0,0.9))' }}
            />
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 20 20"
              to="360 20 20"
              dur="9s"
              repeatCount="indefinite"
            />
          </g>
        </svg>
      </span>
    </Link>
  );
}
