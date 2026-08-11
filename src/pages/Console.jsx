import { useEffect } from "react";
import { Link } from "react-router-dom";
import Nav from "@/components/ooh/Nav";

/* ────────────────────────────────────────────────────────────
   OOH Earth · Capital & Ops Console (Investor Class) · v1
   Ported from the standalone Orbital Perspective build into the
   live app. Themed off the app's channel tokens (--c-ozone /
   --c-flare / --c-void / --c-silver / --c-slate2 / --c-dim) so it
   inherits dark · light · matrix themes automatically.
──────────────────────────────────────────────────────────── */

const METRICS = [
  { v: "~2,000", l: "Waitlist", flag: "verify" },
  { v: "~47", l: "City ambassadors", flag: "verify" },
  { v: "~12,000", l: "Ads documented (beta)", flag: "verify" },
  { v: "14", l: "Ecosystem entities", flag: "live" },
  { v: "~$55k", l: "Raised of $100k", flag: "verify" },
];

const BUILD = [
  "~33 routes", "9 secured entities", "7 serverless functions",
  "Live payments", "On-chain minting", "Dual mapping",
  "AR Reimagine", "Gamification", "Offline / PWA", "Design system",
];

const RATES = [
  ["Offshore / junior freelance", "£30k–55k"],
  ["Established freelancer / small studio", "£65k–110k"],
  ["UK / US agency (blended)", "£130k–240k+"],
];

const PREMIUM = [
  ["Waitlist & demand signal", "Community assembled ahead of launch"],
  ["Ambassador network", "City-level distribution across active chapters"],
  ["14-entity ecosystem", "Compounding surface area a single-app estimate ignores"],
  ["Institutional legitimacy", "UN SDG alignment · A/69/286 · precedent library"],
];

const CAPS = [
  { n: "01", h: "Documentation & evidence", p: "AI-assisted capture, nine-category offence taxonomy, evidence-grade metadata for council and planning submissions.", li: ["AdCam field camera", "Objection Generator", "Precedent-cited reports"] },
  { n: "02", h: "Creative & production", p: "Subvertising, brandalism, replacement campaigns and public-art responses — concept to installed unit.", li: ["Activist Assets library", "AR Reimagine mockups", "Field Store fulfilment"] },
  { n: "03", h: "Strategy & live ops", p: "City chapters, ambassador coordination and an n8n back-office spine keeping the civic app clean.", li: ["OOH Local chapters", "Recruitment Hub", "Automation / live ops"] },
];

const ECO = [
  ["01", "ooh.earth", "Live evidence platform & map", true],
  ["02", "OOH Earth App", "Capture, feed, impact dashboard", true],
  ["03", "OOH Earth Agency", "Full-service creative studio", true],
  ["04", "OOH Maps", "Media-space intelligence", false],
  ["05", "Activist Assets", "Open creative library", false],
  ["06", "Citizen Billboarding", "Field guide & toolkit", false],
  ["07", "Field Store", "Kit, cards & fulfilment", false],
  ["08", "AdCam", "Documentation camera", false],
  ["09", "OOH Local", "City chapters", false],
  ["10", "OOH Nomad", "Travelling members", false],
  ["11", "Street Social", "Community platform", false],
  ["12", "Community Hub", "Ambassador onboarding", false],
  ["13", "Billboarding.earth", "Campaign coordination", false],
  ["14", "Ad Free Streets", "Standards & brand system", false],
];

const PATHS = [
  { h: "Impact grants", p: "SDG-anchored civic infrastructure with measurable public-space outcomes and a precedent library ready for grant panels.", t: "Civic & urban-space foundations · SDG 11.7 / 16.7 programmes · cultural-rights grantmakers", to: "impact-grants" },
  { h: "Philanthropic capital", p: "A founder-led movement with in-kind assets already built — capital compounds reach rather than buys equity.", t: "Family offices · values-aligned HNW donors · degrowth & environmental philanthropy", to: "philanthropic" },
  { h: "Ecosystem / retro public goods", p: "Open, copyleft, on-chain-native infrastructure — a natural fit for retroactive public-goods funding rounds.", t: "Retro-PGF rounds · Gitcoin-style ecosystems · Base public-goods pools", to: "retro-pgf" },
  { h: "Civic-tech backers", p: "A working PWA, real routes and a live ops spine — a flagship civic-tech case study, not a deck.", t: "Civic-tech accelerators · gov-tech / open-data funds · platform sponsorship", to: "civic-tech" },
];

