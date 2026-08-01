import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Nav from "@/components/ooh/Nav";
import { INVESTOR_CSS } from "@/components/ooh/investorTheme";
import { clearInvestorSession, hasInvestorToken } from "@/components/ooh/investorAccess";
import { MOVEMENT, MOVEMENT_ANCHORS, PLATFORM_STATUS, fmtK } from "@/components/ooh/movementEstimate";

/* ────────────────────────────────────────────────────────────
   OOH Earth · Investor Hub (/investor) — GATED (ProtectedRoute)
   The logged-in landing for the Capital · Investor area. Indexes
   the console, portals, capital pathways, and references.
──────────────────────────────────────────────────────────── */

const PRIMARY = [
  { k: "Pitch", h: "Investor Console", p: "The full case: two-stage valuation, live-ops traction, agency studio, ecosystem, capital pathways.", to: "/console", gated: true },
  { k: "Dashboard", h: "Investor Dashboard", p: "Live traction snapshot, treasury console, roadmap, and the data-room index.", to: "/portal/investor", gated: true },
  { k: "Dashboard", h: "Client Portal", p: "Agency clients & chapters: active briefs, live campaigns, deliverables, evidence.", to: "/portal/client", gated: true },
];

const PATHWAYS = [
  { h: "Impact Grants", p: "SDG-anchored civic infrastructure for grant panels.", to: "/capital/impact-grants" },
  { h: "Philanthropic", p: "In-kind assets built; capital compounds reach.", to: "/capital/philanthropic" },
  { h: "Retro Public Goods", p: "Open, copyleft, on-chain-native infrastructure.", to: "/capital/retro-pgf" },
  { h: "Civic-Tech", p: "A working PWA as a flagship case study.", to: "/capital/civic-tech" },
];

