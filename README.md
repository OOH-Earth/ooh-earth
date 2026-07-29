# OOH Earth

**Public space isn't blank space.**

OOH Earth maps the corporate outdoor advertising you never agreed to — the billboards, the digital screens, the wraps and the takeovers colonising the streets you walk every day — and gives communities the evidence, the tools, and the cover to push back.

It's a civic platform, not a startup. Community-funded, copyleft, and not for sale. Every pound goes to the movement.

🌍 [oohearth.app](https://oohearth.app) · [ooh.earth](https://ooh.earth) · ✉️ hello@outofhell.org

---

## What this is

This repo is the OOH Earth civic app: a live map of outdoor advertising in public space, AI-assisted capture for documenting what you find on the street, an evidence feed, an impact dashboard, AR tools for reimagining what a wall could be instead, and an objection generator for taking it to the people who put it there. Contributors move up through an operative system — Scout, Field Operative, City Ambassador — as they map their cities.

## Why

Outdoor advertising is the one medium you can't turn off, close, or scroll past. It's imposed on public space without consent, and it's overwhelmingly one-directional: corporate messages, aimed at everyone, answerable to no one.

We think that's a public-space problem, a democratic problem, and a cultural-rights problem — and we're not the first to say so. OOH Earth stands on:

- **UN SDG 11.7** — universal access to safe, inclusive, accessible public space.
- **UN SDG 12.8 & 16.7** — informed, responsive, inclusive participation.
- **UN Special Rapporteur on cultural rights, report A/69/286** — advertising and marketing's impact on the enjoyment of cultural rights.
- **The Les Déboulonneurs acquittal (Paris, 25 March 2013)** — the tradition of principled, non-violent resistance to visual pollution.
- **The First Things First lineage** — designers refusing to spend their craft only on selling.

Mapping is the first act. Evidence is the second. Everything after that belongs to the communities doing the work.

## Not for sale

OOH Earth is anti-VC by design. There is no exit, no acquisition, no growth-at-all-costs. The code is copyleft so it can never be enclosed, and the platform is community-funded so it never has to answer to advertisers. If that sounds unusual, that's the point.

## Tech

- **App** — [Base44](https://base44.com) (React front end in `src/`, Deno backend functions in `base44/functions/<name>/entry.ts`), Vite + Tailwind.
- **Secrets** — always via `Deno.env.get("SECRET_NAME")`. Never in code, never committed. See [SECURITY.md](./SECURITY.md).
- **Marketing sites** — Framer.
- **Automation spine** — n8n, bridged to the app by webhook.

## Running locally

```bash
npm install
npm run dev        # local dev server
npm run build      # production build — the gate before anything ships
```

Build-verify (the habit we hold everyone to):

```bash
npm run build > /tmp/b.log 2>&1; echo "BUILD EXIT: $?"; tail -3 /tmp/b.log
```

If it doesn't build clean, it doesn't merge.

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) first — it covers the BACKUP-first rule, how we treat the production app, and the standards we hold. Then find an open issue, or open one.

By contributing, you agree your work is released under the licences below.

## Licence

Dual-licensed, deliberately:

- **Code** — [GNU AGPL-3.0](./LICENSE). Copyleft that closes the SaaS loophole: run a modified OOH Earth as a network service, and you must publish your source too. No enclosure.
- **Content, data & design** — [CC BY-SA 4.0](./LICENSE-CONTENT.md). Share it, remix it, build on it — keep it open and credit the movement.

## The movement

OOH Earth is one node in a wider network of people reclaiming public space:

- [Brandalism](https://brandalism.ch)
- [Adfree Cities](https://adfreecities.org.uk)
- Subvertisers International
- [Adbusters](https://adbusters.org)

Trading as **Out of Hell** · hello@outofhell.org

---

*Built and maintained by Dee Sidhom, Founder. Zen anarchist, ex-adland, now on the other side of the billboard.*
