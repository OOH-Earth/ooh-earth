# Mission Control data contract

This is the read contract for the future Mission Control UI. It is served by
the admin-only `operationalHealth` function and contains facts only.

```json
{
  "status": "HEALTHY | DEGRADED | UNKNOWN",
  "evidence_status": "VERIFIED | INSUFFICIENT_DATA | NOT_VERIFIED",
  "generated_at": 0,
  "services": [
    {
      "state_key": "fieldStats:production",
      "service": "fieldStats",
      "environment": "production",
      "status": "HEALTHY",
      "last_success_at": 0,
      "last_failure_at": 0,
      "last_error_code": "DEPENDENCY_FAILURE",
      "last_duration_ms": 12,
      "success_count_window": 1,
      "failure_count_window": 0,
      "window_started_at": 0,
      "release": "unknown",
      "evidence_status": "VERIFIED",
      "updated_at": 0
    }
  ]
}
```

The endpoint returns no request IDs, users, emails, payloads, provider data,
secrets, or raw errors. Empty state is explicit `UNKNOWN` plus
`INSUFFICIENT_DATA`; it is never rendered as healthy. `release: unknown` means
the runtime did not expose a trusted deployment identity.

`submitOffline` and `stripeWebhook` are intentionally absent until their
write overhead and safe pilot behavior are measured. Native Base44 logs remain
an independent channel and are not replaced by this snapshot.
