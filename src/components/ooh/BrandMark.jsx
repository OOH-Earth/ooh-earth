export default function BrandMark({ className = "h-6 w-6", spinning = false }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="13" className="stroke-silver/40" strokeWidth="1.5" />
      <g className={spinning ? "origin-center transition-transform duration-700 group-hover:rotate-[35deg]" : ""}>
        <ellipse cx="16" cy="16" rx="15" ry="6" className="stroke-ozone" strokeWidth="1.5" transform="rotate(-25 16 16)" />
        <ellipse cx="16" cy="16" rx="6" ry="15" className="stroke-ozone/50" strokeWidth="1" transform="rotate(-25 16 16)" />
      </g>
      <circle cx="16" cy="16" r="3.2" className="fill-ozone" style={{ filter: "drop-shadow(0 0 4px rgba(237,255,0,0.6))" }} />
    </svg>
  );
}