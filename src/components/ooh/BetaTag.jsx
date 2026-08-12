// Small "BETA" status tag — Orbital Perspective. Sits next to the brandmark to signal
// the platform is in public beta / early access. Flare chip with a live blinking dot.
export default function BetaTag({ className = '', label = 'Beta' }) {
  return (
    <span
      className={`inline-flex select-none items-center gap-1 rounded-[2px] border border-flare/50 bg-flare/10 px-1.5 py-[3px] font-mono text-[8.5px] font-bold uppercase leading-none tracking-[0.22em] text-flare ${className}`}
      style={{ boxShadow: '0 0 10px rgba(255,92,0,0.18)' }}
      title="Public beta — early access. New features are still shipping."
    >
      <span className="h-1 w-1 rounded-full bg-flare animate-blink" />
      {label}
    </span>
  );
}
