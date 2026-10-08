# Ordered queue (reconciled 2026-10-08)

1. DONE 2026-10-08: combined BACKUP candidate `4fb6cad` qualified (attempt 1 35/36 failed, attempt 2 36/36; doc 23). Any change to its source needs a new pin and a fresh qualification.
2. Physical-phone testing of place research, observed Rivers and the manual-coordinate field (explicitly outstanding; no one has done it).
3. Tailwind 3 -> 4 migration (#348 plan): decide the browser baseline, then screenshot baselines first. Isolated from any release candidate.
4. Investigate the manual-coordinate keystroke-loss reproduction on slow devices beyond the delayed-autofocus cause already proven; no retries or weaker assertions.
5. Add `timeout-minutes` to `ci.yml` jobs (a Playwright job hung 6 h on a runner step). Bounded workflow change, its own PR.
6. Main Map: replace the empty mushroom/flora stubs with viewport-driven iNaturalist observations reusing the Ecology code (frontend-only, separate PR).

Owner decisions (do not automate): Open-Meteo commercial eligibility, a licensed conflict-zone source, provenance of the legacy river samples (`VARANASI_SAMPLE_PROVENANCE_REQUIRED`), and the unrelated Home page model calls ("largest...", "total cumulative...", "corpus of document").