const SUBNAV = [
  ["ops", "Live Ops"], ["value", "Valuation"], ["agency", "Agency"],
  ["ecosystem", "Ecosystem"], ["capital", "Capital"], ["portals", "Portals"],
];

export default function Console() {
  // Deep-link support: /console#capital scrolls to the section after mount,
  // beating the app's ScrollToTop which fires on route change.
  useEffect(() => {
    const hash = window.location.hash?.replace("#", "");
    if (!hash) return;
    const id = requestAnimationFrame(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      <Nav />
      <div className="ic" id="top">
      <style>{css}</style>

      {/* ── HERO / THESIS ── */}
      <header className="ic-hero ic-wrap">
        <div className="ic-eye"><span className="ic-tick" />Capital &amp; Ops Console · Investor Class · v1</div>
        <h1>Public space isn't <em>blank space.</em></h1>
        <p className="ic-lede">OOH Earth is a community-funded civic institution documenting the outdoor advertising the public never agreed to — and arming communities with the evidence to push back. A live platform, a 14-entity ecosystem and a full-service agency studio, aligned to UN SDG 11.7, 12.8, 16.7 &amp; 17.</p>

        <div className="ic-askrow">
          <div className="ic-ask big"><div className="l">Pre-seed-equivalent ask</div><div className="v"><span className="cur">£</span>150k–500k+</div><div className="s">Grant / philanthropic · impact &amp; replacement-cost anchored</div></div>
          <div className="ic-ask"><div className="l">Replacement-cost floor</div><div className="v"><span className="cur">£</span>70k–150k</div><div className="s">Defensible in-kind build value</div></div>
          <div className="ic-ask"><div className="l">Actual cash outlay</div><div className="v">low £ thousands</div><div className="s">The capital-efficiency story</div></div>
        </div>

        <div className="ic-pills">
          <span className="ic-pill"><b>Copyleft</b> · community governance</span>
          <span className="ic-pill">Networked with <b>Brandalism · Adfree Cities · Subvertising Int'l</b></span>
          <span className="ic-pill">Active <b>UK &amp; Thailand</b></span>
          <span className="ic-pill">Built on <b>Base44</b> PWA</span>
        </div>

        <nav className="ic-subnav">
          {SUBNAV.map(([id, lbl]) => <a key={id} href={`#${id}`}>{lbl}</a>)}
        </nav>
      </header>

      {/* ── LIVE OPS ── */}
      <section id="ops" className="ic-wrap">
        <div className="ic-head"><h2>Live ops snapshot</h2><span className="m">Traction · self-reported · diligence-ready</span></div>
        <div className="ic-metrics">
          {METRICS.map((x) => (
            <div className="ic-metric" key={x.l}>
              <div className="mv">{x.v}</div>
              <div className="ml">{x.l}</div>
              <span className={`mf ${x.flag === "live" ? "live" : "unv"}`}>{x.flag === "live" ? "Live / built" : "Verify pre-diligence"}</span>
            </div>
          ))}
        </div>
        <p className="ic-note">Figures marked <b className="alert">Verify</b> originated in launch/demo context and must resolve to a live platform count before any funder review. A larger open-data map import (OSM / Overpass, 45k+ candidate sites) is in progress and reported separately once deduped.</p>
      </section>

      {/* ── VALUATION ── */}
      <section id="value" className="ic-wrap">
        <div className="ic-head"><h2>The two-stage valuation frame</h2><span className="m">Replacement cost → movement premium</span></div>
        <div className="ic-stages">
          <div className="ic-stage">
            <div className="no">STAGE 01</div>
            <h3>Replacement-cost floor</h3>
            <p>"This working platform already exists and would cost six figures to commission." A conventional build of this scope is a 500–1,000+ hour engagement.</p>
            <div className="band"><span className="cur">£</span>70k–150k</div>
            <ul className="tags">{BUILD.map((b) => <li key={b}>{b}</li>)}</ul>
            <div className="rates">{RATES.map(([a, b]) => <div className="rate" key={a}><span>{a}</span><span>{b}</span></div>)}</div>
          </div>
          <div className="ic-stage">
            <div className="no orange">STAGE 02</div>
            <h3>Traction + movement premium</h3>
            <p>The value a pure code estimate misses. Anchored on impact and the reach of the wider institution — not equity multiples.</p>
            <div className="band orange">+ premium</div>
            <ul className="prem">{PREMIUM.map(([a, b]) => <li key={a}>{a}<small>{b}</small></li>)}</ul>
          </div>
        </div>

        <div className="ic-eff">
          <div className="col"><div className="l">Actual cash outlay</div><div className="v">low £ thousands</div><small>Base44 subscription + credits + founder time</small></div>
          <div className="arrow">→</div>
          <div className="col b"><div className="l">Replacement / in-kind value</div><div className="v"><span className="cur">£</span>70k–150k</div><small>The gap <b>is</b> the pitch: extreme capital efficiency</small></div>
        </div>

        <div className="ic-result">
          <div className="ic-eye center"><span className="ic-tick" />Resulting ask</div>
          <div className="big"><span className="cur">£</span>150k–500k+</div>
          <p>Pre-seed-equivalent, framed for mission-aligned capital as replacement-cost + movement premium rather than equity.</p>
        </div>
      </section>

      {/* ── AGENCY ── */}
      <section id="agency" className="ic-wrap">
        <div className="ic-head"><h2>Agency studio · live ops</h2><span className="m">Full-service · the anti-Build Hollywood</span></div>
        <p className="ic-intro">A full-service creative OOH agency that inverts the model. Where incumbents dress corporate campaigns in street credibility, OOH Earth Agency runs <b>street-level, grassroots, Global South-tactical</b> work grounded in the SDGs and degrowth economics — production-grade, but on the public's side of the screen.</p>
        <div className="ic-caps">
          {CAPS.map((c) => (
            <div className="ic-cap" key={c.n}>
              <div className="cn">Capability {c.n}</div>
              <h4>{c.h}</h4><p>{c.p}</p>
              <ul>{c.li.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          ))}
        </div>
        <div className="ic-roll">
          <div className="ic-phase p1"><div className="tag">Setup · Stage 1</div><h4>Establish the studio</h4><p>Stand up the agency arm on the replacement-cost floor: platform, evidence pipeline, brand system and first live engagements. Capitalised as in-kind build value.</p><div className="gate">Funds the floor · £70k–150k basis</div></div>
          <div className="ic-phase p2"><div className="tag">Scale · Stage 2</div><h4>Scale live ops &amp; chapters</h4><p>Expand the ambassador network, activate Global South chapters and turn the ecosystem premium into reach — the layer justifying the full ask.</p><div className="gate">Unlocks the premium · movement scale</div></div>
        </div>
      </section>

      {/* ── ECOSYSTEM ── */}
      <section id="ecosystem" className="ic-wrap">
        <div className="ic-head"><h2>The 14-entity ecosystem</h2><span className="m">One mission · return public space to the public</span></div>
        <div className="ic-eco">
          {ECO.map(([n, nn, nd, core]) => (
            <div className={`ic-node ${core ? "core" : ""}`} key={String(n)}>
              <div className="en">{n}</div><div className="nn">{nn}</div><div className="nd">{nd}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CAPITAL ── */}
      <section id="capital" className="ic-wrap">
        <div className="ic-head"><h2>Capital pathways · investor class</h2><span className="m">Deep-lead pages · mission-aligned capital</span></div>
        <p className="ic-intro">The actual investor class: mission-aligned and public-goods capital, where replacement cost and impact — not equity multiples — set the value. Each pathway routes to a dedicated lead page tuned to that funder's diligence.</p>
        <div className="ic-paths">
          {PATHS.map((x) => (
            <div className="ic-path" key={x.h}>
              <div className="ph"><h4>{x.h}</h4><span className="chip live">Deep-lead page</span></div>
              <div className="ang">Angle</div><p>{x.p}</p>
              <div className="ang">Target funders</div><div className="tg">{x.t}</div>
              <Link className="lead" to={`/capital/${x.to}`}>Open lead page →</Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── PORTALS ── */}
      <section id="portals" className="ic-wrap">
        <div className="ic-head"><h2>Portals &amp; references</h2><span className="m">Dashboards · brand · data room</span></div>
        <div className="ic-portals">
          <a className="ic-portal" href="#top"><span className="pk">Dashboard</span><h4>Investor console</h4><p>Live traction, treasury and roadmap for the investor class. Gated view.</p><span className="go">Enter →</span></a>
          <a className="ic-portal" href="#capital"><span className="pk">Dashboard</span><h4>Client portal</h4><p>Agency clients &amp; chapters: briefs, live campaigns, deliverables and evidence.</p><span className="go">Enter →</span></a>
          <Link className="ic-portal" to="/kit"><span className="pk">Reference</span><h4>Brand guide</h4><p>Orbital Perspective system — palette, Inter Tight, reticle signature, UI kit.</p><span className="go">Open →</span></Link>
        </div>
      </section>

      {/* ── DISCLAIMER ── */}
      <section className="ic-wrap ic-disc-wrap">
        <div className="ic-disc">
          <h3>Diligence &amp; integrity notes</h3>
          <ul>
            <li>This console is a <b>positioning &amp; framing tool</b>, not investment or valuation advice. It is not prepared by a valuation professional.</li>
            <li>All <b>self-reported traction figures</b> must resolve to live platform counts before any funder review — funders will diligence them.</li>
            <li>The replacement-cost floor is an <b>order-of-magnitude build estimate</b>; anchor it precisely with a written quote from a dev shop or agency where needed.</li>
            <li>Anything placed in front of capital should be backed by a <b>proper data room</b>. The precise number depends on the instrument — <b>grant vs. equity vs. token</b>.</li>
          </ul>
        </div>
        <div className="ic-foot">
          <div><div className="fb">ooh<span>.</span>earth</div><p>Capital &amp; Ops Console · Orbital Perspective v1<br/>Community-funded · copyleft<br/>hello@ooh.earth</p></div>
          <div className="right"><span className="cls">Confidential · Investor Class</span><p>Framing tool · not valuation advice<br/>Figures verified on diligence</p></div>
        </div>
      </section>
      </div>
    </>
  );
}

const css = `
.ic{--y:rgb(var(--c-ozone));--o:rgb(var(--c-flare));--bg:rgb(var(--c-void));--tx:rgb(var(--c-silver));--ln:rgb(var(--c-slate2));--mu:rgb(var(--c-dim));--al:hsl(var(--destructive));
  background:var(--bg);color:var(--tx);font-family:var(--font-display);min-height:100vh;
  background-image:linear-gradient(rgb(var(--c-slate2)/.28) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--c-slate2)/.28) 1px,transparent 1px);background-size:44px 44px;padding-bottom:80px}
.ic *{box-sizing:border-box}
.ic .ic-wrap{max-width:1100px;margin:0 auto;padding:0 22px}
.ic section{padding:64px 0}
.ic .ic-eye{font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:var(--y);display:flex;align-items:center;gap:10px}
.ic .ic-eye.center{justify-content:center}
.ic .ic-tick{display:inline-block;width:22px;height:7px;background:var(--o);box-shadow:0 0 20px rgb(var(--c-flare)/.5)}
.ic .cur{color:var(--o)}
/* hero */
.ic .ic-hero{padding:118px 22px 54px}
.ic h1{font-size:clamp(32px,6vw,66px);font-weight:900;letter-spacing:-.03em;line-height:.95;margin:20px 0 0;max-width:16ch}
.ic h1 em{font-style:normal;color:var(--y);text-shadow:0 0 24px rgb(var(--c-ozone)/.35)}
.ic .ic-lede{margin-top:22px;font-size:clamp(15px,1.9vw,18px);font-weight:500;color:var(--mu);max-width:62ch;line-height:1.55}
.ic .ic-askrow{display:flex;flex-wrap:wrap;gap:14px 40px;align-items:flex-end;margin-top:36px;padding-top:28px;border-top:1px solid var(--ln)}
.ic .ic-ask .l{font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--mu)}
.ic .ic-ask .v{font-size:clamp(28px,5vw,50px);font-weight:900;letter-spacing:-.03em;line-height:1;margin-top:8px}
.ic .ic-ask.big .v{color:var(--y);text-shadow:0 0 24px rgb(var(--c-ozone)/.35)}
.ic .ic-ask .s{font-size:12px;color:var(--mu);margin-top:8px;font-weight:500}
.ic .ic-pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px}
.ic .ic-pill{font-size:11px;font-weight:600;color:var(--mu);border:1px solid var(--ln);border-radius:99px;padding:6px 13px}
.ic .ic-pill b{color:var(--tx)}
.ic .ic-subnav{display:flex;flex-wrap:wrap;gap:16px;margin-top:30px;padding-top:22px;border-top:1px solid rgb(var(--c-slate2)/.5)}
.ic .ic-subnav a{font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--mu);transition:color .15s}
.ic .ic-subnav a:hover{color:var(--y)}
/* section head */
.ic .ic-head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;border-left:3px solid var(--o);padding-left:14px;margin-bottom:30px}
.ic .ic-head h2{font-size:clamp(20px,3vw,28px);font-weight:900;letter-spacing:-.02em}
.ic .ic-head .m{font-family:var(--font-mono);font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--mu);text-align:right}
.ic .ic-note{font-size:12.5px;color:var(--mu);margin-top:16px;line-height:1.5;max-width:80ch}
.ic .alert{color:var(--al)}
.ic .ic-intro{font-size:14.5px;color:var(--mu);max-width:72ch;line-height:1.6;margin-bottom:28px}
.ic .ic-intro b{color:var(--tx)}
/* metrics */
.ic .ic-metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--ln);border:1px solid var(--ln)}
.ic .ic-metric{background:var(--bg);padding:24px 20px}
.ic .ic-metric .mv{font-size:clamp(24px,3.6vw,38px);font-weight:900;letter-spacing:-.03em;line-height:1;color:var(--y);text-shadow:0 0 24px rgb(var(--c-ozone)/.3);font-variant-numeric:tabular-nums}
.ic .ic-metric .ml{font-family:var(--font-mono);font-size:10.5px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--mu);margin-top:12px}
.ic .ic-metric .mf{margin-top:10px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;display:inline-block;padding:2px 6px;border-radius:2px}
.ic .mf.unv{color:var(--al);border:1px solid var(--al)}
.ic .mf.live{color:var(--y);border:1px solid var(--y)}
/* valuation */
.ic .ic-stages{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.ic .ic-stage{background:hsl(var(--card));border:1px solid var(--ln);border-radius:2px;padding:32px 28px}
.ic .ic-stage .no{font-family:var(--font-mono);font-size:12px;font-weight:800;letter-spacing:.2em;color:var(--o)}
.ic .ic-stage .no.orange{color:var(--o)}
.ic .ic-stage h3{font-size:21px;font-weight:900;letter-spacing:-.02em;margin:10px 0 4px}
.ic .ic-stage p{font-size:13.5px;color:var(--mu);line-height:1.55}
.ic .ic-stage .band{font-size:clamp(26px,4vw,40px);font-weight:900;letter-spacing:-.03em;color:var(--y);text-shadow:0 0 24px rgb(var(--c-ozone)/.35);margin:14px 0}
.ic .ic-stage .band.orange{color:var(--o);text-shadow:0 0 24px rgb(var(--c-flare)/.35)}
.ic .tags{list-style:none;margin:16px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:7px}
.ic .tags li{font-family:var(--font-mono);font-size:11px;font-weight:600;color:var(--mu);border:1px solid rgb(var(--c-slate2)/.6);border-radius:2px;padding:5px 9px}
.ic .rates{margin-top:18px;border-top:1px solid rgb(var(--c-slate2)/.6)}
.ic .rate{display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px solid rgb(var(--c-slate2)/.6);font-size:13px}
.ic .rate span:first-child{color:var(--mu)}
.ic .rate span:last-child{font-weight:700;font-variant-numeric:tabular-nums}
.ic .prem{list-style:none;margin:14px 0 0;padding:0}
.ic .prem li{font-size:13.5px;color:var(--tx);padding:11px 0 11px 20px;border-bottom:1px solid rgb(var(--c-slate2)/.5);position:relative}
.ic .prem li::before{content:"";position:absolute;left:0;top:16px;width:8px;height:8px;background:var(--y);box-shadow:0 0 12px rgb(var(--c-ozone)/.5)}
.ic .prem li small{display:block;color:var(--mu);font-weight:500;margin-top:3px;font-size:11.5px}
.ic .ic-eff{margin-top:20px;border:1px solid rgb(var(--c-ozone)/.28);border-radius:2px;padding:24px 26px;display:grid;grid-template-columns:1fr auto 1fr;gap:20px;align-items:center;background:rgb(var(--c-ozone)/.04)}
.ic .ic-eff .l{font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--mu)}
.ic .ic-eff .v{font-size:clamp(20px,3.2vw,32px);font-weight:900;letter-spacing:-.02em;margin-top:6px}
.ic .ic-eff .col.b .v{color:var(--y);text-shadow:0 0 24px rgb(var(--c-ozone)/.35)}
.ic .ic-eff small{display:block;font-size:11px;color:var(--mu);margin-top:6px;font-weight:500}
.ic .ic-eff small b{color:var(--tx)}
.ic .ic-eff .arrow{font-size:32px;color:var(--o)}
.ic .ic-result{text-align:center;margin-top:28px}
.ic .ic-result .big{font-size:clamp(30px,5.4vw,56px);font-weight:900;letter-spacing:-.03em;color:var(--y);text-shadow:0 0 24px rgb(var(--c-ozone)/.35);margin-top:10px}
.ic .ic-result p{font-size:13.5px;color:var(--mu);margin:8px auto 0;max-width:60ch}
/* agency */
.ic .ic-caps{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px}
.ic .ic-cap{background:hsl(var(--card));border:1px solid rgb(var(--c-slate2)/.7);border-radius:2px;padding:22px 20px}
.ic .ic-cap .cn{font-family:var(--font-mono);font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--o)}
.ic .ic-cap h4{font-size:16px;font-weight:800;margin:10px 0 8px;letter-spacing:-.01em}
.ic .ic-cap p{font-size:12.5px;color:var(--mu);line-height:1.5}
.ic .ic-cap ul{list-style:none;margin-top:12px;padding:0}
.ic .ic-cap ul li{font-size:12px;color:var(--mu);padding:6px 0 6px 16px;position:relative;border-top:1px solid rgb(var(--c-slate2)/.5)}
.ic .ic-cap ul li::before{content:"›";position:absolute;left:0;color:var(--y);font-weight:800}
.ic .ic-roll{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.ic .ic-phase{border:1px solid var(--ln);border-radius:2px;padding:24px 24px}
.ic .ic-phase.p1{background:rgb(var(--c-ozone)/.03)}
.ic .ic-phase.p2{background:rgb(var(--c-flare)/.03)}
.ic .ic-phase .tag{font-family:var(--font-mono);font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--mu)}
.ic .ic-phase h4{font-size:18px;font-weight:900;letter-spacing:-.02em;margin:8px 0 12px}
.ic .ic-phase p{font-size:13px;color:var(--mu);line-height:1.55}
.ic .ic-phase .gate{margin-top:16px;font-size:11.5px;font-weight:700;color:var(--y);letter-spacing:.04em}
/* ecosystem */
.ic .ic-eco{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--ln);border:1px solid var(--ln)}
.ic .ic-node{background:var(--bg);padding:18px 16px;min-height:108px;display:flex;flex-direction:column;transition:background .15s}
.ic .ic-node:hover{background:hsl(var(--card))}
.ic .ic-node .en{font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:.1em;color:var(--mu)}
.ic .ic-node .nn{font-size:15px;font-weight:800;letter-spacing:-.01em;margin:8px 0 auto;line-height:1.15}
.ic .ic-node .nd{font-size:11px;color:var(--mu);line-height:1.35}
.ic .ic-node.core{background:rgb(var(--c-ozone)/.05)}
.ic .ic-node.core .nn{color:var(--y)}
/* capital */
.ic .ic-paths{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.ic .ic-path{background:hsl(var(--card));border:1px solid var(--ln);border-radius:2px;padding:26px 26px;display:flex;flex-direction:column;transition:border-color .15s}
.ic .ic-path:hover{border-color:rgb(var(--c-ozone)/.4)}
.ic .ic-path .ph{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.ic .ic-path h4{font-size:18px;font-weight:900;letter-spacing:-.02em}
.ic .ic-path .chip{font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--o);border:1px solid rgb(var(--c-flare)/.4);border-radius:2px;padding:3px 7px;white-space:nowrap}
.ic .ic-path .chip.live{color:var(--y);border-color:rgb(var(--c-ozone)/.4)}
.ic .ic-path .ang{font-size:11.5px;color:var(--mu);font-weight:600;margin:14px 0 4px}
.ic .ic-path p{font-size:13px;color:var(--mu);line-height:1.55;margin:0}
.ic .ic-path .tg{font-size:12.5px;color:var(--tx);font-weight:600;line-height:1.5;margin-bottom:auto}
.ic .ic-path .lead{margin-top:20px;align-self:flex-start;font-size:12.5px;font-weight:700;color:var(--o);border:1px solid rgb(var(--c-flare)/.45);border-radius:99px;padding:8px 15px;transition:transform .12s}
.ic .ic-path .lead:hover{transform:translateX(3px)}
/* portals */
.ic .ic-portals{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.ic .ic-portal{border:1px solid var(--ln);border-radius:2px;padding:24px 22px;display:flex;flex-direction:column;gap:10px;transition:background .15s,border-color .15s}
.ic .ic-portal:hover{background:hsl(var(--card));border-color:rgb(var(--c-ozone)/.35)}
.ic .ic-portal .pk{font-family:var(--font-mono);font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--o)}
.ic .ic-portal h4{font-size:17px;font-weight:800;letter-spacing:-.01em}
.ic .ic-portal p{font-size:12.5px;color:var(--mu);line-height:1.5}
.ic .ic-portal .go{margin-top:6px;font-size:12px;font-weight:700;color:var(--y)}
/* disclaimer + footer */
.ic .ic-disc-wrap{padding-top:20px}
.ic .ic-disc{border:1px solid rgb(var(--c-slate2)/.9);background:hsl(var(--card));border-radius:2px;padding:26px 28px}
.ic .ic-disc h3{font-family:var(--font-mono);font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--al);margin-bottom:14px}
.ic .ic-disc ul{list-style:none;display:flex;flex-direction:column;gap:11px;padding:0;margin:0}
.ic .ic-disc li{font-size:13px;color:var(--mu);line-height:1.55;padding-left:20px;position:relative}
.ic .ic-disc li::before{content:"!";position:absolute;left:0;font-weight:800;color:var(--al)}
.ic .ic-disc li b{color:var(--tx)}
.ic .ic-foot{display:flex;flex-wrap:wrap;gap:24px;justify-content:space-between;margin-top:36px;padding-top:28px;border-top:1px solid var(--ln)}
.ic .ic-foot .fb{font-weight:900;font-size:22px;letter-spacing:-.02em}
.ic .ic-foot .fb span{color:var(--o)}
.ic .ic-foot p{font-size:12px;color:var(--mu);line-height:1.7;margin-top:10px;font-weight:500}
.ic .ic-foot .right{text-align:right}
.ic .ic-foot .cls{font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--al);border:1px solid var(--al);border-radius:2px;padding:6px 10px;display:inline-block}
@media(max-width:860px){.ic .ic-metrics{grid-template-columns:repeat(2,1fr)}.ic .ic-stages,.ic .ic-roll,.ic .ic-paths{grid-template-columns:1fr}.ic .ic-caps,.ic .ic-eco,.ic .ic-portals{grid-template-columns:repeat(2,1fr)}.ic .ic-eff{grid-template-columns:1fr}.ic .ic-eff .arrow{transform:rotate(90deg);justify-self:center}.ic .ic-head .m{display:none}}
@media(prefers-reduced-motion:reduce){.ic *{transition:none!important}}
`;
