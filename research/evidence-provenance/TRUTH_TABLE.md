# Provenance Recon — Field-Level Truth Table

Status: **RECON, CONFIRMED from code**. Every row below cites the exact
file/line evidence read on `origin/main` at `35b8ba3`. No generalization —
where a field has no registry check, that's stated because a targeted grep
found none, not assumed.

Ingestion paths traced, in full:

- **New `Location` (initial capture):** `FieldReport.jsx` (form) +
  optional `ReportScanner.jsx` (scanAd AI-assist, server-side, authenticated,
  one photo → Claude vision) → `submitCapture()` → `Location.create`-equivalent.
- **New `FieldCheck` (re-observation):** `FieldCheckCamera.jsx`, with its
  **own separate** AI-assist (`aiDetect()`, calls
  `base44.integrations.Core.InvokeLLM` **directly client-side** — not via
  the `scanAd` function, no auth-gated server wrapper, no media-URL
  validation) → `submitFieldCheck()` → `FieldCheck.create`-equivalent.
- **Human correction (post-capture):** `LocationEditPanel.jsx`'s `save()`
  and `quickAction()` → `base44.entities.Location.update(loc.id, payload)`
  — a **direct overwrite**, no prior-value snapshot kept anywhere.

## Per-field truth table

| Field | 1. Original source | 2. AI proposed value | 3. AI confidence | 4. Registry-confirmed value | 5. Human-edited value | 6. Final persisted value | 7. What's lost |
|---|---|---|---|---|---|---|---|
| `brand_name` | scanAd vision **or** FieldCheck `aiDetect` **or** manual typing (`ReportStep2Identify`) | Yes, both AI paths (`det.brand_name` / `suggestion.brand_name`) | **scanAd only** — `det.confidence` (0–1, `scanAd/entry.ts:79`). FieldCheck's `aiDetect` schema has **no confidence property at all** (`FieldCheckCamera.jsx` InvokeLLM `response_json_schema`) | None — no brand-name registry exists (`advertiserRegistry.js` exports only `lookupParentCorpSector`, no brand lookup) | Yes, free text, `LocationEditPanel.jsx:236` | Flat string, `Location.brand_name` / `FieldCheck.brand_name` | Whether AI proposed it at all (`ai_scanned` client flag dropped, `FieldReport.jsx:52` comment: *"never sent to Location.create"*); the confidence value; the pre-edit AI string if later hand-corrected; which of 3 input paths produced it |
| `industry_sector` | scanAd guess **or** registry lookup **or** manual picker | Yes (`det.industry_sector`) | Shares scanAd's single **record-level** confidence — no field-level breakdown exists in the response schema at all | **Yes** — `lookupParentCorpSector(det.parent_corp)`, deterministic (`advertiserRegistry.js:220`). The code even computes `sectorConflict` (AI vs. registry disagreement) at capture time (`ReportScanner.jsx`) | Yes, `LocationEditPanel.jsx` picker | Flat enum string; `industry_sector: det.industry_sector \|\| registrySector \|\| data.industry_sector` — three possible sources collapse into one value with no marker of which won | The AI-vs-registry conflict flag (computed, shown to the operative, **never transmitted**); whether the stored value is a model guess or a registry fact |
| `industry_sector` (display-time-only case) | `AdvertiserInfo.jsx` recomputes `lookupParentCorpSector(loc.parent_corp)` live on every page view when `loc.industry_sector` is empty | n/a | n/a | Yes, same registry, but **never written back** | n/a | **Never persisted** — some Locations show a sector to viewers that literally doesn't exist in the stored record | Server-side queryability: a map filter by sector silently misses these records even though the fact is confidently knowable |
| `parent_corp` | AI or manual | Yes | Same record-level confidence as above (scanAd) / none (FieldCheck) | Implicit only — matching `PARENT_CORP_SECTOR_GROUPS` is itself a registry hit, but whether it matched is not recorded | Yes | Flat string | Whether the string is a verbatim registry match vs. a free-text guess |
| `ad_agency` | AI or manual | Yes (scanAd only; FieldCheck's `aiDetect` doesn't ask for it) | Record-level (scanAd) / none | **None found** — `advertiserRegistry.js` exports no agency-lookup function, `AGENCIES` is a plain `<datalist>` suggestion array only | Yes | Flat string | No deterministic cross-check exists for this field at all — weakest-verified field in the schema |
| `condition` (FieldCheck) | AI (`aiDetect`) or manual dropdown | Yes (`suggestion.condition`) | **None** — no confidence in the schema | Enum-membership check only (`CONDITIONS.some(...)`) — validates it's a legal value, not that it's correct | Yes, same form before submit | Flat enum | The UI already computes `detected: {condition: validCondition}` distinct from the current form value, then **drops it** — the submit payload (`FieldCheckCamera.jsx` `payload`) sends only the final `condition`, never `detected` |
| `adbust_type` (FieldCheck) | Same as `condition` | Yes | None | Enum-membership only | Yes | Flat enum | Same as `condition` |
| `image_url` / photos | Upload (`UploadFile`) | n/a | n/a | n/a | n/a | URL string(s) across 3 separate places (`Location.image_url`, `LocationPhoto.url` gallery, `FieldCheck.image_url` per-check) | Which model/version (if any) analyzed this specific image; no unifying identifier across the 3 photo-storage locations |
| `status` (verification) | Moderator action | n/a | n/a | n/a | `LocationEditPanel.jsx` `quickAction(status)` | `status` + `status_updated_at` | **Who** verified/rejected it (no actor field); **why** (no reason/comment field); whether a field-edit (`save()`) and the status change happened in the same review pass — two separate `Location.update` calls, no link between them |

## The single sharpest finding

`ReportScanner.jsx` already computes, in memory, at capture time, a
genuine three-way distinction — **MODEL OBSERVATION** vs. **REGISTRY
FACT** vs. **operative's own entry** — down to an explicit `sectorConflict`
boolean when the model and the registry disagree. All of that reasoning
already exists in running code. None of it survives the `onChange(...)`
call that merges everything into the flat form state, and none of it
survives `submitCapture(...)`, which only accepts the plain schema fields.
**The provenance signal isn't missing from the system — it's computed and
then thrown away**, twice over (once at merge, once more at every human
edit thereafter).

## Second finding: human correction is indistinguishable from real-world change

`LocationEditPanel.jsx`'s `save()` and a genuine new `FieldCheck` re-check
both ultimately look identical to anything reading `Location`/`FieldCheck`
history: a value changed at some timestamp. There is no way today to tell
"a moderator fixed a typo in `brand_name`" apart from "the advertiser at
this physical location genuinely changed." **This directly undermines
PR #152's `buildTimeline()`**: its `classifyChange()` would currently label
a typo fix as `advertiser_replaced`, identically to a real swap. This
recon mission surfaced a real defect in the previous prototype, not just a
data-quality nice-to-have.
