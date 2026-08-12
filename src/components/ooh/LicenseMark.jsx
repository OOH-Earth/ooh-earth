// Licence / ethos mark — the project's structural commitments as a tidy mono block,
// with the licence pair on its own micro line (no overlap). Used in the hero dispatch
// panel and the footer. `prefix` shows the "//" dispatch slash.
export default function LicenseMark({ className = '', prefix = true }) {
  return (
    <div className={`font-mono uppercase ${className}`}>
      <div className="text-[9px] leading-[1.5] tracking-[0.22em] text-silver/60">
        {prefix && <span className="text-ozone/70">// </span>}
        Open source · Copyleft · Community-funded
      </div>
      <div className="mt-1 text-[8px] leading-none tracking-[0.2em] text-flare/75">
        AGPL-3.0 · CC BY-SA 4.0
      </div>
    </div>
  );
}