export default function InvestorHub() {
  const navigate = useNavigate();
  const preview = hasInvestorToken();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, []);
  const exitPreview = () => { clearInvestorSession(); navigate("/investor-access", { replace: true }); };

  return (
    <>
      <Nav />
      <div className="inv">
        <style>{INVESTOR_CSS}</style>

        <header className="inv-hero inv-wrap">
          <div className="inv-eye"><span className="inv-tick" />Investor area · gated</div>
          <h1>Welcome to the <em>investor area.</em></h1>
          <span className="authchip"><span className="dotpulse" />Authenticated · investor access</span>
          <p className="inv-lede">Everything a funder needs in one place — the console, the live dashboards, the capital pathways, and the references. Confidential; for the investor class only.</p>

          <div className="inv-ask">
            <div className="b big"><div className="l">Pre-seed-equivalent ask</div><div className="v"><span className="cur">£</span>150k–500k+</div><div className="s">Grant / philanthropic · impact &amp; replacement-cost anchored</div></div>
            <div className="b"><div className="l">Replacement floor</div><div className="v"><span className="cur">£</span>70k–150k</div><div className="s">In-kind build value</div></div>
            <div className="b"><div className="l">Actual outlay</div><div className="v">low £ thousands</div><div className="s">Capital-efficiency story</div></div>
          </div>
        </header>

        <section className="inv-wrap">
          <div className="inv-head"><h2>Not starting from zero</h2><span className="m">The movement we&rsquo;re joining</span></div>
          <p className="inv-lede">OOH Earth is a day-one platform — early access, seeking founding backers. The resistance we&rsquo;re built to unify is not new: organised subvertising has reclaimed public space since {MOVEMENT.since}. The figures below are conservative movement-wide estimates (est.), not our platform metrics.</p>

          <div className="inv-metrics" style={{ marginTop: 24 }}>
            <div className="inv-metric"><div className="mv">~{fmtK(MOVEMENT.interventions)}+</div><div className="ml">Interventions</div><span className="mf" style={{ color: 'rgb(var(--c-flare))', border: '1px solid rgb(var(--c-flare))' }}>EST</span></div>
            <div className="inv-metric"><div className="mv">~{fmtK(MOVEMENT.subvertisers)}+</div><div className="ml">Subverters</div><span className="mf" style={{ color: 'rgb(var(--c-flare))', border: '1px solid rgb(var(--c-flare))' }}>EST</span></div>
            <div className="inv-metric"><div className="mv">{MOVEMENT.collectives}+</div><div className="ml">Collectives</div><span className="mf" style={{ color: 'rgb(var(--c-flare))', border: '1px solid rgb(var(--c-flare))' }}>EST</span></div>
            <div className="inv-metric"><div className="mv">{MOVEMENT.countries}+</div><div className="ml">Countries</div><span className="mf" style={{ color: 'rgb(var(--c-flare))', border: '1px solid rgb(var(--c-flare))' }}>EST</span></div>
            <div className="inv-metric"><div className="mv">{MOVEMENT.years}</div><div className="ml">Years active</div><span className="mf" style={{ color: 'rgb(var(--c-silver))', border: '1px solid rgb(var(--c-slate2))' }}>SINCE {MOVEMENT.since}</span></div>
          </div>

          <div className="inv-rows" style={{ marginTop: 20 }}>
            {MOVEMENT_ANCHORS.map((a, i) => (
              <div className="inv-row" key={i}>
                <span className="chip pending">{a.year}</span>
                <div className="rmain"><div className="rt">{a.text}</div><div className="rd">Source: {a.source}</div></div>
              </div>
            ))}
          </div>

          <p className="inv-note"><b>OOH Earth · {PLATFORM_STATUS}.</b> Movement figures are order-of-magnitude estimates of the wider subvertising movement (Brandalism, Subvertisers International, Adfree Cities, Les Déboulonneurs, Adbusters, independents) — sourced, and distinct from our own live, audited platform counts.</p>
        </section>

        <section className="inv-wrap">
          <div className="inv-head"><h2>Jump in</h2><span className="m">Gated · investor materials</span></div>
          <div className="inv-grid">
            {PRIMARY.map((c) => (
              <Link className="inv-card" to={c.to} key={c.to}>
                {c.gated && <span className="lock">🔒 Gated</span>}
                <span className="k">{c.k}</span>
                <h4>{c.h}</h4><p>{c.p}</p>
                <span className="go">Open →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="inv-wrap">
          <div className="inv-head"><h2>Capital pathways</h2><span className="m">Public lead pages · share freely</span></div>
          <div className="inv-grid">
            {PATHWAYS.map((c) => (
              <Link className="inv-card" to={c.to} key={c.to}>
                <span className="k">Lead page</span>
                <h4>{c.h}</h4><p>{c.p}</p>
                <span className="go">Open →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="inv-wrap">
          <div className="inv-head"><h2>References</h2><span className="m">Brand · data room · map</span></div>
          <div className="inv-grid">
            <Link className="inv-card" to="/kit"><span className="k">Reference</span><h4>Brand guide</h4><p>Orbital Perspective — palette, Inter Tight, reticle signature, UI kit.</p><span className="go">Open →</span></Link>
            <a className="inv-card" href="mailto:hello@outofhell.org?subject=OOH%20Earth%20%E2%80%94%20Data%20room%20access"><span className="k">Data room</span><h4>Request access</h4><p>Verified metrics, build-cost letter, and precedent library on request.</p><span className="go">Email →</span></a>
            <Link className="inv-card" to="/sitemap"><span className="k">Reference</span><h4>Site map</h4><p>Every route, audience, and onward flow — the whole-platform review artifact.</p><span className="go">Open →</span></Link>
          </div>

          <p className="inv-note"><b>Integrity:</b> this area is a positioning &amp; framing tool, not investment or valuation advice. Traction figures are self-reported and resolve to live platform counts on diligence; the £150k–500k+ ask is anchored on impact and replacement cost, not equity multiples.</p>
        </section>

        <section className="inv-wrap" style={{ paddingTop: 0 }}>
          <div className="inv-foot">
            <div><div className="fb">ooh<span>.</span>earth</div><p>Investor area · gated<br/>Community-funded · zero VC · copyleft<br/>hello@outofhell.org</p></div>
            <div className="right"><span className="cls">Confidential · Investor Class</span><p>Access: account or investor code{preview && <><br/><button onClick={exitPreview} style={{ background: "none", border: 0, padding: 0, font: "inherit", color: "inherit", cursor: "pointer", textDecoration: "underline" }}>Exit investor preview →</button></>}</p></div>
          </div>
        </section>
      </div>
    </>
  );
}
