import { useState, useRef, useId } from "react";
import { HelpCircle } from "lucide-react";

/**
 * Micro terminal tooltip — small bordered hint popover that appears on
 * hover/focus. Matches the Matrix Terminal aesthetic with mono text,
 * ozone border, and a "// hint" prefix.
 */
export default function TerminalTooltip({ label = "hint", text, side = "top", children }) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const pos =
    side === "bottom"
      ? "top-full left-1/2 -translate-x-1/2 mt-2"
      : side === "left"
      ? "right-full top-1/2 -translate-y-1/2 mr-2"
      : side === "right"
      ? "left-full top-1/2 -translate-y-1/2 ml-2"
      : "bottom-full left-1/2 -translate-x-1/2 mb-2";

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children ?? (
        <button
          type="button"
          aria-describedby={tipId}
          className="inline-flex h-3.5 w-3.5 items-center justify-center text-dim transition-colors hover:text-ozone"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      )}
      {open && (
        <span
          id={tipId}
          role="tooltip"
          className={`pointer-events-none absolute z-50 w-56 border border-ozone/50 bg-void p-2.5 shadow-[0_0_0_1px_rgba(237,255,0,0.1),0_4px_20px_rgba(0,0,0,0.8)] ${pos}`}
        >
          <span className="block font-mono text-[7px] uppercase tracking-[0.25em] text-ozone/70">
            // {label}
          </span>
          <span className="mt-1 block font-mono text-[9px] leading-[1.5] text-silver/90">{text}</span>
        </span>
      )}
    </span>
  );
}