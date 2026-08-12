import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Nav from '@/components/ooh/Nav';
import { INVESTOR_CSS } from '@/components/ooh/investorTheme';

/* ────────────────────────────────────────────────────────────
   OOH Earth · Client Portal (/portal/client) — GATED
   Agency clients & chapters. Scaffold with clearly-labelled
   SAMPLE rows; live data wires in via the n8n ops spine later.
──────────────────────────────────────────────────────────── */

const BRIEFS = [
  {
    t: 'Bangkok — bus-shelter audit',
    d: 'Document the Sukhumvit corridor; evidence-grade capture for a planning objection.',
    s: 'sample',
  },
  {
    t: 'London chapter — replacement campaign',
    d: 'Subvertising set for three reclaimed panels; concept → installed unit.',
    s: 'sample',
  },
];

const CAMPAIGNS = [
  {
    t: 'Take the streets back',
    d: 'Field-report story series across active chapters.',
    s: 'sample',
  },
  {
    t: "This wasn't here last month",
    d: 'Documented-sighting drops with coordinates.',
    s: 'sample',
  },
];

const DELIVERABLES = [
  ['Evidence report (PDF)', 'Sample'],
  ['Objection letter pack', 'Sample'],
  ['Activist asset set (SVG)', 'Sample'],
];

export default function ClientPortal() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <>
      <Nav />
      <div className="inv">
        <style>{INVESTOR_CSS}</style>

        <header className="inv-hero inv-wrap">
          <div className="inv-eye">
            <span className="inv-tick" />
            Client portal · gated
          </div>
          <h1>Your briefs, live.</h1>
          <span className="authchip">
            <span className="dotpulse" />
            Authenticated · client access
          </span>
          <p className="inv-lede">
            The agency-side workspace for clients and city chapters: active briefs, live campaigns,
            deliverables, and the evidence behind them.
          </p>
          <div className="inv-actions">
            <Link className="inv-btn primary" to="/map">
              Open the field atlas →
            </Link>
            <Link className="inv-btn ghost" to="/report">
              File a field report
            </Link>
          </div>
        </header>

        <section className="inv-wrap">
          <div className="inv-head">
            <h2>Active briefs</h2>
            <span className="m">Scaffold · sample data</span>
          </div>
          <div className="inv-rows">
            {BRIEFS.map((r) => (
              <div className="inv-row" key={r.t}>
                <div className="rmain">
                  <div className="rt">{r.t}</div>
                  <div className="rd">{r.d}</div>
                </div>
                <span className="chip sample">Sample</span>
              </div>
            ))}
          </div>
        </section>

        <section className="inv-wrap">
          <div className="inv-head">
            <h2>Live campaigns</h2>
            <span className="m">Scaffold · sample data</span>
          </div>
          <div className="inv-rows">
            {CAMPAIGNS.map((r) => (
              <div className="inv-row" key={r.t}>
                <div className="rmain">
                  <div className="rt">{r.t}</div>
                  <div className="rd">{r.d}</div>
                </div>
                <span className="chip sample">Sample</span>
              </div>
            ))}
          </div>
        </section>

        <section className="inv-wrap">
          <div className="inv-head">
            <h2>Deliverables</h2>
            <span className="m">Scaffold · sample data</span>
          </div>
          <div className="inv-rows">
            {DELIVERABLES.map(([t, st]) => (
              <div className="inv-row" key={t}>
                <div className="rmain">
                  <div className="rt">{t}</div>
                </div>
                <span className="chip sample">{st}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="inv-wrap">
          <div className="inv-head">
            <h2>Evidence</h2>
            <span className="m">Feeds from the platform</span>
          </div>
          <div className="inv-empty">
            Evidence for each brief pulls from the live platform — documented sites, objections, and
            campaign activity.{' '}
            <b>Live client data wires in with the agency ops spine (n8n → Base44)</b>; the rows
            above are a layout scaffold until then.
          </div>
          <div className="inv-actions">
            <Link className="inv-btn primary" to="/map">
              Browse documented sites →
            </Link>
            <a
              className="inv-btn ghost"
              href="mailto:hello@ooh.earth?subject=OOH%20Earth%20%E2%80%94%20Client%20onboarding"
            >
              Onboard a client
            </a>
          </div>
        </section>

        <section className="inv-wrap" style={{ paddingTop: 0 }}>
          <div className="inv-foot">
            <div>
              <div className="fb">
                ooh<span>.</span>earth
              </div>
              <p>
                Client portal · gated
                <br />
                Agency studio · live ops
                <br />
                hello@ooh.earth
              </p>
            </div>
            <div className="right">
              <span className="cls">Client access</span>
              <p>Sample data · live feeds pending</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
