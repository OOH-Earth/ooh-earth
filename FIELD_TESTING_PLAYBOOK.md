# Field Testing Playbook

How real-world field testing becomes verified engineering work. This is the people-facing companion to
`ENGINEERING-WORKFLOW.md` (which covers Base44 ↔ GitHub) — this doc covers **Dave in the field ↔ engineering**,
a separate loop layered on top of the same GitHub infrastructure.

**Dave** — runs the app in real conditions (camera, GPS, real light, real network), records what happens, files
structured observations.
**Engineering** — reproduces, fixes, tests, ships, and only closes the loop once Dave has verified the fix in the
field again.

Nothing here is a new service, database, or paid tool. Every mechanism below already existed in this repo or is a
free, native GitHub feature.

## The loop

```
FIELD TEST  (Dave runs a real workflow, in real conditions)
     │
     ▼
CAPTURE     (screenshot/video + the field-test record — see §1)
     │
     ▼
STRUCTURE   (filed as a GitHub Issue via the 📋 Field test observation template)
     │
     ▼
TRIAGE      (severity + type applied — see §3)
     │
     ▼
ENGINEER    (reproduce → root cause → smallest safe fix → test → PR — see §4)
     │
     ▼
RELEASE     (merged, part of the next release-please cycle)
     │
     ▼
FIELD RETEST (Dave re-runs the exact same scenario)
     │
     ▼
VERIFIED — only now does the issue close
```

An issue is never closed because code changed. It's closed because the field behaviour was re-checked and matches
expected.

---

## 1. The field-test record

Every observation has the same shape, whether it comes from a quick note or a full recorded session. The
**📋 Field test observation** GitHub issue template (`.github/ISSUE_TEMPLATE/field_test_report.yml`) captures the
fields Dave fills in directly; the rest are added by engineering as the loop progresses — nothing is lost, it's
just filled in by the right person at the right stage.

