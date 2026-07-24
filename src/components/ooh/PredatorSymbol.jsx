export default function PredatorSymbol({ className = "" }) {
  return (
    <svg
      viewBox="0 0 36 36"
      className={className}
      fill="none"
      aria-hidden
      style={{ filter: "drop-shadow(0 0 4px rgba(237,255,0,0.55))" }}
    >
      <g className="animate-flicker" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M18 3 L22.5 10 L18 17 L13.5 10 Z" />
        <path d="M18 17 L18 33" />
        <path d="M11 22 L18 26.5 L25 22" />
        <path d="M13 28.5 L18 32 L23 28.5" />
        <path d="M8 11 L13 15.5 M8 18 L13 20.5 M28 11 L23 15.5 M28 18 L23 20.5" />
      </g>
      <path className="animate-flicker" d="M18 9 L20.5 11 L18 13 L15.5 11 Z" fill="currentColor" />
    </svg>
  );
}