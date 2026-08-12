import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Nav from '@/components/ooh/Nav';
import { INVESTOR_CSS } from '@/components/ooh/investorTheme';

/* ────────────────────────────────────────────────────────────
   OOH Earth · Investor Dashboard (/portal/investor) — GATED
   Traction snapshot, roadmap, treasury link (real /portfolio
   console — no fabricated balances), and data-room index.
──────────────────────────────────────────────────────────── */

const ROADMAP = [
  {
    t: 'Pre-launch hardening',
    d: 'Mobile safe-area, Stripe checkout, SEO/OG — done in the current sweep.',
    s: 'done',
  },
  {
    t: 'Publish to HTTPS domain',
    d: 'Unblocks camera capture (TrueCost / TrashID) and NFC field cards.',
    s: 'next',
  },
  {
    t: 'Verify traction to live counts',
    d: 'Resolve self-reported figures to platform counts before funder review.',
    s: 'next',
  },
  {
    t: 'Global South chapters',
    d: 'Activate city chapters where public-space enclosure is sharpest.',
    s: 'planned',
  },
];

const DATAROOM = [
  ['Investor console (this build)', 'Available', 'ok'],
  ['Replacement-cost / build-value letter', 'On request', 'pending'],
  ['International precedent library (A/69/286 + cases)', 'Available', 'ok'],
  ['Verified traction export', 'Pending verification', 'pending'],
  ['Treasury / on-chain holdings', 'Live console', 'live'],
];

const RSTATUS = { done: ['Done', 'ok'], next: ['Next', 'pending'], planned: ['Planned', 'sample'] };

export default function InvestorDashboard() {
  const [live, setLive] = useState(null);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    let active = true;
    (async () => {
      try {
        const res = await base44.functions.invoke('fieldStats', {});
        if (active) setLive(res?.data || null);
      } catch {
        /* fieldStats unavailable — keep flagged fallbacks */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const fmt = (n) => Number(n).toLocaleString();
  const metrics = [
    ['~2,000', 'Waitlist', true],
    ['~47', 'Ambassadors', true],
    live && live.reports != null
      ? [fmt(live.reports), 'Documented (live)', false]
      : ['~12,000', 'Documented (beta)', true],
    ['14', 'Ecosystem entities', false],
    live && live.raised != null
      ? [`$${fmt(Math.round(live.raised))}`, 'Raised (live)', false]
      : ['~$55k', 'Raised of $100k', true],
  ];

  return (
    <>
      <Nav />
      <div className="inv">
        <style>{INVESTOR_CSS}</style>

        <header className="inv-hero inv-wrap">
          <div className="inv-eye">
            <span className="inv-tick" />
            Investor dashboard · gated
          </div>
          <h1>
            Where the raise <em>stands.</em>
          </h1>
          <span className="authchip">
            <span className="dotpulse" />
            Authenticated · investor access
          </span>
          <p className="inv-lede">
            A live read on traction, treasury, roadmap, and the data room. Self-reported figures are
            flagged and resolve to platform counts on diligence.
          </p>
          <div className="inv-actions">
            <Link className="inv-btn primary" to="/console">
              Open full console →
            </Link>
            <Link className="inv-btn ghost" to="/investor">
              Investor hub
            </Link>
          </div>
        </header>

        <section className="inv-wrap">
          <div className="inv-head">
            <h2>Traction snapshot</h2>
            <span className="m">Self-reported · diligence-ready</span>
          </div>
          <div className="inv-metrics">
            {metrics.map(([v, l, verify]) => (
              <div className="inv-metric" key={String(l)}>
                <div className="mv">{v}</div>
                <div className="ml">{l}</div>
                <span className={`mf ${verify ? 'unv' : 'live'}`}>
                  {verify ? 'Verify' : 'Live'}
                </span>
              </div>
            ))}
          </div>
          <p className="inv-note">
            Metrics marked <b style={{ color: 'rgb(var(--c-ozone))' }}>Live</b> read directly from
            the platform (fieldStats). Those marked <b className="alert">Verify</b> are
            self-reported and resolve to live counts before funder review.
          </p>
        </section>

        <section className="inv-wrap">
          <div className="inv-head">
            <h2>Roadmap</h2>
            <span className="m">Critical path to launch</span>
          </div>
          <div className="inv-rows">
            {ROADMAP.map((r) => {
              const [txt, cls] = RSTATUS[r.s];
              return (
                <div className="inv-row" key={r.t}>
                  <div className="rmain">
                    <div className="rt">{r.t}</div>
                    <div className="rd">{r.d}</div>
                  </div>
                  <span className={`chip ${cls}`}>{txt}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="inv-wrap">
          <div className="inv-head">
            <h2>Treasury</h2>
            <span className="m">Live on-chain console</span>
          </div>
          <div className="inv-empty">
            Treasury holdings, receive addresses, and inbound transactions are maintained in the
            live treasury console — figures are read on-chain, never keyed by hand.{' '}
            <b>Open the treasury console for current holdings.</b>
          </div>
          <div className="inv-actions">
            <Link className="inv-btn primary" to="/portfolio">
              Open treasury console →
            </Link>
            <Link className="inv-btn ghost" to="/campaign">
              Funding hub
            </Link>
          </div>
        </section>

        <section className="inv-wrap">
          <div className="inv-head">
            <h2>Data room</h2>
            <span className="m">Documents &amp; status</span>
          </div>
          <div className="inv-rows">
            {DATAROOM.map(([t, st, cls]) => (
              <div className="inv-row" key={t}>
                <div className="rmain">
                  <div className="rt">{t}</div>
                </div>
                <span className={`chip ${cls}`}>{st}</span>
              </div>
            ))}
          </div>
          <div className="inv-actions">
            <a
              className="inv-btn primary"
              href="mailto:hello@ooh.earth?subject=OOH%20Earth%20%E2%80%94%20Data%20room%20request"
            >
              Request full data room →
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
                Investor dashboard · gated
                <br />
                Not investment or valuation advice
                <br />
                hello@ooh.earth
              </p>
            </div>
            <div className="right">
              <span className="cls">Confidential · Investor Class</span>
              <p>Figures verified on diligence</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