| Field | Filled in by | Where it lives |
|---|---|---|
| Test ID | — | The GitHub issue number itself |
| Date/time | — | GitHub's own issue-created timestamp |
| Tester | Dave | Template field (defaults to GitHub identity) |
| Device | Dave | Template field |
| Browser/platform | Dave | Template field (combined with Device) |
| Location/context | Dave | Template field |
| Feature/workflow | Dave | Template dropdown |
| Exact action taken | Dave | Template field |
| Expected behaviour | Dave | Template field |
| Actual behaviour | Dave | Template field |
| Severity | Dave (initial) → Engineering (confirms/adjusts) | Template dropdown → issue label |
| Reproducibility | Dave | Template dropdown |
| Screenshot/video evidence | Dave | Dragged directly into the issue body (GitHub's native attachment CDN — free, no separate upload pipeline) |
| UX friction | Dave (optional) | Template field |
| Suggested improvement | Dave (optional) | Template field |
| Engineering diagnosis | Engineering | Issue comment, once reproduced |
| Status | Engineering | Issue label (`needs-repro` → `ready-for-retest` → `verified-fixed`) + issue open/closed state |
| Linked issue/PR | Engineering | GitHub's native "Development" sidebar link / `Closes #N` in the PR |
| Verification result | Dave | Issue comment on retest, before closing |

This is deliberately **GitHub Issues**, not a new entity or spreadsheet: it's free, already has file-attachment
support, already has labels/search/linking, and is already the same system engineering uses for every PR in this
repo.

---

## 2. Test sessions

Ten repeatable sessions, ordered by what Dave can realistically test without needing a live billboard to walk up
to (map/report/detail first) before the ones that need a real out-of-home advert in front of the camera.

Each session ends the same way: if anything doesn't match "expected," file a **📋 Field test observation** before
moving on — don't wait until the end of the day to write it up from memory.

### 2.1 Map
- **Objective:** confirm the live map is the reliable entry point to everything else.
- **Setup:** fresh page load, `/map`, real GPS on.
- **Steps:** load the map → let it center on your real location → filter by type (Billboard/Digital/Painted/…) →
  use **Find** (AI Unit Finder) to search a nearby area → tap a few pins.
- **Expected:** map centers correctly, filters narrow the pin list, Find returns plausible real-world suggestions,
  pins open their location detail.
- **Watch for:** slow/stuck loading on real mobile data, filter counts that don't match what's actually shown,
  Find results that are obviously wrong for the area.
- **Evidence:** one screenshot of the filtered map, one of a Find result.
- **Pass/fail:** fail if the map fails to load pins at all, or Find returns nothing for a real populated area.

### 2.2 Report a sighting (`/report`)
- **Objective:** the first-capture flow — the one every new location starts from.
- **Setup:** find a real out-of-home advert/structure you haven't reported before.
- **Steps:** open `/report` → fill it out for a real structure → attach a real photo taken in the field → submit.
- **Expected:** submission succeeds, confirmation is clear, the new location appears on the map afterward.
- **Watch for:** GPS accuracy in the field (tall buildings, indoors near the location), upload time on real mobile
  data, whether the confirmation makes it obvious what happens next.
- **Evidence:** screenshot of the filled form + the confirmation screen.
- **Pass/fail:** fail if submission silently fails, loses your photo, or the new pin never appears.

### 2.3 FieldCheck / revisit flow
- **Objective:** confirm re-checking an existing location works, including the AI condition scan.
- **Setup:** pick an already-reported location near you.
- **Steps:** open it → start a field check → take a fresh photo → run **AI condition scan** → confirm/adjust the
  suggested condition → submit.
- **Expected:** the scan produces a plausible read on the real condition; submission updates the location's status.
- **Watch for:** the AI scan is a real feature (not a mock) — note honestly if its read looks wrong, that's useful
  signal, not a bug in the test.
- **Evidence:** screenshot of the scan result.
- **Pass/fail:** fail if the scan errors out or the re-check doesn't save.

### 2.4 Camera workflows
- **Objective:** the raw camera experience across the app's different capture modals — not just whether a photo
  gets taken, but whether the *flow* is obvious.
- **Setup:** test on a real phone, real camera permission prompt (not previously granted, if you can arrange it).
- **Steps:** trigger each of: Field Check camera, Graffiti camera (`/lab/graffiti-cam` and the Map toolbar version),
  and Report's photo capture.
- **Expected:** camera permission prompt is clear, viewfinder is responsive, retake is obvious, the captured photo
  is what you'd expect (not cropped wrong, not upside down).
- **Watch for:** how many attempts it takes a first-time user to understand each flow — this is exactly the kind of
  friction worth recording even when nothing technically breaks.
- **Evidence:** a short screen recording of one full capture, start to finish (see §6).
- **Pass/fail:** fail if the camera doesn't start, or a captured photo is lost/corrupted.

### 2.5 AD Scanner / AR Lens (`/ar`)
- **Objective:** verify this feature for what it actually is today.
- **Honesty check first:** ArLens is currently a **camera + GPS + live air-quality/CO₂ overlay** experience — it
  does **not** yet identify the brand or ad on the billboard automatically. Test it as that, not as the AI-brand-ID
  scanner from the future product vision (see the product roadmap in the engineering dossier). Reporting "it didn't
  tell me what brand this is" is expected today, not a bug — file it as an `idea`/roadmap note, not a `P1`.
- **Setup:** point of interest with a real static or digital ad structure nearby.
- **Steps:** open `/ar` → grant camera → let it lock onto a target → check the environmental overlay (PM2.5, CO₂
  estimate) → log a report from the lens if that action is available.
- **Expected:** camera + GPS lock work smoothly; the overlay numbers look plausible for your real location.
- **Watch for:** camera/GPS permission friction, overlay numbers that are obviously wrong (e.g. PM2.5 stuck at a
  stale value).
- **Evidence:** screenshot of the locked-on overlay.
- **Pass/fail:** fail on camera/GPS failure; a "no brand ID" observation is not a fail, it's a roadmap note.

### 2.6 Location Detail
- **Objective:** the record a scan/report/check ultimately produces.
- **Setup:** any location with at least one field check.
- **Steps:** open a location → review the gallery → open the lightbox → check the "time since last tag" counter →
  check related/nearby locations.
- **Expected:** gallery and lightbox work smoothly on a real touchscreen (swipe, not just tap), counter reads
  sensibly, nearby locations are actually nearby.
- **Watch for:** photo load time on real mobile data, gallery gestures feeling native vs. clunky.
- **Evidence:** screenshot of the gallery + lightbox open.
- **Pass/fail:** fail if photos fail to load or the gallery is unusable by touch.

### 2.7 Before/after evidence
- **Objective:** the actual product story — does a location visibly show its history?
- **Setup:** a location with a verified re-check (or create one via §2.3 first).
- **Steps:** open the location detail → find the before/after comparison → check the map for the living-record
  accent ring on that same pin.
- **Expected:** before/after is visually obvious and correctly ordered (original report photo as "before").
- **Watch for:** whether a first-time viewer would actually understand what they're looking at without being told.
- **Evidence:** screenshot of the before/after view.
- **Pass/fail:** fail if the comparison shows the wrong photos or doesn't appear at all for a verified location.

### 2.8 AI-assisted workflows
- **Objective:** every real (not aspirational) AI feature in the app, tested together.
- **Setup:** none special.
- **Steps:** run AI Unit Finder (§2.1) for a real area you know, run AI condition scan (§2.3) on a real photo.
- **Expected:** results are plausible for the real world you're standing in, not obviously hallucinated.
- **Watch for:** response time on real mobile data, and specifically note *how wrong* a bad result is — "slightly
  off" and "completely fabricated" are different severities.
- **Evidence:** screenshot of each AI result next to what you can see with your own eyes.
- **Pass/fail:** fail on error/timeout; a plausible-but-imperfect AI answer is a `P2`/`P3` note, not a `P0`.

### 2.9 Mobile experience (cross-cutting)
- **Objective:** run §2.1–2.4 again, but deliberately on a real phone, one-handed, outdoors, in whatever your
  actual network conditions are that day.
- **Setup:** no wifi — real mobile data.
- **Steps:** repeat the map, report, and camera sessions above.
- **Expected:** same functional outcomes as desktop, layout doesn't break, nothing requires two hands or a
  precision tap.
- **Watch for:** anything that only breaks on real mobile data (slow uploads, timeout errors that never show
  desktop on wifi).
- **Evidence:** at least one full screen recording (§6).
- **Pass/fail:** fail if any core action (report, field check, view map) is impossible one-handed outdoors.

### 2.10 Onboarding / first-use experience
- **Objective:** what a brand-new user actually experiences, with no prior context.
- **Setup:** private/incognito browsing, no prior login.
- **Steps:** land on the home page → read it cold → start the walkthrough tour if offered → try to do one real
  action (report or explore the map) without any other guidance.
- **Expected:** it's clear within seconds what the app is and what to do first.
- **Watch for:** anywhere you'd have been stuck without already knowing the product — that's the most valuable
  thing this session can surface.
- **Evidence:** a recording of the first 60 seconds, narrated with your genuine first reaction.
- **Pass/fail:** there's no hard fail here — capture friction as `P2`/`P3`/`idea`, this session is about signal, not pass/fail.

---

## 3. Triage model

Every observation gets exactly one severity and at least one type. No exceptions, no "everything is urgent."

### Severity

| Label | Meaning | Response |
|---|---|---|
| `P0-blocker` | Blocker, unsafe, or data loss (a submission disappears, a security issue, the app is unusable) | Drop other work, fix same day |
| `P1-critical` | A core workflow fails outright (can't report, can't field-check, map doesn't load) | Next in the queue |
| `P2-ux` | Meaningful UX/product problem — works, but wrong/confusing/slow | Scheduled, not urgent |
| `P3-polish` | Small polish or improvement | Backlog |
| `idea` | A future opportunity, not a defect in what exists today | Roadmap, not a bug queue |

### Type (apply alongside severity — an issue can have one severity and one or more types)

| Label | Use for |
|---|---|
| `bug` | Something is objectively broken |
| `ux-friction` | Technically works, but is confusing, slow to understand, or takes multiple attempts |
| `product-opportunity` | A real gap or idea surfaced by actually using the product in the field |
| `performance` | Slow, janky, or resource-heavy under real conditions |
| `accessibility` | Screen reader, keyboard, contrast, or other a11y defect |
| `content` | Copy, translation, or informational-accuracy issue |
| `field-environmental` | Caused by real-world conditions (signal, GPS drift, glare) rather than app logic — still worth recording, but engineering can't "fix" physics |

Engineering applies/confirms severity and type during triage — Dave's initial guess from the template dropdown is
a starting point, not the final word. If severity gets downgraded or upgraded, that's normal, not a disagreement.

---

## 4. The engineering loop

Concretely, how a field observation becomes a verified fix:

```
Dave records: "Camera flow takes me three attempts to understand what to do."
        │
        ▼
Filed via 📋 Field test observation — device, exact steps, expected/actual, video attached
        │
        ▼
Engineering:
  1. Reproduce the exact steps on the same (or closest available) device
  2. Identify root cause — read the actual code path, don't guess
  3. Propose the smallest safe fix (matches this repo's standing engineering principle —
     no unrelated refactors riding along)
  4. Implement on a dedicated branch
  5. Write or update a Playwright test that would have caught this
  6. Run the full regression suite (lint, typecheck, build, Playwright desktop + mobile)
  7. Open a PR, link it to the issue (`Closes #N`), record the exact commit
  8. Once merged: label the issue `ready-for-retest`, remove `needs-repro`
        │
        ▼
Dave re-runs the EXACT original scenario in the field
        │
        ▼
Dave comments the verification result on the issue
        │
        ▼
Only now: label `verified-fixed`, close the issue
```

**An issue is never closed because a PR merged.** Merged code is "ready for retest," not "done." This is the one
rule in this whole system that isn't optional — the entire point of a field-testing loop is that reality, not a
green checkmark, decides when something's fixed.

---

## 5. Daily field mission

A lightweight template Dave can fill in (mentally or in a note) before heading out — not a system to maintain,
just a shape to follow. The engineering dashboard's "Today" section shows the current one.

```
TODAY'S TEST MISSION — [date]

Primary workflow:      [the one thing that matters most today]
Secondary workflow:    [one more, if time allows]
3 things to observe:   1.
                        2.
                        3.
1 stress test:          [something a normal user wouldn't do on purpose — poor signal,
                         interrupting a submission, denying a permission, etc.]
1 mobile test:          [same primary workflow, but phone + real mobile data]
Evidence required:      [screenshot minimum; video for anything with friction]
Expected duration:      [~20-40 min is realistic for one focused session]
Success criteria:       [what "this session was worth it" looks like — usually
                         "filed 0-3 real observations," not "found nothing"]
```

Filing zero issues in a session is a valid, good outcome — it means that workflow is solid today.

---

## 6. Video feedback convention

No video-processing or transcription tooling exists in this repo today, and none is being built speculatively.
This section is a **convention for humans now**, and a **contract a future AI tool could target later** — nothing
here claims automatic video-to-issue conversion already works.

### Recording format

```
SESSION:          [short name, e.g. "map-and-report-2026-08-14"]
FEATURE:          [which workflow]
DEVICE:           [exact device/browser]
LOCATION/CONTEXT: [where, real-world conditions]
START TIME:       [local time]
TEST OBJECTIVE:   [what this recording is trying to check]
```

State this out loud at the start of the recording (or type it into the issue alongside the attached file — both
work). During the recording, narrate each observation using the same four words every time, so a transcript is
mechanically easy to split into records later:

```
"Test 1..."
"Problem..."
"Expected..."
"Actual..."
"Severity..."
"Next..."
```

### The future AI-processing contract

If/when a transcription or video-understanding tool is added, its job is narrow: take the header block + the
"Test N / Problem / Expected / Actual / Severity" narration and emit **one field-test record per Test N**, in
exactly the same shape as §1's table. That's the whole contract — the target schema already exists (it's the issue
template), so a future tool has a fixed, well-defined output shape to aim for, rather than needing to invent one.
Until that tool exists, Dave (or engineering, reviewing the recording) does that translation by hand — attach the
video, then file one 📋 Field test observation per problem it shows.
