import { useRef, useEffect, useState, useCallback } from "react";

/**
 * DraggableTicker — a horizontally auto-scrolling strip that can be
 * dragged with cursor or touch. Content is duplicated internally for
 * seamless looping. Auto-scroll slows on hover and pauses during drag.
 *
 * Props:
 *  - children: the content for ONE pass (rendered twice internally)
 *  - speed:    px per frame at 60fps (default 0.4 ≈ 24px/s)
 *  - className: extra classes on the overflow container
 */
export default function DraggableTicker({ children, speed = 0.4, className = "" }) {
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const dragRef = useRef({ dragging: false, startX: 0, startOffset: 0 });
  const rafRef = useRef(null);
  const [slow, setSlow] = useState(false);
  const slowRef = useRef(false);

  useEffect(() => { slowRef.current = slow; }, [slow]);

  useEffect(() => {
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;
      const track = trackRef.current;
      if (track && !dragRef.current.dragging) {
        const half = track.scrollWidth / 2;
        if (half > 0) {
          offsetRef.current -= (slowRef.current ? speed * 0.05 : speed) * dt;
          // Seamless wrap into [-half, 0)
          offsetRef.current = offsetRef.current % half;
          if (offsetRef.current > 0) offsetRef.current -= half;
          track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [speed]);

  const onPointerDown = useCallback((e) => {
    dragRef.current = { dragging: true, startX: e.clientX, startOffset: offsetRef.current };
    setSlow(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current.dragging) return;
    const delta = e.clientX - dragRef.current.startX;
    const track = trackRef.current;
    if (track) {
      const half = track.scrollWidth / 2;
      let off = dragRef.current.startOffset + delta;
      if (half > 0) {
        off = off % half;
        if (off > 0) off -= half;
      }
      offsetRef.current = off;
      track.style.transform = `translate3d(${off}px, 0, 0)`;
    }
  }, []);

  const onPointerUp = useCallback((e) => {
    dragRef.current.dragging = false;
    setSlow(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
  }, []);

  return (
    <div
      className={`relative flex flex-1 items-center overflow-hidden cursor-grab active:cursor-grabbing select-none ${className}`}
      style={{ touchAction: "pan-y" }}
      onMouseEnter={() => setSlow(true)}
      onMouseLeave={() => { if (!dragRef.current.dragging) setSlow(false); }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div ref={trackRef} className="flex w-max shrink-0 items-center" style={{ willChange: "transform" }}>
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center">{children}</div>
      </div>
    </div>
  );
}