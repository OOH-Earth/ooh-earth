import { useState, useRef, useId, useEffect } from "react";
import { createPortal } from "react-dom";
import { HelpCircle } from "lucide-react";

/**
 * Micro terminal tooltip — small bordered hint popover that appears on
 * hover/focus. Matches the Matrix Terminal aesthetic with mono text,
 * ozone border, and a "// hint" prefix.
 *
 * Rendered via portal with `position: fixed` so it escapes any ancestor
 * overflow / stacking context (map panes, terminal frames) and always
 * floats above the page. Auto-flips if near viewport edges.
 */
export default function TerminalTooltip({ label = "hint", text, side = "top", children }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, arrowSide: side });
  const triggerRef = useRef(null);
  const tipId = useId();
  const TOOLTIP_W = 224; // w-56 = 14rem = 224px
  const GAP = 8;

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      let top, left, arrowSide = side;

      // Horizontal centering on the trigger
      let cx = r.left + r.width / 2;

      if (side === "top") {
        top = r.top - GAP;
        arrowSide = "top";
      } else if (side === "bottom") {
        top = r.bottom + GAP;
        arrowSide = "bottom";
      } else if (side === "left") {
        top = r.top + r.height / 2;
        left = r.left - GAP;
        arrowSide = "left";
      } else if (side === "right") {
        top = r.top + r.height / 2;
        left = r.right + GAP;
        arrowSide = "right";
      }

      // If top/bottom, compute left from center; flip if not enough room
      if (side === "top" || side === "bottom") {
        // Flip vertically if not enough space
        if (side === "top" && top - 120 < 8) {
          top = r.bottom + GAP;
          arrowSide = "bottom";
        } else if (side === "bottom" && top + 120 > window.innerHeight - 8) {
          top = r.top - GAP;
          arrowSide = "top";
        }
        left = cx - TOOLTIP_W / 2;
        // Clamp horizontally into viewport
        left = Math.max(8, Math.min(left, window.innerWidth - TOOLTIP_W - 8));
      } else {
        // Left/right — flip if not enough horizontal room
        if (side === "left" && r.left - TOOLTIP_W - GAP < 8) {
          left = r.right + GAP;
          arrowSide = "right";
        } else if (side === "right" && r.right + TOOLTIP_W + GAP > window.innerWidth - 8) {
          left = r.left - TOOLTIP_W - GAP;
          arrowSide = "left";
        }
        // Clamp vertically
        top = Math.max(8, Math.min(top, window.innerHeight - 60));
      }

      setCoords({ top, left, arrowSide });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, side]);

  return (
    <span
      ref={triggerRef}
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
      {open &&
        createPortal(
          <span
            id={tipId}
            role="tooltip"
            style={{ position: "fixed", top: `${coords.top}px`, left: `${coords.left}px`, width: `${TOOLTIP_W}px` }}
            className="pointer-events-none z-[9999] border border-ozone/50 bg-void p-2.5 shadow-[0_0_0_1px_rgba(237,255,0,0.1),0_4px_20px_rgba(0,0,0,0.8)]"
          >
            <span className="block font-mono text-[7px] uppercase tracking-[0.25em] text-ozone/70">
              // {label}
            </span>
            <span className="mt-1 block font-mono text-[9px] leading-[1.5] text-silver/90">{text}</span>
          </span>,
          document.body
        )}
    </span>
  );
}