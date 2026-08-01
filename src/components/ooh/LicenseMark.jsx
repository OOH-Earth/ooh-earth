// Licence / ethos dispatch mark — the project's structural commitments as a mono
// dispatch line, with the licence pair set in superscript like a rights mark.
// Used in the hero dispatch area (and reusable anywhere a credentials line fits).
export default function LicenseMark({ className = "", prefix = true }) {
  return (
    <span className={`font-mono text-[9px] uppercase leading-none tracking-[0.25em] text-silver/60 ${className}`}>
      {prefix && <span className="text-ozone/70">// </span>}
      Open source · Copyleft · Community-funded · No VC
      <sup className="ml-1 align-super text-[7px] tracking-[0.15em] text-flare/80">AGPL-3.0 · CC BY-SA 4.0</sup>
    </span>
  );
}
