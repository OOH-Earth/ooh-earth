import { useRef, useState, useEffect } from 'react';
import { Maximize2, Minimize2, X, ChevronUp, ChevronDown } from 'lucide-react';

const SNAP_STATES = ['peek', 'half', 'full'];

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
 *
 * `toolsMode`: the sheet is held at full height and shows the map Tools (short landscape, where a
 * floating panel has no room); its header collapses to a single Close action.
 *
 * `status` ({ text, actionLabel, onAction }) puts a recoverable error and its action in the
 * always-visible header, so Retry is reachable at every snap instead of sitting below the peek
 * fold. Map.jsx measures this sheet and publishes --map-sheet-overlap so the other bottom
 * owners (zoom controls, attribution, spec bar) stack above it.
 */
export default function MapBottomSheet({
  children,
  count,
  layerLabel,
  detailMode,
  onCloseDetail,
  snap,
  onSnapChange,
  fullscreen,
  onToggleFullscreen,
  status = null,
  toolsMode = false,
  onCloseTools,
}) {
  const [vh, setVh] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800));
  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);
  const liveHRef = useRef(null);
  const [liveH, setLiveH] = useState(null);

  // ContextualNudge (fixed, bottom-centre, shared) publishes its height as --ooh-nudge-clearance
  // while it is visible. Stack the sheet above it instead of under it, so the header controls stay
  // reachable; the sheet drops back when the nudge goes away.
  const [lift, setLift] = useState(0);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      const v = parseFloat(root.style.getPropertyValue('--ooh-nudge-clearance'));
      setLift(Number.isFinite(v) && v > 0 ? Math.max(0, Math.ceil(v) - 6) : 0);
    };
    read();
    if (typeof MutationObserver === 'undefined') return undefined;
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ['style'] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Peek height defaults to the full ~132px header strip, but on short
  // landscape viewports (e.g. 844x390) that fixed height plus the 76px
  // bottom-nav offset reaches high enough to cover the floating map
  // controls (Capture/Graffiti/Report), which sit at a vh-independent
  // ~210px from the top. Shrinking peek on short viewports keeps an 8px
  // gap below those controls; 132px is unchanged above ~430px tall.
  // Short landscape (< 500px tall): the shared header and bottom nav already take ~190px, so the
  // collapsed sheet is header-only (handle + controls); results open with Expand.
  const short = vh < 500;
  // Tall screens: the recoverable error gets its own 48px row; short landscape has no height to
  // spare, so the same text and Retry action replace the count label in the header row instead.
  const statusRow = !!status && (!short || toolsMode);
  const statusInline = !!status && short && !toolsMode;
  const effSnap = toolsMode ? 'full' : snap;
  const statusH = statusRow ? 48 : 0;
  const peekH = (short ? 60 : Math.min(132, Math.max(64, vh - 294))) + statusH;
  const halfH = Math.round(vh * 0.42);
  // Never taller than the space between the nav (or the screen bottom in fullscreen) and an 8px
  // top margin: at 390px tall, 88% of the screen plus the 76px nav offset put the header, and
  // with it the Collapse button, above the viewport.
  const fullH = Math.min(Math.round(vh * 0.88), vh - (fullscreen ? 0 : 76 + lift) - 8);
  const stateH = { peek: peekH, half: halfH, full: fullH };
  const currentH = liveH !== null ? liveH : stateH[effSnap] || peekH;
  const clampH = (h) => Math.max(peekH, Math.min(h, fullH));

  const onPointerDown = (e) => {
    // The header's own buttons must stay clickable: capturing the pointer on the drag handle
    // retargets the click away from them, which made Expand/Collapse/Close/Retry dead.
    if (toolsMode || e.target.closest('button, a, [role="button"]')) return;
    dragging.current = true;
    startY.current = e.clientY;
    startH.current = stateH[snap] || peekH;
    liveHRef.current = startH.current;
    setLiveH(startH.current);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
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
    let nearest = 'peek';
    let bestDist = Infinity;
    for (const s of SNAP_STATES) {
      const d = Math.abs(h - stateH[s]);
      if (d < bestDist) {
        bestDist = d;
        nearest = s;
      }
    }
    onSnapChange?.(nearest);
  };

  return (
    <div
      className={`ooh-bottom-sheet lg:hidden fixed inset-x-0 z-[1100] flex flex-col border-t border-ozone/30 bg-void/95 backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.6)] ${fullscreen ? 'bottom-0' : 'bottom-[calc(76px+env(safe-area-inset-bottom))]'}`}
      style={{
        height: currentH,
        ...(fullscreen || !lift
          ? null
          : { bottom: `calc(${76 + lift}px + env(safe-area-inset-bottom))` }),
        transition: liveH !== null ? 'none' : 'height 0.32s cubic-bezier(0.32,0.72,0,1)',
      }}
    >
      {/* Drag handle + header */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex cursor-grab touch-none flex-col active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        <div className="flex justify-center pt-2">
          <div className="h-1 w-10 rounded-full bg-slate2" />
        </div>
        <div className="flex w-full items-center justify-between px-3 py-0.5">
          {statusInline && !detailMode ? (
            <span
              role="alert"
              className="min-w-0 truncate font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-flare"
            >
              // {status.text}
            </span>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ozone">
              {toolsMode
                ? '// map tools'
                : detailMode
                  ? '// pin detail'
                  : `// ${count} ${layerLabel || 'results'}`}
            </span>
          )}
          <div className="flex items-center gap-1">
            {statusInline && !detailMode && (
              <button
                type="button"
                onClick={status.onAction}
                className="flex min-h-10 items-center border border-ozone px-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void"
              >
                {status.actionLabel}
              </button>
            )}
            {!toolsMode && !detailMode && snap !== 'full' && (
              <button
                onClick={() => onSnapChange('full')}
                aria-label="Expand sheet"
                className="flex h-10 w-10 items-center justify-center text-dim transition-colors hover:text-ozone"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
            )}
            {!toolsMode && !detailMode && snap !== 'peek' && (
              <button
                onClick={() => onSnapChange('peek')}
                aria-label="Collapse sheet"
                className="flex h-10 w-10 items-center justify-center text-dim transition-colors hover:text-ozone"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            )}
            {toolsMode && (
              <button
                onClick={onCloseTools}
                aria-label="Close map tools"
                className="flex h-10 w-10 items-center justify-center text-dim transition-colors hover:text-ozone"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {!toolsMode && detailMode && (
              <button
                onClick={onCloseDetail}
                aria-label="Close detail"
                className="flex h-10 w-10 items-center justify-center text-dim transition-colors hover:text-ozone"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {!toolsMode && (
              <button
                onClick={onToggleFullscreen}
                aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen map'}
                className="flex h-10 w-10 items-center justify-center text-dim transition-colors hover:text-ozone"
              >
                {fullscreen ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      {statusRow && (
        <div
          role="alert"
          className="flex h-12 shrink-0 items-center justify-between gap-2 border-t border-flare/40 px-3"
        >
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-flare">
            // {status.text}
          </span>
          <button
            type="button"
            onClick={status.onAction}
            className="flex min-h-10 items-center border border-ozone px-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void"
          >
            {status.actionLabel}
          </button>
        </div>
      )}
      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain flex flex-col">
        {children}
      </div>
    </div>
  );
}
