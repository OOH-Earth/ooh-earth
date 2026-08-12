// OOH Earth horizontal wordmark — Orbitron display type (loaded in index.html).
// Emblem + "OOH.EARTH" lockup. Theme-aware; scales with the `size` prop (px height of emblem).
import OohEmblem from '@/components/ooh/brand/OohEmblem';

export default function OohWordmark({ className = '', size = 40, showEmblem = true }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {showEmblem && (
        <span className="block shrink-0" style={{ height: size, width: size }}>
          <OohEmblem className="h-full w-full" reticle={false} />
        </span>
      )}
      <span className="leading-none" style={{ fontFamily: "'Orbitron','Inter Tight',sans-serif" }}>
        <span
          className="block font-black tracking-tight text-ozone"
          style={{ fontSize: size * 0.9 }}
        >
          OOH<span className="text-flare">.</span>
        </span>
        <span
          className="block font-medium text-foreground/90"
          style={{ fontSize: size * 0.34, letterSpacing: '0.34em' }}
        >
          EARTH
        </span>
      </span>
    </span>
  );
}
