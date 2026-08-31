# Continuous Evidence Loop

Certification evidence is published only through the release CLI after the
candidate has reached the corresponding verified state:

```text
BACKUP_DEPLOYED → BACKUP_VERIFIED → publish:backup
PRODUCTION_DEPLOYED → PRODUCTION_VERIFIED → publish:production
```

`publish:backup` and `publish:production` require an exact candidate SHA,
matching environment, successful deployment, verified public smoke, verified
OperationalHealth, and a non-future timestamp. They reject malformed or failed
evidence and refuse older evidence over newer evidence. Publication is
idempotent for the same observation and writes the manifest atomically.

The command updates the bounded static `release-manifest.json` consumed by
Mission Control and redeploys that artifact through the existing Base44 site
deployment path. A remote deployment failure restores the local pre-publication
manifest; a provider-side partial deployment remains runtime-dependent and is
reported as a limitation rather than hidden.

The manifest is not a log store. It contains no credentials, tokens, PII,
request bodies, Stripe payloads, raw logs, or arbitrary provider output.
Runtime SHA remains `UNKNOWN` where Base44 cannot provide verified identity.

No new external service or subscription is introduced.
