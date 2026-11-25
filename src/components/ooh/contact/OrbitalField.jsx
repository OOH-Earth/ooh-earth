import { useEffect, useRef } from 'react';
import './OrbitalField.css';

// Deterministic star positions (no Math.random → stable renders and tests).
const STARS = Array.from({ length: 36 }, (_, i) => ({
  x: (i * 137.5) % 800,
  y: (i * 71.3 + (i % 5) * 23) % 330,
  r: i % 7 === 0 ? 1.6 : 0.9,
  d: (i % 9) * 0.55,
}));

// Decorative only: aria-hidden, pointer-events none (never blocks the email
// or scroll). Pointer movement nudges parallax layers via CSS variables; it is
// disabled for reduced-motion users and paused offscreen / in hidden tabs.
export default function OrbitalField({ className = '' }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let onscreen = true;
    const sync = () => {
      const paused = !onscreen || document.hidden || !!reduce?.matches;
      root.dataset.paused = String(paused);
    };

    let observer;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(([entry]) => {
        onscreen = entry.isIntersecting;
        sync();
      });
      observer.observe(root);
    }

    let frame = 0;
    const onMove = (event) => {
      if (reduce?.matches || !onscreen || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = root.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        root.style.setProperty('--of-x', Math.max(-1, Math.min(1, x)).toFixed(3));
        root.style.setProperty('--of-y', Math.max(-1, Math.min(1, y)).toFixed(3));
      });
    };

    document.addEventListener('visibilitychange', sync);
    reduce?.addEventListener?.('change', sync);
    window.addEventListener('pointermove', onMove, { passive: true });
    sync();
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', sync);
      reduce?.removeEventListener?.('change', sync);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`orbital-field ${className}`}
      aria-hidden="true"
      data-testid="orbital-field"
    >
      <div className="orbital-field__layer orbital-field__layer--far">
        <svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" focusable="false">
          {STARS.map((s, i) => (
            <circle
              key={i}
              className="orbital-field__star"
              cx={s.x}
              cy={s.y}
              r={s.r}
              style={{ animationDelay: `${s.d}s` }}
            />
          ))}
        </svg>
      </div>
      <div className="orbital-field__layer orbital-field__layer--mid">
        <svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" focusable="false">
          <g className="orbital-field__spin">
            <ellipse className="orbital-field__ring" cx="400" cy="250" rx="300" ry="96" />
            <circle className="orbital-field__orb" cx="700" cy="250" r="7" />
          </g>
          <g className="orbital-field__spin orbital-field__spin--slow">
            <ellipse
              className="orbital-field__ring orbital-field__ring--dash"
              cx="400"
              cy="250"
              rx="210"
              ry="150"
            />
            <circle
              className="orbital-field__orb orbital-field__orb--ember"
              cx="190"
              cy="250"
              r="5"
            />
          </g>
        </svg>
      </div>
      <div className="orbital-field__layer orbital-field__layer--near">
        <svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMax slice" focusable="false">
          <path
            className="orbital-field__terrain"
            d="M0 450 V372 L70 356 L130 366 L205 330 L262 352 L338 318 L410 348 L480 326 L560 354 L640 322 L720 350 L800 334 V450 Z"
          />
          <path
            className="orbital-field__terrain"
            d="M0 450 V404 L90 392 L170 408 L260 388 L360 410 L470 392 L580 410 L690 394 L800 406 V450 Z"
          />
        </svg>
      </div>
    </div>
  );
}
