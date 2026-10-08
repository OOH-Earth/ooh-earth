# Main Map LLM layers: trust and cost audit (2026-10-07)

Scope: the Main Map's mushroom, flora and conflict-zone layers. Read-only audit of `origin/main`.
The Ecology page previously used the same pattern and was replaced in #338.

## What exists
| Layer | Hook | Prompt (summary) | Fields trusted from the model |
|---|---|---|---|
| Mushrooms | `useMushroomData` | "12 well-known mushroom foraging hotspots ... Thailand, UK, Pacific Northwest, Japan, Eastern Europe, Scandinavia" with `add_context_from_internet` | species, habitat, note, **lat, lng**, region |
| Flora | `useFloraData` | "12 notable plant biodiversity hotspots ... Thailand, UK, Amazon basin ..." with `add_context_from_internet` | species, ecosystem, note, **lat, lng**, region |
| Conflict zones | `useWarZoneData` | "8 current active conflict zones and humanitarian emergencies ... real verifiable events from the last 30 days", with severity and "the source name" | title, advisory, severity (critical/warning), **lat, lng**, **source** |

All three call `base44.integrations.Core.InvokeLLM` with web context.

## Findings
- **Coordinates are model output.** Nothing validates, geocodes or checks them. They are drawn as map pins with a species, a note and (for conflict zones) a "Src:" line naming a source the model chose. A model can invent or mislocate an entry and the UI presents it like data.
- **Nothing tells the user it is generated.** Layers are named "Mushroom Index", "Flora Index", "Conflict Zone". Popups show species, note and region; no provenance, no date, no "AI-generated" or "unverified" label.
- **Trigger frequency is unconditional, not on demand.**
  - `src/pages/Map.jsx` calls all three hooks at page level, so every `/map` visit fires them whether or not any of those layers is active.
  - `DynamicFilterBar` calls all three again.
  - `GlobeLayerManager` calls all three and is mounted inside every `Globe3D`, including the Home page globe (`GlobeSection`).
  - Local traces showed four `InvokeLLM` POSTs per Home/Map page load.
- **Cache is per tab and in memory only** (`layerDataCache.js`: module-level object plus in-flight de-duplication). No TTL, no persistence, not shared across users or reloads. So cost scales with tab sessions, not with data change.
- **Not persisted.** No entity writes; results vanish on reload. (Good for data hygiene; bad for cost.)
- **Errors are silent.** `.catch` sets an empty list, so a failed call looks like "no hotspots", not a failure.
- **Cost per invocation: UNKNOWN.** The repo does not record Base44 integration-credit pricing. Web-context LLM calls are among the most expensive integration calls, so treat each as a real cost. Order of magnitude: (Home + Map page loads) x 3 calls per tab session.
- **Authority risk is highest for conflict zones.** An LLM-generated "critical" conflict pin with a made-up-looking source line can be read as an authoritative claim about real places and people.

## Decision made in this audit
- **Mushrooms and flora:** the Main Map observation replacement is still pending, not implemented. Reuse the proven Ecology architecture (iNaturalist recent observations, provenance, freshness and coverage semantics) in a separate bounded slice. Until then these Main Map controls are disabled, the legacy hooks return no coordinates without calling the model, and the UI links to `/ecology`.
- **Conflict zones:** do not ship model-generated conflict claims as map data, even with an opt-in and warning. The control is disabled and its hook returns no coordinates without making a model call. A replacement needs a licensed, sourced dataset and sensitivity review; no vendor choice is made here.

## 2026-10-07 invariant correction
The initial #343 patch removed model calls on page load but still requested and plotted generated coordinates after a layer activation. That did not satisfy `brain/INVARIANTS.md` (LLM output is never map data). The correction removes these three request paths and disables their controls while preserving the consumer contracts for Leaflet, globe and filter components. A revised browser regression asserts all three controls are disabled and make no generated-layer calls. The separate news-summary ticker remains explicit opt-in, labelled unverified/not an official warning, with safe link protocols; it does not supply map coordinates. Three unrelated Home model calls remain a separate finding.

This source correction invalidates prior exact-head qualification. New CI/CodeQL and BACKUP rendered qualification are required; it is not deployed by this document.

## Not changed
No backend, schema or permission change. Existing entities untouched.
