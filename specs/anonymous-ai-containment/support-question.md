# Draft support question for Base44 (for the owner to review and send — NOT sent)
Prepared 2026-10-29. Contains no secrets, tokens, user data or exploit detail. Send from the workspace owner's account; attach nothing sensitive.

**App:** OOH Earth (production app id `6a62213cff3ccbca88c04ff5`, workspace owner David).

**Question**
Our app is public (anonymous visitors can browse and submit reports). We want the built-in `Core.InvokeLLM` integration to be usable **only** from our authenticated backend functions, and **not** callable directly from anonymous browser clients using the SDK (`base44.integrations.Core.InvokeLLM`).
1. Is there a supported setting or configuration that denies anonymous (and/or all direct browser) callers of `Core.InvokeLLM` (and other metered integrations such as `GenerateImage`, `UploadFile`, `SendEmail`) while keeping them usable from backend functions through `asServiceRole`? If yes, where is it, and does it take effect on a public app?
2. If no, is there a supported way to require authentication per integration, or an allowlist of callers/origins/functions, that is enforced server-side (not only in our frontend)?
3. What enforceable controls exist for **rate limiting, concurrency and spend** on integration credits per app (hard cap, per-user/per-IP limit, alert thresholds that actually block)? The documentation says out-of-credits stops the integration for every user and suggests building our own per-user check; we want to know the supported platform-side options.
4. The Security page for this app lists "Unauthenticated Consumption of High-Cost LLM Integration" and "Prevent unauthorized credit usage" (Credit protection, High). Which concrete platform control does "Prevent unauthorized credit usage" correspond to, and what exactly does it change?
5. Does the AI gateway (`aiGateway`, service-role mode) offer anything for this app that the legacy `Core.InvokeLLM` browser path does not (e.g. server-only enforcement), and is migrating our backend calls to it recommended?

**Why it matters (context, non-sensitive):** we have moved our own callers behind an authenticated backend function, but that does not close the original browser-callable integration; we need to know whether the platform can.

**What we will do with the answer:** test any offered control in our separate BACKUP app first, record the result, and only then propose a production configuration change to the owner. We are not asking Base44 to change anything on our behalf.
