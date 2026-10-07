# Hackers Club — bounded first slice

Owner request: an inviting portal that attracts participation through creativity, hands-on making and ethical research. Purpose: turn curiosity into a useful real-world action, not a follower feed.

## Implemented candidate

- Public `/hackers-club`, discoverable under Campaigns, with route metadata.
- Poster remix: local text/colour concept with an explicit concept label, reset and no save/upload/publish action. Text renders through React escaping; no HTML injection.
- Street-art brief: permission, materials, duration and cleanup agreed with the responsible owner; leads to the existing map. A mapped location is not permission to alter it.
- Research brief: owned or explicitly authorised environments, written scope, stop conditions and private reporting. This portal grants no authorisation to test OOH Earth or third-party screens/systems. No scanning/exploitation tools.
- Existing field-route and contact destinations. No fake members, events, achievements, rewards or book excerpts.

No new backend/schema/permission/storage. Component state only. Shared application navigation/auth/telemetry remain unchanged. Membership, submission moderation, public poster uploads, book-content rights and conference scheduling require separate bounded work.

## Qualification

Local lint, typecheck and BACKUP-targeted build passed. Four browser tests authored/discovered: 360x800, 844x390, 1440x900 journeys plus keyboard/main-content axe coverage. Assertions cover escaped text, reset, maximum-length poster containment, no horizontal overflow, reload reset, no entity mutations, brief links and page errors. Browser execution and rendered visual QA are required before promotion; discovery is not a pass.

This candidate must follow exact-head CI, BACKUP target proof and rendered QA. Existing qualified production candidates remain pinned. No deployment from this document.

## Dave UX handoff after qualification

Preview: BACKUP `/hackers-club` only after live artifact verification. What changed: a creative starting point with three briefs and an editable poster concept. Try: write a message/change colour/reset; select street-art and follow the map link; select research and assess whether the permission boundary and next action are clear. Ask where the purpose or next step felt unclear, with device/browser and a screenshot. Do not send an unqualified preview as if tested.
