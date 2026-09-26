# DAVE — current actionable feedback only

Historical feedback and its resolutions live in `docs/ops/ooh-earth/`. This
file holds only what's still open.

1. **Globe issue** — fixed, automated-mobile-verified (PR #274, closed
   2026-09-25). His own physical-device retest would be good confirmation
   but is not required to resume other engineering. → tracked, no open task.

2. **Results-row hover/active highlight** — the desktop results column
   previously showed a strong fluorescent-red/pink highlight around the
   hovered/active location; a comparable treatment exists in another map
   mode. He wants that clarity back: an obvious result-row ↔ map-marker
   correspondence. → **UX-001**.

3. **Marker/icon quality** — "The icons are also too micro right now... get
   those up to better spec." Wants better legibility/quality/consistency,
   not a full map redesign, and not markers so large they obscure dense
   views. → **UX-002**.

4. **Carto/API-key sighting** — saw an "API KEY REQUIRED" tiled watermark
   state once, outside Chrome. His own words: "Not actually happening on
   chrome so, ignore probably just random." **UPDATE 2026-09-25: this DOES
   reproduce on Chrome, deterministically** — his own assumption was wrong,
   this is a real bug, not random. Root cause: 4 of 5 map styles use an
   unauthenticated Carto tile endpoint that watermarks tiles instead of
   erroring. → **UX-004**, root-caused, two fix options prepared, needs
   Dave to pick a direction (see `QUEUE.md`).

5. **Results list disappearance** — observed the list possibly disappearing
   in some map state; explicitly flagged it himself as possibly random/
   unconfirmed. **UPDATE 2026-09-25: reproduced and confirmed NOT a bug** —
   it's the app's own correct "you've panned to an area with no data"
   state, which already shows a "Follow Map" button to recover. Found one
   small, separate cosmetic issue in the same state (stale list content) —
   low priority. → **UX-003, CLOSED.**

6. **General toggle sweep** — cycled through the map's toggles and views and
   said overall: "Good shape really." Not a request for a redesign.

7. **Future direction** — sees room for broader modernization aligned with
   current web trends, but this is explicitly **not authorization** for a
   wholesale redesign — treat as a future conversation, not a current task.

## Screenshots on file (2026-09-25 batch, 4 images)
1. Split view (list + satellite map) — real listings, real markers, working
   normally. No issue visible.
2. Globe view zoomed to a city block — real markers/clusters rendering
   correctly. No issue visible.
3. Dark "Flat" view with "API KEY REQUIRED" tiled watermark text repeated
   across the entire basemap, markers still rendering on top. This is the
   UX-004 sighting — reproduce against this exact toggle combination first.
5. "List" view showing "0 IN VIEW · 0 TOTAL" / "NO SPOTS IN THIS VIEW" — could
   be a legitimate zero-result state after panning/filtering, or could be the
   UX-003 disappearance. Don't assume either way — reproduce the exact
   sequence that produced it before classifying.
