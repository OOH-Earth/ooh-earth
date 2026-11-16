# Measurement probes (DevTools MCP `evaluate_script`, or Playwright `page.evaluate`)

Paste as the `function` argument. All are read-only. Replace selectors for the surface under audit.
Always screenshot first; these numbers explain what you saw, they do not replace looking.

## A. Rendered hit area by sampling (catches invisible `::before`/padding extensions)
```js
() => {
  const el = document.querySelector('BUTTON_SELECTOR');           // e.g. the Claim button
  const R = e => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, w: b.width, h: b.height }; };
  const r = R(el), card = el.closest('[role="button"]');
  const owns = (x, y) => { const e = document.elementFromPoint(x, y); return !!e && el.contains(e); };
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (let x = r.l - 40; x <= r.l + r.w + 40; x += 2)
    for (let y = r.t - 30; y <= r.t + r.h + 30; y += 2)
      if (owns(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { visibleBox: [r.w, r.h], tappable: { w: x1 - x0, h: y1 - y0 },       // compare: tappable > visibleBox = invisible extension
           fontSize: getComputedStyle(el).fontSize, color: getComputedStyle(el).color };
}
```
Then count how many sample points over the neighbouring link, the title text rects and the adjacent rows are owned by
the button (`owns(x,y)` over each neighbour's rect). The target is 0 captured. The visible box must not intersect those
rects either.

## B. Clipping and overlap inside a container (short landscape finds these)
```js
() => {
  const box = document.querySelector('CONTAINER_SELECTOR').getBoundingClientRect();
  const hudRoot = document.querySelector('CONTAINER_SELECTOR [class*="z-[900]"]');
  const items = [...hudRoot.querySelectorAll('*')].filter(e => getComputedStyle(e).display !== 'none' &&
      e.getBoundingClientRect().width > 0 && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
  return items.map(e => { const b = e.getBoundingClientRect();
    return { t: e.textContent.trim().slice(0, 24), insideBox: b.left >= box.left - .5 && b.right <= box.right + .5 && b.top >= box.top - .5 && b.bottom <= box.bottom + .5,
             rect: [b.left, b.top, b.width, b.height].map(Math.round) }; });
}
```
Also compare rects pairwise against the zoom/layout controls and any hint text. Check `elementFromPoint` at each
control centre: `topmost` means operable even when something visually overlaps it; report both.

## C. Scroll ownership and final reachable content
```js
async () => {
  const sc = [...document.querySelectorAll('*')].filter(e => /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 2 && e.clientHeight > 60);
  const doc = [document.documentElement.scrollHeight, innerHeight];             // equal = the document itself does not scroll
  const s = sc[0]; if (s) s.scrollTop = 99999; await new Promise(r => setTimeout(r, 250));
  return { doc, scrollers: sc.map(e => ({ ch: e.clientHeight, sh: e.scrollHeight, ob: getComputedStyle(e).overscrollBehaviorY })),
           reachedEnd: s && Math.round(s.scrollTop) === s.scrollHeight - s.clientHeight };
}
```
Then check the last item's rect clears bottom chrome (`nav` top), and that no `scrollWidth - innerWidth > 0`.

## D. Accessible names, labels, errors, focus return
```js
() => { const d = document.querySelector('[role="dialog"]');
  return [...d.querySelectorAll('input,textarea,select')].map(e => ({ id: e.id,
    label: (document.querySelector(`label[for="${e.id}"]`) || {}).textContent, describedby: e.getAttribute('aria-describedby'),
    invalid: e.getAttribute('aria-invalid') })).concat([{ activeInside: d.contains(document.activeElement) }]); }
```
After Escape, wait for the close animation (~500ms) before reading `document.activeElement`: reading immediately
reports the dialog as still open and focus as not returned (a false failure seen in Window I).

## F. Paint check (clickable is not the same as visible)
`elementFromPoint` skips `pointer-events:none` layers, so an overlay can hide a control that still takes clicks.
Force `pointer-events:auto` on every element, then list what `elementsFromPoint` puts **above** the control at its centre
and inset corners. Ignore ancestors and full-viewport decorative layers (this app has CRT scanline/glow overlays above
everything, so "something is above me" alone is a false positive). Count as covering any remaining element with an
(almost) opaque background (alpha >= 0.5) or its own text. Reference implementation:
`e2e/adbusting-short-landscape-hud.spec.ts` (test "AIR is a labelled disclosure ...").
Two attempts that did **not** work and must not be reused: (1) comparing screenshots with the control hidden vs shown
(passed with the control covered); (2) "anything above the control" with forced pointer events (flagged the global
scanline layers, failed on the fixed build).
Found with this: the AIR disclosure button (a child of a `z-900` HUD layer) sat under the shared `z-950` ticker band at
844x390 while every geometric and plain hit-test probe passed; the cause was a stacking context, fixed at the HUD layer.
Always also look at the whole-screen screenshot.

## E. Baseline capture
Open the live production URL in an isolated context at the same viewport/state; run A-C; record the live `git_sha`
and entry file. Differences in listing data (e.g. 790 live results vs 3 on BACKUP) change panel heights: say so before
calling a difference a regression.
