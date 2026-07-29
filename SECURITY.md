# Security Policy

OOH Earth holds community donor funds and real user-submitted data. We take security seriously and appreciate responsible disclosure.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately to **hello@outofhell.org** with:

- a description of the issue and where it lives,
- steps to reproduce (or a proof of concept), and
- the potential impact as you see it.

We'll acknowledge your report, work with you on a fix, and credit you if you'd like once it's resolved. Please give us a reasonable window to patch before any public disclosure.

## Secrets

Secrets in this project live in the **environment**, accessed via `Deno.env.get("SECRET_NAME")` — never in source, never committed. `.env` files are git-ignored.

If you find a secret that has been committed to the repository or its history:

1. **Don't** post it in a public issue or PR.
2. Email **hello@outofhell.org** immediately so we can rotate the credential.
3. We'll revoke and rotate the exposed secret and scrub it from history.

## Scope

The `main` branch is the supported, deployed version. Findings against `main` are the priority.

## On-chain treasury

The project treasury is held in a multi-signature wallet with a public, verifiable address for donor transparency. Treasury security concerns can be raised through the same private channel above.
