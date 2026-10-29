import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { Maximize2, Minimize2, X, ChevronUp, ChevronDown } from 'lucide-react';

const SNAP_STATES = ['peek', 'half', 'full'];
const TAP_SLOP = 6; // px of travel before a press on the handle counts as a drag, not a tap

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
  countScope,
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
  const drag = useRef(null); // { id, startY, startH, moved } while a handle drag is in progress
  const liveHRef = useRef(null);
  const stopDragRef = useRef(null);
  const [liveH, setLiveH] = useState(null);
  const [reduceMotion, setReduceMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    const on = () => setReduceMotion(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);

  // ContextualNudge (fixed, bottom-centre, shared) publishes its height as --ooh-nudge-clearance
  // while it is visible. Stack the sheet above it instead of under it, so the header controls stay
  // reachable; the sheet drops back when the nudge goes away.
  const rootRef = useRef(null);
  const headerRef = useRef(null);
  const handleRef = useRef(null);
  const contentRef = useRef(null);
  const [headerH, setHeaderH] = useState(0);
  const pendingFocus = useRef(null);
  // Expand/Collapse swap which button is rendered, so the focused one unmounts. Hand focus to its
  // counterpart so keyboard and screen-reader users are not dropped on <body>.
  useEffect(() => {
    const label = pendingFocus.current;
    if (!label) return;
    pendingFocus.current = null;
    rootRef.current?.querySelector(`[aria-label="${label}"]`)?.focus();
  }, [snap]);
  const [lift, setLift] = useState(0);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      const v = parseFloat(root.style.getPropertyValue('--ooh-nudge-clearance'));
      setLift(Number.isFinite(v) && v > 0 ? Math.ceil(v) + 6 : 0);
    };
    read();
    if (typeof MutationObserver === 'undefined') return undefined;
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ['style'] });
    return () => mo.disconnect();
  }, []);

  // The collapsed height follows the header's natural height (long or localized labels, large counts,
  // text spacing or zoom can wrap it) instead of clipping at a fixed number.
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => setHeaderH(Math.ceil(el.getBoundingClientRect().height)));
    ro.observe(el);
    setHeaderH(Math.ceil(el.getBoundingClientRect().height));
    return () => ro.disconnect();
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
  // Map-first: the collapsed sheet is a header-only results handle (grab bar + count + actions);
  // the list itself opens with the summary button, Expand, or a drag/tap on the handle.
  const halfH = Math.round(vh * 0.42);
  // Never taller than the space between the nav (or the screen bottom in fullscreen) and an 8px
  // top margin: at 390px tall, 88% of the screen plus the 76px nav offset put the header, and
  // with it the Collapse button, above the viewport.
  const fullH = Math.min(Math.round(vh * 0.88), vh - (fullscreen ? 0 : 76 + lift) - 8);
  // 72px (60px short landscape) is the tested floor; it grows when the header needs more room
  // (long or localized label, large count, text spacing, zoom), never beyond the full snap.
  const peekFloor = short ? 60 : 72;
  const peekH = Math.min(Math.max(peekFloor, headerH) + statusH, fullH);
  const stateH = { peek: peekH, half: halfH, full: fullH };
  const currentH = liveH !== null ? liveH : stateH[effSnap] || peekH;
  const clampH = (h) => Math.max(peekH, Math.min(h, fullH));

  // A button's snap change must always win over a drag in flight: drop any stale live height
  // whenever the committed snap changes, so a lost pointer-up can never leave the sheet stuck.
  useEffect(() => {
    liveHRef.current = null;
    setLiveH(null);
  }, [snap, toolsMode]);
  useEffect(() => () => stopDragRef.current?.(false), []);

  // Collapsed: the list is clipped, so it must not stay focusable. If focus was inside it, bring
  // it to the handle (the content region itself is made inert below).
  useLayoutEffect(() => {
    if (effSnap !== 'peek') return;
    const content = contentRef.current;
    if (content && content.contains(document.activeElement)) handleRef.current?.focus();
  }, [effSnap]);

  const nearestSnap = (h) => {
    let nearest = 'peek';
    let bestDist = Infinity;
    for (const s of SNAP_STATES) {
      const d = Math.abs(h - stateH[s]);
      if (d < bestDist) {
        bestDist = d;
        nearest = s;
      }
    }
    return nearest;
  };
  // Tap/Enter on the handle toggles: collapsed -> half (browse, map still visible), otherwise collapse.
  const toggleSnap = () => {
    const next = snap === 'peek' ? 'half' : 'peek';
    pendingFocus.current = null;
    onSnapChange?.(next);
  };

  // The drag lives on the explicit handle only. Move/up/cancel are also listened for on the window
  // while a drag is active, so the gesture ends even if the pointer leaves the handle or capture
  // is refused (some mobile browsers), instead of leaving the sheet at an arbitrary height.
  const onHandlePointerDown = (e) => {
    if (toolsMode || drag.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const start = { id: e.pointerId, startY: e.clientY, startH: stateH[snap] || peekH, moved: 0 };
    drag.current = start;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* the window listeners below still end the drag */
    }
    const move = (ev) => {
      if (ev.pointerId !== start.id) return;
      const dy = start.startY - ev.clientY; // dragging up = positive
      start.moved = Math.max(start.moved, Math.abs(dy));
      if (start.moved < TAP_SLOP) return;
      const h = clampH(start.startH + dy);
      liveHRef.current = h;
      setLiveH(h);
    };
    const up = (ev) => {
      if (ev.pointerId !== start.id) return;
      stop(ev.type !== 'pointercancel');
    };
    const stop = (commit) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('blur', cancel);
      stopDragRef.current = null;
      drag.current = null;
      const h = liveHRef.current;
      liveHRef.current = null;
      setLiveH(null);
      if (!commit) return;
      if (h === null) toggleSnap();
      else onSnapChange?.(nearestSnap(h));
    };
    const cancel = () => stop(false);
    stopDragRef.current = stop;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('blur', cancel);
  };
  const onHandleKeyDown = (e) => {
    const i = SNAP_STATES.indexOf(snap);
    let next = null;
    if (e.key === 'ArrowUp') next = SNAP_STATES[Math.min(i + 1, 2)];
    else if (e.key === 'ArrowDown') next = SNAP_STATES[Math.max(i - 1, 0)];
    else if (e.key === 'Home') next = 'peek';
    else if (e.key === 'End') next = 'full';
    else return;
    e.preventDefault();
    if (next !== snap) onSnapChange?.(next);
  };

  // The count's scope is stated by the caller (e.g. 'in view'), never implied here.
  const countText = `${Number(count).toLocaleString()} ${layerLabel || 'results'}${countScope ? ` ${countScope}` : ''}`;

  return (
    <div
      ref={rootRef}
      className={`ooh-bottom-sheet lg:hidden fixed inset-x-0 z-[1100] flex flex-col border-t border-ozone/30 bg-void/95 backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.6)] ${fullscreen ? 'bottom-0' : 'bottom-[calc(76px+env(safe-area-inset-bottom))]'}`}
      style={{
        height: currentH,
        ...(fullscreen || !lift
          ? null
          : { bottom: `calc(${76 + lift}px + env(safe-area-inset-bottom))` }),
        transition:
          liveH !== null || reduceMotion ? 'none' : 'height 0.32s cubic-bezier(0.32,0.72,0,1)',
      }}
    >
      {/* Explicit drag handle (also tap / Arrow keys), then the header row. Only the handle is a drag
          surface, so the header buttons never share a pointer target with the gesture. */}
      <div ref={headerRef} className="relative flex flex-col">
        <button
          ref={handleRef}
          type="button"
          onPointerDown={onHandlePointerDown}
          onKeyDown={onHandleKeyDown}
          onClick={(e) => {
            if (e.detail === 0) toggleSnap(); // keyboard Enter/Space; pointer taps handled on pointer-up
          }}
          aria-label="Open or close the list (drag, or use arrow keys)"
          aria-keyshortcuts="ArrowUp ArrowDown"
          disabled={toolsMode}
          className="absolute inset-x-0 top-0 z-0 flex h-6 cursor-grab touch-none items-start justify-center pt-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ozone active:cursor-grabbing disabled:cursor-default"
          style={{ touchAction: 'none' }}
        >
          <span className="h-1 w-10 rounded-full bg-slate2" />
        </button>
        {/* The handle is a 24px strip inside the sheet; the row paints over it, so buttons always win. */}
        <div className="pointer-events-none relative z-10 mt-3 flex w-full items-center justify-between px-3 py-0.5 [&>*]:pointer-events-auto [&_button]:pointer-events-auto">
          {statusInline && !detailMode ? (
            <span
              role="alert"
              className="min-w-0 truncate font-mono text-ooh-caption font-bold uppercase tracking-[0.1em] text-flare"
            >
              // {status.text}
            </span>
          ) : !toolsMode && !detailMode && snap === 'peek' ? (
            <button
              type="button"
              onClick={() => {
                pendingFocus.current = 'Collapse list';
                onSnapChange('half');
              }}
              className="flex min-h-ooh-target min-w-0 flex-1 items-center gap-2 text-left font-mono text-ooh-caption uppercase leading-snug tracking-[0.12em] text-ozone"
            >
              <span className="min-w-0 break-words">{`// ${countText}`}</span>
              <span className="shrink-0 border border-ozone/60 px-1.5 py-0.5 tracking-[0.1em]">
                Open list
              </span>
            </button>
          ) : (
            <span className="min-w-0 break-words font-mono text-ooh-caption uppercase tracking-[0.12em] text-ozone">
              {toolsMode ? '// map tools' : detailMode ? '// pin detail' : `// ${countText}`}
            </span>
          )}
          <div className="flex items-center gap-1">
            {statusInline && !detailMode && (
              <button
                type="button"
                onClick={status.onAction}
                className="flex min-h-ooh-target items-center border border-ozone px-3 font-mono text-ooh-caption font-bold uppercase tracking-[0.1em] text-ozone transition-colors hover:bg-ozone hover:text-void"
              >
                {status.actionLabel}
              </button>
            )}
            {!toolsMode && !detailMode && snap !== 'full' && (
              <button
                onClick={() => {
                  pendingFocus.current = 'Collapse list';
                  onSnapChange('full');
                }}
                aria-label="Expand list"
                className="flex min-h-ooh-target min-w-ooh-target items-center justify-center text-quiet transition-colors hover:text-ozone"
              >
                <ChevronUp className="h-5 w-5" />
              </button>
            )}
            {!toolsMode && !detailMode && snap !== 'peek' && (
              <button
                onClick={() => {
                  pendingFocus.current = 'Expand list';
                  onSnapChange('peek');
                }}
                aria-label="Collapse list"
                className="flex min-h-ooh-target min-w-ooh-target items-center justify-center text-quiet transition-colors hover:text-ozone"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            )}
            {toolsMode && (
              <button
                onClick={onCloseTools}
                aria-label="Close map tools"
                className="flex min-h-ooh-target min-w-ooh-target items-center justify-center text-quiet transition-colors hover:text-ozone"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            {!toolsMode && detailMode && (
              <button
                onClick={onCloseDetail}
                aria-label="Close detail"
                className="flex min-h-ooh-target min-w-ooh-target items-center justify-center text-quiet transition-colors hover:text-ozone"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            {!toolsMode && (
              <button
                onClick={onToggleFullscreen}
                aria-label={
                  fullscreen
                    ? 'Exit full-screen map (shows navigation)'
                    : 'Full-screen map (hides navigation)'
                }
                className="flex min-h-ooh-target min-w-ooh-target items-center justify-center text-quiet transition-colors hover:text-ozone"
              >
                {fullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
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
          <span className="font-mono text-ooh-caption font-bold uppercase tracking-[0.1em] text-flare">
            // {status.text}
          </span>
          <button
            type="button"
            onClick={status.onAction}
            className="flex min-h-ooh-target items-center border border-ozone px-3 font-mono text-ooh-caption font-bold uppercase tracking-[0.1em] text-ozone transition-colors hover:bg-ozone hover:text-void"
          >
            {status.actionLabel}
          </button>
        </div>
      )}
      {/* Content */}
      <div
        ref={contentRef}
        inert={effSnap === 'peek' ? true : undefined}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain flex flex-col"
      >
        {children}
      </div>
    </div>
  );
}
