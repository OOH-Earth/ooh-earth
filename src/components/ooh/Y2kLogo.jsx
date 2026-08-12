import React from 'react';

/**
 * Y2K Logo — OOH Earth wordmark in the late-90s/early-2000s cyber-pop style:
 * a bold, forward-leaning primary line with a hard drop shadow, a hollow
 * outlined stencil tagline beneath, and four sparkle starbursts framing the
 * block. Pure SVG so it stays crisp at any size and inherits theme tokens.
 *
 * Props:
 *  className  — controls rendered height (e.g. "h-14")
 *  primary    — top wordmark (default "OOH EARTH")
 *  tagline    — bottom stencil line (default "STREET · MAPS")
 *  accent     — sparkle + tagline tint ("ozone" | "flare" | "silver")
 */
const ACCENT = {
  ozone: 'rgb(var(--c-ozone))',
  flare: 'rgb(var(--c-flare))',
  silver: 'rgb(var(--c-silver))',
};

const Sparkle = ({ x, y, s, fill }) => (
  <path
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M0,-11 C0,-4 4,0 11,0 C4,0 0,4 0,11 C0,4 -4,0 -11,0 C-4,0 0,-4 0,-11 Z"
    fill={fill}
  />
);

export default function Y2kLogo({
  className = 'h-14',
  primary = 'OOH EARTH',
  tagline = 'STREET · MAPS',
  accent = 'ozone',
}) {
  const ac = ACCENT[accent] || ACCENT.ozone;
  return (
    <span className={`inline-block leading-none ${className}`} role="img" aria-label="OOH Earth">
      <svg
        viewBox="0 0 360 168"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="y2k-shadow" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="1.4"
              floodColor="#000000"
              floodOpacity="0.85"
            />
          </filter>
        </defs>

        {/* sparkle starbursts — framing the block */}
        <Sparkle x={34} y={30} s={1.05} fill={ac} />
        <Sparkle x={326} y={28} s={0.9} fill={ac} />
        <Sparkle x={46} y={146} s={0.62} fill={ac} />
        <Sparkle x={312} y={150} s={0.78} fill={ac} />

        {/* primary wordmark — bold, oblique, drop-shadowed */}
        <g filter="url(#y2k-shadow)" transform="skewX(-10) translate(18 0)">
          <text
            x={162}
            y={84}
            textAnchor="middle"
            fontFamily="'Inter Tight', sans-serif"
            fontWeight={900}
            fontStyle="italic"
            fontSize={58}
            letterSpacing="-1"
            fill="rgb(var(--c-silver))"
          >
            {primary}
          </text>
        </g>

        {/* secondary stencil — hollow outlined, lighter */}
        <g transform="skewX(-10) translate(18 0)">
          <text
            x={162}
            y={134}
            textAnchor="middle"
            fontFamily="'Inter Tight', sans-serif"
            fontWeight={700}
            fontStyle="italic"
            fontSize={23}
            letterSpacing={6}
            fill="none"
            stroke={ac}
            strokeWidth={1.1}
          >
            {tagline}
          </text>
        </g>
      </svg>
    </span>
  );
}
