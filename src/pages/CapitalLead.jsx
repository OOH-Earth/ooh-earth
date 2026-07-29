import { useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import Nav from "@/components/ooh/Nav";
import { CAPITAL_LEADS, CAPITAL_ORDER } from "@/components/ooh/capitalLeads";

/* ────────────────────────────────────────────────────────────
   OOH Earth · Capital Lead Page (/capital/:slug)
   Funder-facing landing tuned to one investor class. Themed off
   the app channel tokens so it inherits dark · light · matrix.
──────────────────────────────────────────────────────────── */

const TRACTION = [
  ["~2,000", "Waitlist", true],
  ["~47", "Ambassadors", true],
  ["~12,000", "Documented (beta)", true],
  ["14", "Ecosystem entities", false],
];

const SDG = ["SDG 11.7", "SDG 12.8", "SDG 16.7", "SDG 17", "A/69/286"];

export default function CapitalLead() {
  const { slug } = useParams();
  const lead = CAPITAL_LEADS[slug];

  useEffect(() => {
    if (lead) window.scrollTo({ top: 0, behavior: "auto" });
  }, [slug, lead]);

  if (!lead) return <Navigate to="/console" replace />;

  const others = CAPITAL_ORDER.filter((s) => s !== slug).map((s) => CAPITAL_LEADS[s]);

  return (
    <>
      <Nav />
      <div className="cl">
        <style>{css}</style>

        {/* HERO */}
        <header className="cl-hero cl-wrap">
          <div className="cl-eye"><span className="cl-tick" />Capital pathway · {lead.tag}</div>
          <h1>{lead.name}</h1>
          <p className="cl-sub">{lead.sub}</p>

          <div className="cl-askrow">
            <div className="cl-ask big"><div className="l">The ask</div><div className="v"><span className="cur">£</span>150k–500k+</div><div className="s">{lead.instrument} · impact &amp; replacement-cost anchored</div></div>
            <div className="cl-ask"><div className="l">Replacement floor</div><div className="v"><span className="cur">£</span>70k–150k</div><div className="s">In-kind build value</div></div>
            <div className="cl-ask"><div className="l">Actual outlay</div><div className="v">low £ thousands</div><div className="s">Capital-efficiency story</div></div>
          </div>
          <div className="cl-sdg">{SDG.map((s) => <span key={s}>{s}</span>)}</div>
        </header>

        {/* WHY THIS FITS YOU */}
        <section className="cl-wrap">
          <div className="cl-head"><h2>Why this fits you</h2><span className="m">The angle for {lead.tag.toLowerCase()}</span></div>
          <ul className="cl-angle">
            {lead.angle.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
          <p className="cl-targets"><b>Typical funders:</b> {lead.targets}</p>
        </section>

        {/* WHAT CAPITAL UNLOCKS */}
        <section className="cl-wrap">
          <div className="cl-head"><h2>What your capital unlocks</h2><span className="m">Use of funds</span></div>
          <div className="cl-unlocks">
            {lead.unlocks.map((u, i) => (
              <div className="cl-unlock" key={i}>
                <div className="n">{String(i + 1).padStart(2, "0")}</div>
                <h4>{u.h}</h4><p>{u.p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* EVIDENCE / TRACTION */}
        <section className="cl-wrap">
          <div className="cl-head"><h2>The evidence base</h2><span className="m">Self-reported · diligence-ready</span></div>
          <div className="cl-trac">
            {TRACTION.map(([v, l, verify]) => (
              <div className="cl-metric" key={l}>
                <div className="mv">{v}</div><div className="ml">{l}</div>
                <span className={`mf ${verify ? "unv" : "live"}`}>{verify ? "Verify" : "Live"}</span>
              </div>
            ))}
          </div>
          <p className="cl-note">Figures marked <b className="alert">Verify</b> originated in launch/demo context and resolve to live platform counts on diligence. The two-stage frame — £70k–150k replacement-cost floor plus a traction/movement premium — sets the £150k–500k+ ask on impact and in-kind value, not equity multiples.</p>
        </section>

        {/* CTA */}
        <section className="cl-wrap cl-cta-wrap">
          <div className="cl-cta">
            <div>
              <div className="cl-eye"><span className="cl-tick" />Next step</div>
              <h3>Open the data room conversation.</h3>
              <p>We'll share the live console, verified metrics, and a build-cost letter tuned to a {lead.instrument.toLowerCase()}.</p>
            </div>
            <div className="cl-cta-actions">
              <a className="btn primary" href={`mailto:hello@outofhell.org?subject=${encodeURIComponent("OOH Earth — " + lead.tag)}`}>Contact — hello@outofhell.org</a>
              <Link className="btn ghost" to="/console">Open investor console →</Link>
            </div>
          </div>

          {/* other pathways */}
          <div className="cl-others">
            <div className="cl-eye small"><span className="cl-tick" />Other capital pathways</div>
            <div className="cl-other-grid">
              {others.map((o) => (
                <Link className="cl-other" to={`/capital/${o.slug}`} key={o.slug}>
                  <span className="ot">{o.tag}</span>
                  <span className="oh">{o.name}</span>
                  <span className="og">Open →</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="cl-foot">
            <div><div className="fb">ooh<span>.</span>earth</div><p>Capital pathway · {lead.tag}<br/>Community-funded · zero VC · copyleft<br/>hello@outofhell.org</p></div>
            <div className="right"><span className="cls">Not investment or valuation advice</span><p>Framing tool · figures verified on diligence<br/>Instrument: {lead.instrument}</p></div>
          </div>
        </section>
      </div>
    </>
  );
}

const css = `
.cl{--y:rgb(var(--c-ozone));--o:rgb(var(--c-flare));--bg:rgb(var(--c-void));--tx:rgb(var(--c-silver));--ln:rgb(var(--c-slate2));--mu:rgb(var(--c-dim));--al:hsl(var(--destructive));
  background:var(--bg);color:var(--tx);font-family:var(--font-display);min-height:100vh;
  background-image:linear-gradient(rgb(var(--c-slate2)/.28) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--c-slate2)/.28) 1px,transparent 1px);background-size:44px 44px;padding-bottom:80px}
.cl *{box-sizing:border-box}
.cl .cl-wrap{max-width:960px;margin:0 auto;padding:0 22px}
.cl section{padding:52px 0}
.cl .cl-eye{font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:var(--y);display:flex;align-items:center;gap:10px}
.cl .cl-eye.small{font-size:10px}
.cl .cl-tick{display:inline-block;width:22px;height:7px;background:var(--o);box-shadow:0 0 20px rgb(var(--c-flare)/.5)}
.cl .cur{color:var(--o)}
.cl .alert{color:var(--al)}
/* hero */
.cl .cl-hero{padding:118px 22px 44px}
.cl h1{font-size:clamp(30px,5.4vw,58px);font-weight:900;letter-spacing:-.03em;line-height:.98;margin:18px 0 0;max-width:18ch}
.cl .cl-sub{margin-top:20px;font-size:clamp(15px,1.9vw,18px);font-weight:500;color:var(--mu);max-width:64ch;line-height:1.55}
.cl .cl-askrow{display:flex;flex-wrap:wrap;gap:14px 36px;align-items:flex-end;margin-top:32px;padding-top:26px;border-top:1px solid var(--ln)}
.cl .cl-ask .l{font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--mu)}
.cl .cl-ask .v{font-size:clamp(26px,4.6vw,44px);font-weight:900;letter-spacing:-.03em;line-height:1;margin-top:8px}
.cl .cl-ask.big .v{color:var(--y);text-shadow:0 0 24px rgb(var(--c-ozone)/.35)}
.cl .cl-ask .s{font-size:12px;color:var(--mu);margin-top:8px;font-weight:500}
.cl .cl-sdg{display:flex;flex-wrap:wrap;gap:7px;margin-top:24px}
.cl .cl-sdg span{font-family:var(--font-mono);font-size:10px;font-weight:600;letter-spacing:.1em;color:var(--mu);border:1px solid var(--ln);border-radius:99px;padding:5px 11px}
/* section head */
.cl .cl-head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;border-left:3px solid var(--o);padding-left:14px;margin-bottom:26px}
.cl .cl-head h2{font-size:clamp(19px,3vw,26px);font-weight:900;letter-spacing:-.02em}
.cl .cl-head .m{font-family:var(--font-mono);font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--mu);text-align:right}
/* angle */
.cl .cl-angle{list-style:none;margin:0;padding:0}
.cl .cl-angle li{font-size:15px;color:var(--tx);line-height:1.5;padding:16px 0 16px 26px;border-bottom:1px solid rgb(var(--c-slate2)/.5);position:relative}
.cl .cl-angle li::before{content:"";position:absolute;left:0;top:22px;width:9px;height:9px;background:var(--y);box-shadow:0 0 12px rgb(var(--c-ozone)/.5)}
.cl .cl-targets{margin-top:18px;font-size:13px;color:var(--mu);line-height:1.5}
.cl .cl-targets b{color:var(--tx);font-weight:700}
/* unlocks */
.cl .cl-unlocks{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.cl .cl-unlock{background:hsl(var(--card));border:1px solid var(--ln);border-radius:2px;padding:24px 22px}
.cl .cl-unlock .n{font-family:var(--font-mono);font-size:12px;font-weight:800;letter-spacing:.2em;color:var(--o)}
.cl .cl-unlock h4{font-size:16px;font-weight:800;margin:10px 0 8px;letter-spacing:-.01em}
.cl .cl-unlock p{font-size:12.5px;color:var(--mu);line-height:1.5}
/* traction */
.cl .cl-trac{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--ln);border:1px solid var(--ln)}
.cl .cl-metric{background:var(--bg);padding:22px 18px}
.cl .cl-metric .mv{font-size:clamp(22px,3.4vw,34px);font-weight:900;letter-spacing:-.03em;line-height:1;color:var(--y);text-shadow:0 0 24px rgb(var(--c-ozone)/.3);font-variant-numeric:tabular-nums}
.cl .cl-metric .ml{font-family:var(--font-mono);font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--mu);margin-top:10px}
.cl .cl-metric .mf{margin-top:9px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;display:inline-block;padding:2px 6px;border-radius:2px}
.cl .mf.unv{color:var(--al);border:1px solid var(--al)}
.cl .mf.live{color:var(--y);border:1px solid var(--y)}
.cl .cl-note{font-size:12.5px;color:var(--mu);margin-top:16px;line-height:1.55;max-width:82ch}
.cl .cl-note b{color:var(--tx)}
/* cta */
.cl .cl-cta-wrap{padding-top:12px}
.cl .cl-cta{border:1px solid rgb(var(--c-ozone)/.3);background:rgb(var(--c-ozone)/.04);border-radius:2px;padding:32px 30px;display:flex;flex-wrap:wrap;gap:24px;justify-content:space-between;align-items:center}
.cl .cl-cta h3{font-size:clamp(20px,3vw,28px);font-weight:900;letter-spacing:-.02em;margin:12px 0 8px}
.cl .cl-cta p{font-size:13.5px;color:var(--mu);line-height:1.5;max-width:46ch}
.cl .cl-cta-actions{display:flex;flex-direction:column;gap:10px;min-width:240px}
.cl .btn{font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:12px 18px;border-radius:2px;text-align:center;transition:transform .12s,background .15s}
.cl .btn.primary{background:var(--y);color:#000;box-shadow:0 0 24px rgb(var(--c-ozone)/.3)}
.cl .btn.primary:hover{background:var(--o);color:#000}
.cl .btn.ghost{border:1px solid var(--ln);color:var(--tx)}
.cl .btn.ghost:hover{border-color:var(--y);color:var(--y)}
/* other pathways */
.cl .cl-others{margin-top:40px}
.cl .cl-other-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}
.cl .cl-other{display:flex;flex-direction:column;gap:6px;border:1px solid var(--ln);border-radius:2px;padding:18px 18px;transition:border-color .15s,background .15s}
.cl .cl-other:hover{border-color:rgb(var(--c-ozone)/.4);background:hsl(var(--card))}
.cl .cl-other .ot{font-family:var(--font-mono);font-size:9.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--o)}
.cl .cl-other .oh{font-size:14px;font-weight:800;letter-spacing:-.01em;line-height:1.15}
.cl .cl-other .og{font-size:11px;font-weight:700;color:var(--y);margin-top:auto}
/* footer */
.cl .cl-foot{display:flex;flex-wrap:wrap;gap:24px;justify-content:space-between;margin-top:44px;padding-top:26px;border-top:1px solid var(--ln)}
.cl .cl-foot .fb{font-weight:900;font-size:22px;letter-spacing:-.02em}
.cl .cl-foot .fb span{color:var(--o)}
.cl .cl-foot p{font-size:12px;color:var(--mu);line-height:1.7;margin-top:10px;font-weight:500}
.cl .cl-foot .right{text-align:right}
.cl .cl-foot .cls{font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--al);border:1px solid var(--al);border-radius:2px;padding:6px 10px;display:inline-block}
@media(max-width:820px){.cl .cl-unlocks,.cl .cl-trac,.cl .cl-other-grid{grid-template-columns:repeat(2,1fr)}.cl .cl-head .m{display:none}.cl .cl-cta-actions{min-width:100%}}
@media(prefers-reduced-motion:reduce){.cl *{transition:none!important}}
`;
