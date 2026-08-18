# OOH Earth — Product Delivery Checkpoint

**Main SHA: `43bfe9d`** · Fresh clean-environment verification: lint/typecheck/Prettier/build clean, 0 security vulnerabilities, CodeQL clean, 14/14 regression tests pass.

## Executive summary

OOH Earth is a platform for documenting corporate outdoor advertising in the
field, identifying the brand and corporation behind it, and mapping that
activity so it's visible at scale. This checkpoint closes out a focused
engineering pass that connected the pieces that were already real but not
yet linked to each other — and gives you an honest accounting of everything
that isn't built yet, without pretending otherwise.

## What we set out to prove

That the core adbusting loop — **capture → identify → understand who's
behind it → see it on the map → see the pattern → come back to the
evidence** — is a real, working, connected product, not a collection of
disconnected screens.

## What is now genuinely working

The connected loop, verified with real browser interaction end to end:

```
capture (photo, form or AR camera)
   → AI identification (brand, agency, parent corporation, sector)
      → location record created
         → map placement + brand/parent-corp search
            → corporate footprint (sibling brands, same holding company)
               → Activity Heat (where is this concentrated?)
                  → click a hotspot → straight back to the evidence
                     → AR carries the same brand + corporate context
```

Every arrow above is real code, tested with a real browser, not source
review alone.

## What materially improved this pass

- A location page now shows you **which other locations share the same
  parent corporation** — previously you could only see "same brand."
- The map's search box now understands brand and parent corporation, not
  just street addresses.
- Activity is now visible as a **heat map**, and clicking a hotspot takes
  you straight into the report behind it — it went from a picture to a way
  in.
- AR's result now shows the parent corporation alongside the brand, matching
  what the regular report wizard already did.
- Your earned trophies now have a real path into the NFT studio.
- Every CI failure — tests, lint, typecheck, build, formatting — now
  surfaces a plain-English summary instead of forcing someone to read
  hundreds of lines of log.

## 10-minute Dave demo

**Step 0 — before anything else**: log in with an account that has filed at
least one real report. `/operative` and `/lab/nft` both need this to show
anything meaningful.

1. Home → **Report**
2. Upload an ad photo
3. Watch the AI identify brand / agency / parent corporation
4. Open **Map**
5. Search a brand name → watch it filter
6. Toggle **Activity Heat** on
7. Click a hotspot → watch it jump straight to that report
8. Open any location → scroll to "Connected Locations" → see corporate footprint
9. Open **AR** → capture something → watch brand + parent corporation appear
10. Open **Operative** → hover an earned trophy → **Mint as NFT** → NFT Studio opens pre-filled

**Two things to know before you demo**: AR needs camera access and a real
HTTPS browser context — it will not work inside an embedded preview iframe.
And steps 8 and 10 need real data behind the account you're logged in as.

## What is proven

Everything in `DAVE_COMPLETION_CHECKLIST.md` marked **SHIPPED** or
**VERIFIED EXISTING** — 13 of 19 tracked areas, each with a route you can
open and a test you can run.

## What is partial

NFT on-chain minting (real up to the point of minting, which then happens
externally on Zora by design); a verified-only heat filter (small, waiting
on your decision); dedicated business/fundraising intelligence views (the
underlying data is real and already visible, no dashboard built without a
named question to answer).

## What is blocked

Agency/freelance operations (needs your scope decision — real legal and
compensation implications, not something to guess); Hermes (zero reference
anywhere in the codebase — needs a real spec from you); release 1.3.0 (needs
a human with GitHub Settings access, not more engineering).

## Decisions Dave controls

See `06_DECISIONS_REQUIRED.md` — nine specific, scoped decisions, each with
a recommended default where one exists. None of them were guessed at or
built around.

## Recommended next phase

Unblock release 1.3.0 (five-minute human action), then decide the agency
workflow's real scope — it's the largest genuinely buildable area left, and
the one place your stated vision has zero real foundation yet.
