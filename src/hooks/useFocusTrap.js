import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * WAI-ARIA dialog focus management for hand-rolled overlays (no radix-ui
 * Dialog underneath). Callers keep their own open/close state and Escape
 * handling -- this only owns what happens to focus while open:
 *
 *  - moves focus into the container when it opens
 *  - traps Tab/Shift+Tab within the container's focusable elements
 *  - restores focus to whatever was focused before it opened, on close
 *  - sets role="dialog" / aria-modal="true" (+ optional aria-label) on the
 *    container so screen readers announce it correctly
 *
 * Works with either mount pattern already in use across the app: containers
 * that conditionally render ({open && <div>...</div>}) and containers that
 * stay mounted and toggle visibility via aria-hidden + CSS transition
 * (e.g. CommandCenter) -- the effect only does anything while `open` is
 * true, either way.
 *
 * @param {import('react').RefObject<HTMLElement>} containerRef
 * @param {boolean} open
 * @param {{label?: string}} [options]
 */
export function useFocusTrap(containerRef, open, { label } = {}) {
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    previouslyFocused.current = document.activeElement;
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-modal', 'true');
    if (label) container.setAttribute('aria-label', label);

    // Not el.offsetParent !== null -- offsetParent is always null for
    // position:fixed elements regardless of visibility, and every overlay
    // in this app is position:fixed. A non-zero layout box is the check
    // that actually works across positioning schemes.
    const isVisible = (/** @type {HTMLElement} */ el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const getFocusable = () =>
      /** @type {HTMLElement[]} */ (Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))).filter(
        isVisible,
      );

    const focusFirst = () => {
      const focusables = getFocusable();
      if (focusables.length) {
        focusables[0].focus();
      } else {
        if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
        container.focus();
      }
    };
    // Deferred one frame -- transition-based overlays (CommandCenter) are
    // already mounted when `open` flips true, so the frame lets any
    // display/visibility change from the transition settle first.
    const raf = requestAnimationFrame(focusFirst);

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const focusables = getFocusable();
      if (!focusables.length) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    container.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener('keydown', onKeyDown);
      const toRestore = previouslyFocused.current;
      if (toRestore && typeof toRestore.focus === 'function') toRestore.focus();
    };
  }, [open, containerRef, label]);
}
