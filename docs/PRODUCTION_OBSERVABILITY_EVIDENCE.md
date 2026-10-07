# Production observability evidence

Status: Checkpoint 1 — closed as far as the current Base44 runtime permits.
Evidence date: 2026-08-28 (UTC)

This record separates repository, deployment, and runtime evidence. It does not
turn an empty log query into evidence that a function did not execute.

## Evidence matrix

| Link in the chain | Result | Classification |
| --- | --- | --- |
| Safe request → instrumented function | `fieldStats` returned HTTP 200 with bounded aggregate keys in BACKUP and Production | RUNTIME VERIFIED |
| Request → correlation ID | The request accepted `X-Correlation-Id: mission-control-proof-mtd782lh` | RUNTIME VERIFIED |
| Function → response correlation header | No `x-correlation-id` header was returned by the Base44 gateway | RUNTIME-DEPENDENT / NOT VERIFIED |
| Function → structured logger | Repository handler uses the shared allowlisted helper and `console.info` | REPOSITORY VERIFIED |
| Logger → Base44 log sink | Immediate narrow queries returned `[]` in Production and preview | NOT VERIFIED |
| Bounded retrieval → operator diagnosis | No event was available to correlate in the CLI result | NOT VERIFIED |

The live request was read-only: `fieldStats` computes aggregate counts and does
not create, update, or delete business records. No checkout, webhook replay,
AI call, or account operation was used.

## Reproduction

The synthetic request used the Production app and a generated, test-prefixed
correlation value. It returned:

- HTTP 200;
- the expected bounded aggregate response keys;
- no response `x-correlation-id` header.

Immediately afterward, these bounded queries returned no entries:

```sh
npx base44 --app-id "$PRODUCTION_APP_ID" logs \
  --function fieldStats --since 10m --env prod -n 100 --json
npx base44 --app-id "$PRODUCTION_APP_ID" logs \
  --function fieldStats --since 10m --env preview -n 100 --json
```

The app ID is intentionally represented by an environment variable in this
example; do not put credentials or tokens in an evidence file.

## Root cause findings

1. The initial Production deploy reported `fieldStats` as blocked by another
   deployment in progress. A subsequent remote pull showed the old inline
   entrypoint and old handler, with no telemetry.
2. A targeted `fieldStats` deployment completed successfully. A remote pull
   then showed the telemetry-backed entrypoint and handler in Production.
3. The same synthetic request still produced no response correlation header.
   This is a gateway/runtime behavior observed at the endpoint, not evidence
   that the handler failed to construct the header.
4. Base44 documentation states that `console.info` is captured as INFO and
   that deployed logs are retrieved with the CLI. The empty result is therefore
   unresolved platform/runtime behavior, not a justified reason to replace the
   sink with a paid service.

## Privacy and safety proof

The shared helper allowlists operational dimensions, bounds strings, validates
error codes, and never receives request bodies, provider responses, or user
records. Local security tests assert that secrets, email fields, arbitrary
fields, and unbounded error values are excluded. The telemetry design does not
write an `AccessLog` row per request, avoiding a new data-retention and
privacy surface.

## Runtime health boundary

`runtimeHealth` remains GET-only and admin-only. Unauthenticated and
collaborator-session probes did not produce a passing health response; the
function returned its sanitized failure path. The authorization check is not
weakened. A valid app-admin/operator credential is required to certify the
success path. This is **NOT VERIFIED** for the current collaborator session.

## Zero-cost operating decision

Do not add an external sink, analytics service, database write path, or paid
monitoring product at this checkpoint. Until Base44 log retrieval is explained
or fixed, the reliable evidence sources are:

- repository tests that capture and inspect the structured event locally;
- CI artifacts and the immutable commit/PR chain;
- targeted Base44 deployment pulls and function status;
- bounded endpoint smoke tests;
- Base44 dashboard Activity Monitor/logs when an authorized operator can view
  the relevant environment.

The production correlation chain is therefore **partially proven**:

```text
safe request → deployed instrumented function → bounded response
                                      └→ runtime log retrieval: NOT VERIFIED
```

No Mission Control metric should display uptime, error rate, or trace counts
from this path until real samples are retrievable. Display `INSUFFICIENT DATA`.
