# Live Canvas: decision package, implementation blocked

Status: DESIGN only. No new entity, permissions, publishing, vendor, or data writes are authorized by this document.

## Existing foundation

Use Location as the common place anchor. Existing LocationPhoto links to a Location with `location_id`; its `pending/verified/rejected` moderation state governs evidence visibility. FieldCheck already supplies verification activity. These evidence mechanisms must remain authoritative and must not be repurposed to imply a designer's concept ran in the physical world.

## Proposed separation

| Meaning | Evidence | Allowed presentation |
| --- | --- | --- |
| OBSERVED | Field capture attached to a real place | Evidence awaiting existing moderation |
| VERIFIED | Existing verification criteria satisfied | Verified field record |
| CONCEPT | Speculative artwork attached to a place | Persistent CONCEPT / NOT LIVE label |
| CAMPAIGN | Attributed real campaign with independently supported presence | Separate provenance and campaign context |

CONCEPT is never a moderation shortcut to VERIFIED. A speculative render cannot enter a Field Record or verified activity as field evidence. A campaign attribution does not itself prove the creative was displayed. Evidence verification and creative publication are separate decisions.

## Candidate model - needs owner approval

Keep LocationPhoto as field evidence. If persistent creative publishing is approved, consider a separate place-linked concept object rather than adding concept semantics to verified photos. Candidate fields: place reference, asset reference, kind, creator account reference, public credit chosen by the creator, rights declaration, publication/moderation state, revision reference. None are implemented. A future campaign association requires its own evidence and attribution rules; do not invent agency or brand ownership from user-entered text.

Do not expose existing `uploaded_by` values as public identity or directory consent. Use only explicitly consented credits. Do not add precise capture time, movement history, face recognition, or device location to this model.

## Ownership, licensing, permissions

- Location documentation does not establish ownership of the physical unit, image, artwork, or brand.
- Creator attribution must distinguish original work, commissioned work, and third-party material. A declaration alone cannot establish rights.
- Existing repository content licensing does not resolve rights to every uploaded photo, trademark, or derivative mockup. Public creative publishing remains blocked until the owner settles reuse, export, attribution, withdrawal, and takedown rules.
- Private drafts should remain creator-only unless sharing is deliberately authorized. No service-role expansion is proposed.
- Public publication, editing another creator's work, collaboration, agency claims, and paid use need explicit permission decisions.

## Moderation and abuse cases

| Risk | Required guard |
| --- | --- |
| Mockup mistaken for live activity | Persistent label on cards, detail, exports and shared previews; exclude from verified activity |
| False brand/agency endorsement | Separate unverified attribution from approved claims; no automatic ownership badge |
| Copyright or trademark misuse | Rights review, reporting and withdrawal process before public publishing |
| Harassment or impersonation | Moderation queue and reporting; no stranger-contact mechanism |
| Sensitive faces, plates or homes | Existing field-media review plus explicit rules for concept source assets |
| Removed evidence still embedded in a concept | Define dependent-asset withdrawal and cache/export behavior |
| Concept used as mission proof | Evidence acceptance checks reject concept assets |

## Decisions required before building

1. Are concepts private drafts only, or public? What exact action consents to publication?
2. Who can publish, revise, collaborate, remove and appeal?
3. Which rights and export permissions are required, and how are credits retained?
4. Who reviews reported content and disputed brand/agency claims?
5. What happens to derivatives when their underlying media is withdrawn?

## Safe next step

First prove the existing Capture -> Place -> Contribution loop. A nonpersistent preview using approved existing assets can explore composition later, with an always-visible CONCEPT label. Do not add saving, sharing, publishing or ownership claims until the checkpoint is resolved. AR similarly waits for a proven capture loop and a separate persistence/privacy decision.
