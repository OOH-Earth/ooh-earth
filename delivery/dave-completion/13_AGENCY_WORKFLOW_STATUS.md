# Agency / Freelance Workflow Status

## What exists

`ClientPortal.jsx` (route `/portal/client`) — a UI-only shell:
- A "briefs" list (2 sample items)
- A "campaigns" list (2 sample items)
- A "deliverables" list (3 sample items)

Every single row in every list is explicitly tagged `s: 'sample'` in its own
source data, and the file carries this comment at the top:

> "OOH Earth · Client Portal (/portal/client) — GATED. Agency clients &
> chapters. Scaffold with clearly-labelled SAMPLE rows; live data wires in
> via the n8n ops spine later."

This is **already honest** — it does not claim to be a working system, and no
fabricated "live" data exists anywhere in it. Nothing needed fixing for
honesty here.

## What was searched for and found NOT to exist

```
grep -rn "clock.in\|clock_in\|timesheet\|freelancer\|onboarding" \
  src/ base44/ --include="*.jsx" --include="*.js" --include="*.jsonc" -i
```

Every hit was incidental copy (a UI-tour sentence mentioning "onboarding," a
careers-page rate-card row mentioning "freelancer" as a compensation
category) — **zero actual workflow infrastructure**: no timesheet entity, no
clock-in/out mechanism, no e-signature flow, no contacts/jobs backend.

## Why this was not built further this pass

The requested scope — signed documents, freelancer onboarding, timesheets,
clock in/out, work tracking, contacts, jobs dashboard — is a real HR/ops
system with genuine legal and compensation implications:

- **Timesheets/clock-in-out** imply a stance on worker classification
  (employee vs. contractor vs. volunteer), which has real legal consequences
  depending on jurisdiction.
- **Signed documents** implies either a real e-signature integration
  (external vendor, contract, cost) or a lighter acknowledgment flow — these
  are materially different products.
- **Jobs/contacts/dashboard** is itself a multi-entity system (people,
  roles, assignments, status) that doesn't yet have a data model anywhere in
  this repo to extend.

Building any of this without Dave's decision on scope would mean inventing
business logic and legal posture on his behalf — exactly what this mission's
own stop rules prohibit ("business model," "legal commitments").

## What the smallest real v1 would look like (once scoped)

If Dave confirms the scope (Decision F), the smallest defensible v1,
reusing existing patterns in this codebase:

1. A new `Contributor`/`Assignment`-style entity (following the existing
   `CareerRoleStatus`/`QuestCompletion` RLS pattern already in `base44/entities/`)
2. Replace `ClientPortal.jsx`'s sample arrays with real entity-backed lists,
   following the exact honest-disclosure pattern already used elsewhere in
   this app (`portal-live-indicator` — sample-vs-live labeling shipped
   earlier this convergence effort)
3. A simple status-based "clock" (start/stop timestamps on an assignment
   record) — no payroll calculation, no legal document generation, until
   Dave's decision on those specifically

This is deliberately not designed further here, because designing further
without the scope decision would itself be guessing.
