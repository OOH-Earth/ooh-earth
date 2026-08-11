import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyField({ label, value, note = "", swatch = "" }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button
      onClick={copy}
      className="group flex w-full items-center gap-3 border border-slate2/50 bg-card px-3 py-2.5 text-left transition-colors hover:border-ozone/60"
    >
      {swatch && (
        <span
          className="h-4 w-4 shrink-0 border border-white/10"
          style={{ backgroundColor: swatch }}
        />
      )}
      <span className="flex-1 overflow-hidden">
        {label && (
          <span className="block font-mono text-[9px] uppercase tracking-[0.25em] text-dim">{label}</span>
        )}
        <span className="block truncate font-mono text-[11px] text-silver">{value}</span>
        {note && <span className="block font-mono text-[9px] text-dim/60">{note}</span>}
      </span>
      {copied ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-ozone" />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0 text-dim transition-colors group-hover:text-ozone" />
      )}
    </button>
  );
}