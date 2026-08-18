# Product Walkthrough — Screenshot Evidence

Screenshots below were captured this pass via real Playwright browser
sessions against a fresh production build, with mocked backend data (this
sandbox has no live Base44 backend — see `07_TEST_EVIDENCE.md`). File paths
are in the session scratchpad; ask if you'd like them copied into the repo or
attached separately.

## Home (desktop 1280px + mobile 390px)
`audit-desktop-home.png`, `audit-mobile-home.png`
Clear two-CTA hero ("Explore the Map" / "Report"), live-counter stats
("LIVE SPOTS", "VERIFIED"), real-content field dispatch feed below the fold.
Responsive layout holds at both widths.

## Map — brand/corp intelligence + heat (desktop + mobile)
`audit-desktop-map.png`, `audit-mobile-map.png`
Shows the globe view with real seeded pins, results list with photos and
brand names ("SHELL", "MCDONALD'S", "MARLBORO" in the test data), layer
toggle bar including the new "Activity Heat" entry (Intelligence group).

## Report wizard start (desktop + mobile)
`audit-desktop-report.png`, `audit-mobile-report.png`
"START ADBUSTING" headline, explicit 4-step process (Document → Identify →
Classify → Respond) visible as tabs, "no login, no gatekeeper" framing,
Step 1 media-type picker open.

## AR done-state (from an earlier verification pass this session)
`audit-ar-done.png`
Shows the AR capture done-state with brand identification and the
"View report"/"View on map" return-path links (PR #83, #95).

## Not captured this pass (features exist but weren't re-screenshotted here)

- **Location detail page** (`AdvertiserInfo` + `RelatedLocations` "same
  parent corporation" group) — verified via automated tests (PR #91), not
  freshly screenshotted this pass.
- **NFT Creator** (`/lab/nft`) — exists, gated behind `LabAccessRoute`
  (restricted access mode in this sandbox); not screenshotted this pass to
  avoid conflating "page exists" with "feature demoed."
- **Agency `ClientPortal`** (`/portal/client`) — exists as an explicitly
  sample-labeled scaffold; not screenshotted since every row is already
  marked "sample" in its own source and a screenshot would not demonstrate
  anything beyond what `13_AGENCY_WORKFLOW_STATUS.md` already states in text.
- **Trophies / `OperativeProfile`** (`/profile`) — exists and works (real
  badge/XP system); not screenshotted this pass.

Per the mission's own instruction ("Only capture screens for features that
actually exist"), nothing above was faked or mocked up to look more finished
than it is.
