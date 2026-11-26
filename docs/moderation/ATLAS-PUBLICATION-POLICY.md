# Atlas publication policy (interim)

**Status:** INTERIM — owner-authorized criteria, adopted 2026-11-25. Not legal advice. Review when a lawyer, a published terms-of-use, or a designated moderator is in place (see [Open questions](#open-questions-and-remaining-jurisdictional-questions)).

**Scope:** deciding when a pending `Location` (and its attached `LocationPhoto` rows) may be moved to `verified`, which makes it publicly visible. This policy authorizes **approval of clear cases only**. It authorizes no rejection and no deletion.

## What "verified" means

"Verified" means that the available evidence supports the **existence and reported location of the photographed asset at capture time**.

It does **not** verify advertising claims, endorse a brand, establish legality, establish who owns or operates the asset, or prove harm. A descriptive category such as `crypto_promotion` is a description, not a finding.

## Eligible subjects

- Physical advertising or signage, advertising structures, and street art.
- Indoor event signage, when photographed from an area the contributor was permitted to access.
- Temporary displays count as **observations at capture time**, not proof that the display remains.
- Do not infer trespass, sponsorship, or any commercial relationship.

## Approve only when ALL conditions pass

1. **Evidence.** Clear photographic or independently attributable field evidence supports the asset's existence. AI output or an imported listing alone is insufficient.
2. **Location.** Coordinates are plausible and supported by available evidence. Being somewhere in the same city is insufficient for a precise placement. Do not invent accuracy.
3. **Description.** Material statements match the evidence. No unsupported audience figures, allegations, advertiser identities, product categories, or legal conclusions. Descriptive categories are not findings of harm.
4. **Publication rights.** Existing submission terms and provenance give a reasonable, _documented_ basis to publish the photograph. Check rights concerns for prominently depicted artwork, indoor exhibits, and third-party imagery. Do not assume that public visibility, or the uploader holding the file, grants permission. **An unresolved rights question means HOLD.**
5. **Privacy and safety.** No unnecessary identifiable people, children, private contact information, credentials, private interiors, or sensitive locations. Hold items that need redaction. Do not publish first and fix later.
6. **All attached media.** Inspect every photo that approval will automatically publish. One unreviewed or unsuitable attached photo blocks approval of the whole record.
7. **Quality.** No clear duplicate, spam, fabricated evidence, or materially misleading record.
8. **Restrictions.** No known removal request, active rights or privacy dispute, or applicable platform prohibition.

## Outcomes

| Outcome     | When                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------- |
| **APPROVE** | Every criterion passes.                                                                       |
| **HOLD**    | Evidence, rights, location, or policy eligibility remains uncertain. The record stays pending. |
| **REJECT**  | Only under an established rejection policy and separate authorization. Not authorized here.   |

A bulk-imported listing with no photographic or field evidence is a HOLD under criterion 1. A recommended correction to a description is reported; it is never silently edited.

## What approval actually does (verified against the code)

- Approval goes through the `moderate` function (`base44/functions/moderate/entry.ts`). Only callers with role `admin`, or access `admin` or `moderator`, may verify. Entity writes inside that function use the service role _after_ that caller check.
- Verifying a `Location` also sets every **pending** `LocationPhoto` for that location to the same status. Those photos become public with it. This is why criterion 6 exists.
- `locationShare` serves a public page, preview metadata, and the record's own image only for `status === 'verified'` (`base44/functions/locationShare/handler.ts`). Pending, rejected, and missing records return an identical generic 404.
- No email, reward, or on-chain action is triggered by `moderate` itself. Verified records feed public read-time views (share links, public counts, opt-in member profiles).
- The PortalOps Approve and Reject buttons write immediately, with no confirmation step. The same function can set `rejected` afterward, which is the established reversible procedure. `moderate` supports only the `queue` and `verify` actions; it has no delete path.
- **A second status path exists and behaves differently.** `LocationEditPanel` (`quickAction`) updates a `Location`'s `status` directly through entity RLS. That write does **not** cascade to the record's pending `LocationPhoto` rows, so the main image can become public while gallery photos stay pending. For approvals under this policy, use PortalOps (the `moderate` function), so the cascade and the criterion-6 review match what actually becomes public.

## Procedure for each approval

Do this one record at a time, never in bulk, through the normal authenticated admin or moderator interface.

1. Confirm the exact record ID and re-read its current state and every attachment (including gallery photos in any status). Stop if anything changed.
2. Keep a private before-state and the decision reason.
3. Confirm the criteria above, citing the evidence for each.
4. Approve. Read the status back.
5. Verify the anonymous `locationShare` response (status, `og:` metadata, canonical URL, image content type) and confirm only the intended media became public.
6. Record the timestamp and the public URL. Leave contributor identity out of the record.
7. If anything unintended became public, stop, and use only the reversible moderation procedure. Do not delete.

## Sources

Repository sources for the statements above:

- `base44/functions/moderate/entry.ts` — who may verify; status values; the photo cascade.
- `base44/functions/locationShare/handler.ts` — the public eligibility gate (`status === 'verified'`).
- `docs/ops/ooh-earth/09-MULTI-BRAND-DATA-MODEL.md` — verifying a `Location` means the physical asset exists, and does not verify any advertiser observation.
- `docs/ops/ooh-earth/12-CREDIBILITY-FOLLOWUP-2026-10-19.md` — records that `/privacy` and `/terms` do not exist, that photo-rights confirmation, guidance against identifiable people, and a correction or removal route are unverified, and that the operator's legal entity and a named moderation contact are not evidenced.
- `src/lib/imageCompress.js` and `e2e/image-privacy.spec.ts` — uploaded photos are re-encoded, which strips EXIF/GPS metadata; coordinates therefore come from the submission fields, not from the image file.
- `LICENSE-CONTENT.md` — the project's own non-code materials are CC BY-SA 4.0. This is the project's licence of its own content. It is **not** a grant from a photographer to OOH Earth.
- `brain/PRODUCT.md` — verified contributions can appear on opt-in public member profiles.

## Known gaps this policy cannot close

- **No contributor-facing submission terms.** No terms, privacy, or removal-request page exists, and no consent or licence text is shown at upload (see the 12-CREDIBILITY audit above). Criterion 4 therefore cannot be satisfied from terms alone. Until terms exist, criterion 4 can be met only by documented provenance for the individual photograph (for example, an operator's written confirmation that they took it and permit publication).
- **No named moderation contact** responsible for corrections and removals (criterion 8).
- **Location evidence is mostly the submitted coordinates.** Image metadata is stripped by design, indoor GPS is coarse, and many photos show no landmark. Independent corroboration (a dated event listing, a visible address, a landmark) raises confidence; same-city plausibility does not.

## Open questions and remaining jurisdictional questions

These are questions to put to counsel. They are not answers.

1. **Which law governs?** The operator's legal entity and place are not evidenced in the repository. Contributors and subjects may be in different countries. Thailand is where the first records under review were photographed.
2. **Photographs of third-party advertising and artwork.** Whether, and in which jurisdictions, publishing a photograph that prominently depicts a third party's advertisement creative or street art needs the rights-holder's permission, and whether any "photograph of a work in a public place" exception applies to advertising, street art, or only architecture.
3. **Indoor exhibits and event signage.** Whether access to a private venue or ticketed event carries photography or publication limits, and how to evidence that the contributor was permitted to be there.
4. **Identifiable people and vehicles.** Which data-protection and personality-rights rules apply to incidental bystanders, models shown in an advertisement, and legible vehicle registration plates, and what redaction standard is required before publishing.
5. **Contributor consent and licence.** What terms a contributor must accept so OOH Earth has a documented basis to publish, store, and let others reuse a photograph, including the interaction with the project's CC BY-SA content licence.
6. **Removal and correction route.** Who is responsible, how a request is submitted, the target response time, and the status a record moves to while a dispute is open (the current tooling offers `rejected`, which is not the same as "disputed").
7. **Sensitive locations.** Whether precise coordinates should ever be coarsened for certain subjects (for example, street art on private property), and who decides.
8. **Who may approve.** Whether approval should be limited to a designated human moderator, and whether an AI-assisted review may recommend but not approve.

## Change log

- 2026-11-25 — Interim criteria adopted by the owner; this document written. First review batch: no records met all criteria (see the private audit record held outside the repository).
- 2026-11-26 — Second bounded review. An owner-provided provenance statement (the photographer took the reviewed photographs and submitted them for publication) was applied to that batch only. It is recorded as a statement, not independently verified evidence. It addresses rights in the photograph only: not prominently depicted third-party artwork or advertising creative, venue access, privacy, location, or description. The review approved no records. It found one record already `verified` with no `status_updated_at` (so apparently not set through `moderate`) and with its gallery photos still pending, the behaviour described under "A second status path". Details are in the private audit record held outside the repository.
- 2026-11-26 (follow-up) — Owner-authorized factual corrections were made to two records in the batch; no record was approved. `/terms` and `/privacy` return the 404 page. Research note, not legal advice: the English text of Thailand's Copyright Act B.E. 2537 on [WIPO Lex](https://www.wipo.int/wipolex/en/text/129762) provides in s.37 that photographing (and similar acts) a non-architectural artistic work openly located in a public place does not infringe copyright in it; s.38 treats architectural works separately. The text read does not expressly address publishing such photographs online (communication to the public is a separate right under s.15), amendment currency was not confirmed, and the governing law is undetermined. This narrows open question 2 but does not close it. **Owner decision pending:** whether s.37 is accepted as a sufficient documented basis under criterion 4, and for which subjects. Until then those records stay on HOLD.
