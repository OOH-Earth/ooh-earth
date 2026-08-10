import { useRef, useState, useEffect } from "react";
import { Maximize2, Minimize2, X, ChevronUp, ChevronDown } from "lucide-react";

const SNAP_STATES = ["peek", "half", "full"];

/**
 * Draggable results bottom sheet for the mobile map — Google/Apple Maps-style
 * with three snap states: peek (~132px header strip), half (~42% viewport),
 * full (~88% viewport). Drag the handle to resize; releases snap to nearest.
 *
 * Terminal-styled: ozone border, mono header, scanline overlay, drag bar.
 * Mobile-only (lg:hidden). Sits above map tiles (z-[950]) but below the
 * floating map controls (z-[1000]) and tooltips (z-[9999]).
 *
 * Controlled snap state — parent can force a state (e.g. "half" when a pin
 * detail is expanded) by setting `snap` + `onSnapChange`.
 */
export default function MapBottomSheet({ children, count, layerLabel, detailMode, onCloseDetail, snap, onSnapChange, fullscreen, onToggleFullscreen }) {
  const [vh, setVh] = useState(() => (typeof window !== "undefined" ? window.innerHeight : 800));
  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);
  const liveHRef = useRef(null);
  const [liveH, setLiveH] = useState(null);

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const peekH = 132;
  const halfH = Math.round(vh * 0.42);
  const fullH = Math.round(vh * 0.88);
  const stateH = { peek: peekH, half: halfH, full: fullH };
  const currentH = liveH !== null ? liveH : stateH[snap] || peekH;
  const clampH = (h) => Math.max(peekH, Math.min(h, fullH));

  const onPointerDown = (e) => {
    dragging.current = true;
    startY.current = e.clientY;
    startH.current = stateH[snap] || peekH;
    liveHRef.current = startH.current;
    setLiveH(startH.current);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const dy = startY.current - e.clientY; // dragging up = positive
    const h = clampH(startH.current + dy);
    liveHRef.current = h;
    setLiveH(h);
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const h = liveHRef.current ?? startH.current;
    liveHRef.current = null;
    setLiveH(null);
    let nearest = "peek";
    let bestDist = Infinity;
    for (const s of SNAP_STATES) {
      const d = Math.abs(h - stateH[s]);
      if (d < bestDist) { bestDist = d; nearest = s; }
    }
    onSnapChange?.(nearest);
  };

  return (
    <div
      className="ooh-bottom-sheet lg:hidden absolute inset-x-0 bottom-0 z-[950] flex flex-col border-t border-ozone/30 bg-void/95 backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.6)]"
      style={{ height: currentH, transition: liveH !== null ? "none" : "height 0.32s cubic-bezier(0.32,0.72,0,1)" }}
    >
      {/* Drag handle + header */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex cursor-grab touch-none flex-col active:cursor-grabbing"
        style={{ touchAction: "none" }}
      >
        <div className="flex justify-center pt-2">
          <div className="h-1 w-10 rounded-full bg-slate2" />
        </div>
        <div className="flex w-full items-center justify-between px-3 py-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-ozone">
            {detailMode ? "// pin detail" : `// ${count} ${layerLabel || "results"}`}
          </span>
          <div className="flex items-center gap-1">
            {!detailMode && snap !== "full" && (
              <button onClick={() => onSnapChange("full")} aria-label="Expand sheet" className="flex h-6 w-6 items-center justify-center text-dim transition-colors hover:text-ozone">
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
            )}
            {!detailMode && snap !== "peek" && (
              <button onClick={() => onSnapChange("peek")} aria-label="Collapse sheet" className="flex h-6 w-6 items-center justify-center text-dim transition-colors hover:text-ozone">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            )}
            {detailMode && (
              <button onClick={onCloseDetail} aria-label="Close detail" className="flex h-6 w-6 items-center justify-center text-dim transition-colors hover:text-ozone">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button onClick={onToggleFullscreen} aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen map"} className="flex h-6 w-6 items-center justify-center text-dim transition-colors hover:text-ozone">
              {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain flex flex-col">
        {children}
      </div>
    </div>
  );
}