// Shared, framework-free logic for the results-row / marker hover-emphasis
// feature (Dave feedback: hover on a result row should light up its marker,
// and vice versa, using the theme's flare accent -- see UX-001). Kept out of
// Globe3D.jsx / LocationMap.jsx / LocationCard.jsx so the state-transition
// rules are unit-testable without a DOM or map instance.

export const HOVER_RING_NONE = '__none__';

// Which id (if any) the marker hover-ring layer/CircleMarker should be drawn
// at. Selected always wins -- a selected marker already has its own
// permanent treatment, so re-drawing the hover ring on top of it would be a
// visual double-up, and a stale hoverId can otherwise persist after a click.
export function resolveHoverRingTarget({ hoverId, selectedId }) {
  if (!hoverId || hoverId === selectedId) return HOVER_RING_NONE;
  return hoverId;
}

// Which visual tier a results-row should render. Selected is a persistent,
// user-committed state and always wins over transient hover/keyboard-focus
// emphasis, matching resolveHoverRingTarget's precedence on the map side.
export function resolveRowEmphasis({ selected, isEmphasized }) {
  if (selected) return 'selected';
  if (isEmphasized) return 'emphasized';
  return 'idle';
}

// Parses a CSS custom property holding space-separated RGB channels
// (Tailwind convention, e.g. "255 0 200") into a `rgb(r,g,b)` CSS color,
// falling back to a fixed default (a "flare" orange) when the property is
// unset -- e.g. in a test environment with no stylesheet loaded.
export function parseChannelColor(rawValue, fallback = '255 92 0') {
  const value = (rawValue || '').trim() || fallback;
  return `rgb(${value.split(/\s+/).join(',')})`;
}
