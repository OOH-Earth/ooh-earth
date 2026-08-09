// Journey Map — panels B (city ambassador, supporter, movement partner, roadmap matrix).
// Plain HTML strings injected under the scoped .jm-root wrapper.

export const PANELS_B = {

  ambassador: `
    <div class="jm-phead">
      <div class="jm-badge"><span class="jm-bk tl"></span><span class="jm-bk br"></span>&#127942;</div>
      <div>
        <div class="jm-pname">The City Ambassador</div>
        <span class="jm-ptier">Tier 3 &middot; Coordinator</span>
        <p class="jm-pgoal">Runs a city, not a feed. Needs to see local density, <b>coordinate the members on the ground</b>, run correspondents, and carry credentials that make the movement real off-screen.</p>
        <div class="jm-pfacts"><span>Entry &middot; <b>promoted Field Reporter</b></span><span>Core act &middot; <b>coordinate</b></span><span>Scope &middot; <b>one city</b></span></div>
      </div>
    </div>
    <div class="jm-raillabel">Journey &mdash; command a city</div>
    <div class="jm-rail">
      <div class="jm-stage"><div class="jm-connect"><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">01</span><span class="jm-sname">City command</span></div>
        <div class="jm-screen"><div class="jm-map"></div><span class="jm-sbk tl"></span><span class="jm-sbk tr"></span><span class="jm-pin" style="top:30%;left:30%"></span><span class="jm-pin g" style="top:44%;left:52%"></span><span class="jm-pin y" style="top:38%;left:68%"></span><span class="jm-pin" style="top:62%;left:44%"></span><span class="jm-pin g" style="top:70%;left:66%"></span><span class="jm-lbl" style="bottom:8px;left:8px;color:var(--jm-flare)">density &middot; per 10k</span></div>
        <div class="jm-desc">A city-scoped view: density overlaid on population, hotspots ranked. Needs <b>OSM/Overpass billboard data + city stats</b> to move from counts to rates.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>Live map<span class="st">LIVE</span></div><div class="jm-feat planned"><span class="d"></span>City stats (OSM)<span class="st">PLANNED</span></div></div>
        <div class="jm-friction"><b>Gap:</b> Overpass ingest is the unlock here.</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">02</span><span class="jm-sname">Coordinate members</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk br"></span><div class="jm-row"><span class="jm-sq"></span><div class="jm-col"><div class="jm-bar jm-w70"></div></div><span class="jm-bar accent" style="width:22px"></span></div><div class="jm-row"><span class="jm-sq"></span><div class="jm-col"><div class="jm-bar jm-w85"></div></div><span class="jm-bar" style="width:22px;background:var(--live)"></span></div><div class="jm-row"><span class="jm-sq"></span><div class="jm-col"><div class="jm-bar jm-w55"></div></div><span class="jm-bar" style="width:22px;background:var(--lo4)"></span></div></div>
        <div class="jm-desc">See the city's Scouts and Field Reporters, coverage gaps, cold zones. Direct effort where the map is <b>quietest, not loudest</b>.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>Member tiers<span class="st">LIVE</span></div><div class="jm-feat exploring"><span class="d"></span>Assignment / tasking<span class="st">EXPLORING</span></div></div>
        <div class="jm-friction"><b>Note:</b> tasking layer still conceptual.</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">03</span><span class="jm-sname">Run correspondents</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk tr"></span><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:4px"><span class="jm-sq" style="width:100%;height:26px"></span><span class="jm-sq" style="width:100%;height:26px"></span><span class="jm-sq" style="width:100%;height:26px"></span><span class="jm-sq hatch" style="width:100%;height:26px"></span></div><span class="jm-lbl" style="bottom:7px;left:8px;color:var(--jm-flare)">AFC Correspondents</span></div>
        <div class="jm-desc">The proposed <b>Adfree Cities Correspondents network</b> &mdash; a roster of local eyes feeding one city desk. Bridges the app to the wider movement.</div>
        <div class="jm-feats"><div class="jm-feat planned"><span class="d"></span>AFC Correspondents<span class="st">PLANNED</span></div></div>
        <div class="jm-friction"><b>Status:</b> concept drafted, in outreach packs.</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">04</span><span class="jm-sname">Carry credentials</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk br"></span><div class="jm-idcard"><div style="display:flex;justify-content:space-between;align-items:center"><span class="jm-avatar"></span><span style="font-family:var(--font-mono);font-size:8px;color:var(--jm-hivis);letter-spacing:.14em;font-weight:700">CITY AMB.</span></div><div class="jm-col"><div class="jm-bar jm-w85"></div><div class="jm-bar jm-w55"></div></div><div style="display:flex;justify-content:space-between;align-items:flex-end"><span class="jm-bar accent" style="width:30px"></span><span style="font-family:var(--font-mono);font-size:8px;color:rgba(255,255,255,.4)">CR80 &middot; tier 3</span></div></div></div>
        <div class="jm-desc">Physical kit: <b>CR80 ID card, lanyard, badge holder, tri-fold field-guide map</b>. Three tiers, designed and production-ready &mdash; awaiting the print run.</div>
        <div class="jm-feats"><div class="jm-feat building"><span class="d"></span>Physical credentials<span class="st">BUILDING</span></div></div>
        <div class="jm-friction"><b>Status:</b> design done &rarr; print/fulfilment pending.</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">05</span><span class="jm-sname">Report the city</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk tr"></span><div style="text-align:center;padding-top:10px"><span class="jm-bignum" style="font-size:34px">312</span></div><div class="jm-bar jm-w70" style="margin:8px auto 4px"></div><div style="display:flex;gap:6px;justify-content:center;margin-top:8px"><span class="jm-btn ghost">Export</span></div></div>
        <div class="jm-desc">City-level impact, exportable for press, council submissions, partners. The Ambassador's city becomes a <b>case others can cite</b>.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>Impact dashboard<span class="st">LIVE</span></div><div class="jm-feat exploring"><span class="d"></span>Export / press pack<span class="st">EXPLORING</span></div></div>
        <div class="jm-friction"><b>Handoff &rarr;</b> feeds Movement Partner layer.</div>
      </div></div></div>
    </div>
  `,

  supporter: `
    <div class="jm-phead">
      <div class="jm-badge"><span class="jm-bk tl"></span><span class="jm-bk br"></span>&#9829;</div>
      <div>
        <div class="jm-pname">The Supporter</div>
        <span class="jm-ptier">Patron &middot; Funder &middot; No app tier</span>
        <p class="jm-pgoal">Believes, but won't be climbing ladders or shooting billboards. Wants to <b>fund it cleanly</b> and trust that every pound reaches the movement &mdash; copyleft, anti-VC, not for sale.</p>
        <div class="jm-pfacts"><span>Entry &middot; <b>map / impact / a story</b></span><span>Core act &middot; <b>give</b></span><span>Promise &middot; <b>every pound to the movement</b></span></div>
      </div>
    </div>
    <div class="jm-raillabel">Journey &mdash; belief to backing to belonging</div>
    <div class="jm-rail">
      <div class="jm-stage"><div class="jm-connect"><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">01</span><span class="jm-sname">The trigger</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk tr"></span><div class="jm-bar jm-w85" style="margin-top:4px"></div><div class="jm-bar jm-w100"></div><div class="jm-bar jm-w55"></div><div style="margin-top:16px"><span class="jm-btn ghost">Back the movement &rarr;</span></div></div>
        <div class="jm-desc">A number, a reimagined space, or a story lands hard enough to move them from watching to backing. The ask is <b>honest, never a paywall</b>.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>Impact dashboard<span class="st">LIVE</span></div></div>
        <div class="jm-friction"><b>Rule:</b> the case earns the ask.</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">02</span><span class="jm-sname">Give &mdash; fiat</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk br"></span><div style="display:flex;gap:5px;margin-top:4px"><span class="jm-sq" style="width:100%;height:16px;background:#C0563B;border-radius:3px"></span></div><div style="display:flex;gap:5px;margin-top:8px"><span class="jm-bar" style="height:16px;flex:1;background:#C0563B"></span><span class="jm-bar" style="height:16px;flex:1;background:var(--lo3)"></span><span class="jm-bar" style="height:16px;flex:1;background:var(--lo3)"></span></div><span class="jm-btn" style="margin-top:12px;background:#C0563B;color:#fff;box-shadow:0 0 18px rgba(192,86,59,.4)">Donate</span></div>
        <div class="jm-desc">DonorBox, live at <b>donorbox.org/ooh</b>, styled terracotta <b>#C0563B</b> &mdash; the Out of Hell brand. One tap, recurring optional, receipt clean.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>DonorBox<span class="st">LIVE</span></div></div>
        <div class="jm-friction"><b>Decision:</b> terracotta widget vs Orbital neon &mdash; see note.</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">03</span><span class="jm-sname">Give &mdash; on-chain</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk tr"></span><div class="jm-doc"><div class="jm-bar accent2 jm-w55"></div><div class="jm-row"><span class="jm-sq" style="border-radius:50%"></span><div class="jm-col"><div class="jm-bar jm-w85"></div></div></div><div class="jm-bar jm-w70"></div><span class="jm-lbl" style="position:static;color:var(--jm-flare)">chain: Polygon / Base ?</span></div></div>
        <div class="jm-desc">Web3 / crypto path via <b>CryptoDonations.jsx</b>. Real, but not shippable &mdash; <b>Polygon vs Base chain mismatch unresolved, wallet addresses pending</b>.</div>
        <div class="jm-feats"><div class="jm-feat building"><span class="d"></span>Web3 treasury<span class="st">BUILDING</span></div></div>
        <div class="jm-friction"><b>Blocker:</b> pick one chain, set wallets, then ship.</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">04</span><span class="jm-sname">Confirm + trust</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk br"></span><div style="text-align:center;padding-top:8px"><div style="width:30px;height:30px;border:2px solid var(--live);border-radius:50%;margin:0 auto;box-shadow:var(--jm-glow-g)"></div></div><div class="jm-bar jm-w70" style="margin:12px auto 4px"></div><div class="jm-bar jm-w55" style="margin:0 auto"></div><span class="jm-lbl" style="bottom:8px;left:0;right:0;text-align:center;color:var(--live)">every pound &rarr; movement</span></div>
        <div class="jm-desc">Receipt + a plain statement of where it goes. No overhead theatre &mdash; the <b>copyleft, community-funded</b> promise restated at the moment of giving.</div>
        <div class="jm-feats"><div class="jm-feat building"><span class="d"></span>Donation &rarr; n8n event<span class="st">BUILDING</span></div></div>
        <div class="jm-friction"><b>Gap:</b> real donation trigger into n8n still to wire.</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">05</span><span class="jm-sname">Stay in it</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk tr"></span><div class="jm-row"><span class="jm-sq hatch"></span><div class="jm-col"><div class="jm-bar jm-w85"></div><div class="jm-bar jm-w40"></div></div></div><div class="jm-bar jm-w70" style="margin-top:6px"></div><div class="jm-bar accent jm-w55"></div></div>
        <div class="jm-desc">Impact updates keep the Supporter connected &mdash; new cities, milestones, wins. Belief becomes <b>belonging</b>, funding becomes ongoing.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>Impact dashboard<span class="st">LIVE</span></div><div class="jm-feat exploring"><span class="d"></span>Supporter updates<span class="st">EXPLORING</span></div></div>
        <div class="jm-friction"><b>Note:</b> update cadence can route through n8n.</div>
      </div></div></div>
    </div>
  `,

  partner: `
    <div class="jm-phead">
      <div class="jm-badge"><span class="jm-bk tl"></span><span class="jm-bk br"></span>&#9873;</div>
      <div>
        <div class="jm-pname">The Movement Partner</div>
        <span class="jm-ptier">Org &middot; Network &middot; Ally</span>
        <p class="jm-pgoal">Brandalism, Adfree Cities, Subvertisers International, Adbusters. Not one user &mdash; an <b>organisation</b> deciding whether to plug their people and campaigns into the platform.</p>
        <div class="jm-pfacts"><span>Entry &middot; <b>outreach letter / campaign page</b></span><span>Core act &middot; <b>align + adopt</b></span><span>Basis &middot; <b>copyleft, AGPL-3.0 + CC BY-SA</b></span></div>
      </div>
    </div>
    <div class="jm-raillabel">Journey &mdash; org-level adoption</div>
    <div class="jm-rail">
      <div class="jm-stage"><div class="jm-connect"><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">01</span><span class="jm-sname">First contact</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk tr"></span><div class="jm-doc"><div class="jm-bar accent2 jm-w55"></div><div class="jm-bar jm-w100"></div><div class="jm-bar jm-w85"></div><div class="jm-bar jm-w70"></div><span class="jm-seal"></span></div></div>
        <div class="jm-desc">Arrives via a tailored letter (Adbusters/Lasn, AFC, Brandalism/Tona) and the <b>campaign page</b> as voice + proof. Legitimacy anchored in the SDG + A/69/286 framing.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>Campaign page<span class="st">LIVE</span></div><div class="jm-feat live"><span class="d"></span>Outreach packs<span class="st">LIVE</span></div></div>
        <div class="jm-friction"><b>Anchor:</b> SDG 11.7 &middot; First Things First lineage.</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">02</span><span class="jm-sname">Inspect the commons</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk br"></span><div class="jm-row"><span class="jm-sq" style="border-radius:50%;background:var(--lo3)"></span><div class="jm-col"><div class="jm-bar jm-w70"></div><div class="jm-bar jm-w40"></div></div></div><div class="jm-bar jm-w85" style="margin-top:6px"></div><span class="jm-lbl" style="bottom:7px;right:8px;color:var(--live)">AGPL-3.0 &middot; public</span></div>
        <div class="jm-desc">Code is public and copyleft &mdash; <b>oohearth/ooh-earth</b>, AGPL-3.0 + CC BY-SA 4.0, mirrored from Base44. Nothing to buy, nothing locked. The commons is the pitch.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>Public repo / copyleft<span class="st">LIVE</span></div></div>
        <div class="jm-friction"><b>Non-negotiable:</b> not for sale.</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">03</span><span class="jm-sname">Wire their campaigns</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk tr"></span><div style="display:flex;align-items:center;gap:6px;margin-top:14px"><span class="jm-sq"></span><span class="jm-bar accent2" style="flex:1;height:3px"></span><span class="jm-sq" style="background:var(--jm-flare)"></span><span class="jm-bar accent2" style="flex:1;height:3px"></span><span class="jm-sq"></span></div><span class="jm-lbl" style="bottom:8px;left:8px;color:var(--jm-flare)">n8n &middot; webhook bridge</span></div>
        <div class="jm-desc">Automation spine (<b>n8n &harr; Base44 bridge, proven</b>) can route partner campaigns, Asana tasks, social. The integration surface exists &mdash; connections built per partner.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>n8n bridge (proven)<span class="st">LIVE</span></div><div class="jm-feat building"><span class="d"></span>Asana / campaign flows<span class="st">BUILDING</span></div></div>
        <div class="jm-friction"><b>Status:</b> bridge live; per-partner flows to build.</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">04</span><span class="jm-sname">Correspondents on the ground</span></div>
        <div class="jm-screen"><div class="jm-map"></div><span class="jm-sbk tl"></span><span class="jm-sbk br"></span><span class="jm-pin g" style="top:34%;left:34%"></span><span class="jm-pin g" style="top:52%;left:60%"></span><span class="jm-pin g" style="top:66%;left:40%"></span><span class="jm-lbl" style="bottom:8px;left:8px;color:var(--live)">correspondents &middot; live</span></div>
        <div class="jm-desc">The partner's network becomes <b>AFC Correspondents</b> &mdash; local members under a shared desk, feeding the same map. Movement + platform, one record.</div>
        <div class="jm-feats"><div class="jm-feat planned"><span class="d"></span>AFC Correspondents<span class="st">PLANNED</span></div></div>
        <div class="jm-friction"><b>Status:</b> concept drafted, awaiting first partner.</div>
      </div></div></div>
    </div>
  `,

  roadmap: `
    <div class="jm-sectitle">Feature roadmap <span class="m">/</span> master matrix</div>
    <p class="jm-secsub">Every feature across the app + back-office, its build status, who touches it, and where. This is the single source of truth the six journeys draw from &mdash; including the infrastructure that never shows on a user's screen.</p>
    <div class="jm-matrix">
      <table>
        <thead><tr><th>Feature</th><th>Status</th><th>Who touches it</th><th>Journey stage</th><th>Note</th></tr></thead>
        <tbody>
          <tr><td class="fname">Live map</td><td><span class="jm-sbadge live"><span class="d"></span>Live</span></td><td class="who">All personas</td><td>Entry + browse everywhere</td><td>Core surface. Pins by offense category.</td></tr>
          <tr><td class="fname">AI-assisted capture</td><td><span class="jm-sbadge live"><span class="d"></span>Live</span></td><td class="who">Scout, Field Reporter</td><td>Scout &middot; 02</td><td>Auto-suggests offense category + geotag.</td></tr>
          <tr><td class="fname">Evidence feed</td><td><span class="jm-sbadge live"><span class="d"></span>Live</span></td><td class="who">Passer-by, Scout</td><td>Passer-by &middot; 02 / Scout &middot; 03</td><td>Pending &rarr; verified trust spine.</td></tr>
          <tr><td class="fname">9 offense categories</td><td><span class="jm-sbadge live"><span class="d"></span>Live</span></td><td class="who">All</td><td>Capture + every sighting</td><td>Classification taxonomy.</td></tr>
          <tr><td class="fname">Impact dashboard</td><td><span class="jm-sbadge live"><span class="d"></span>Live</span></td><td class="who">All</td><td>Passer-by &middot; 03, Ambassador &middot; 05, Supporter &middot; 01/05</td><td>Scales from personal to city to global.</td></tr>
          <tr><td class="fname">AR Reimagine</td><td><span class="jm-sbadge live"><span class="d"></span>Live</span></td><td class="who">Passer-by, Field Reporter</td><td>Passer-by &middot; 04 / Field Reporter &middot; 02</td><td>Before/after counter-image.</td></tr>
          <tr><td class="fname">Objection Generator</td><td><span class="jm-sbadge live"><span class="d"></span>Live</span></td><td class="who">Field Reporter</td><td>Field Reporter &middot; 03</td><td>Formal complaint, precedent-anchored.</td></tr>
          <tr><td class="fname">Member tier system</td><td><span class="jm-sbadge live"><span class="d"></span>Live</span></td><td class="who">Scout &rarr; Field Reporter &rarr; Ambassador</td><td>Enlist + every rank-up</td><td>Scout / Field Reporter / City Ambassador.</td></tr>
          <tr><td class="fname">DonorBox (fiat)</td><td><span class="jm-sbadge live"><span class="d"></span>Live</span></td><td class="who">Supporter</td><td>Supporter &middot; 02</td><td>donorbox.org/ooh &middot; terracotta #C0563B.</td></tr>
          <tr><td class="fname">Campaign page + outreach</td><td><span class="jm-sbadge live"><span class="d"></span>Live</span></td><td class="who">Partner, Supporter</td><td>Partner &middot; 01</td><td>Canonical voice ref. Tailored letters ready.</td></tr>
          <tr><td class="fname">Public repo / copyleft</td><td><span class="jm-sbadge live"><span class="d"></span>Live</span></td><td class="who">Partner</td><td>Partner &middot; 02</td><td>AGPL-3.0 + CC BY-SA 4.0, GitHub-mirrored.</td></tr>
          <tr><td class="fname">n8n &harr; Base44 bridge</td><td><span class="jm-sbadge live"><span class="d"></span>Live</span></td><td class="who">Back-office</td><td>Field Reporter &middot; 04, Partner &middot; 03</td><td>Proven end-to-end via base44-bridge.</td></tr>
          <tr><td class="fname">Web3 / crypto treasury</td><td><span class="jm-sbadge building"><span class="d"></span>Building</span></td><td class="who">Supporter</td><td>Supporter &middot; 03</td><td>Polygon vs Base mismatch; wallets pending.</td></tr>
          <tr><td class="fname">n8n social routing</td><td><span class="jm-sbadge building"><span class="d"></span>Building</span></td><td class="who">Field Reporter, Back-office</td><td>Field Reporter &middot; 04</td><td>Bridge proven; real triggers to wire.</td></tr>
          <tr><td class="fname">Donation &rarr; n8n events</td><td><span class="jm-sbadge building"><span class="d"></span>Building</span></td><td class="who">Supporter, Back-office</td><td>Supporter &middot; 04</td><td>Real donation trigger still to wire.</td></tr>
          <tr><td class="fname">Asana / campaign flows</td><td><span class="jm-sbadge building"><span class="d"></span>Building</span></td><td class="who">Partner, Back-office</td><td>Partner &middot; 03</td><td>Task mirroring on the automation spine.</td></tr>
          <tr><td class="fname">Physical credentials</td><td><span class="jm-sbadge building"><span class="d"></span>Building</span></td><td class="who">City Ambassador</td><td>Ambassador &middot; 04</td><td>CR80 3-tier + field guide; print run pending.</td></tr>
          <tr><td class="fname">City stats (OSM/Overpass)</td><td><span class="jm-sbadge planned"><span class="d"></span>Planned</span></td><td class="who">Passer-by, Ambassador</td><td>Passer-by &middot; 03 / Ambassador &middot; 01</td><td>Density per capita needs Overpass ingest.</td></tr>
          <tr><td class="fname">AFC Correspondents network</td><td><span class="jm-sbadge planned"><span class="d"></span>Planned</span></td><td class="who">Ambassador, Partner</td><td>Ambassador &middot; 03 / Partner &middot; 04</td><td>Concept drafted; awaiting first partner.</td></tr>
          <tr><td class="fname">Member tasking / assignment</td><td><span class="jm-sbadge exploring"><span class="d"></span>Exploring</span></td><td class="who">City Ambassador</td><td>Ambassador &middot; 02</td><td>Directing effort to cold zones.</td></tr>
          <tr><td class="fname">Streaks / nudges</td><td><span class="jm-sbadge exploring"><span class="d"></span>Exploring</span></td><td class="who">Scout</td><td>Scout &middot; 05</td><td>Retention loop, not yet built.</td></tr>
          <tr><td class="fname">Precedent library</td><td><span class="jm-sbadge exploring"><span class="d"></span>Exploring</span></td><td class="who">Field Reporter</td><td>Field Reporter &middot; 03</td><td>Citable legal precedent behind objections.</td></tr>
          <tr><td class="fname">Export / press pack</td><td><span class="jm-sbadge exploring"><span class="d"></span>Exploring</span></td><td class="who">Ambassador, Partner</td><td>Ambassador &middot; 05</td><td>City impact as council/press artifact.</td></tr>
          <tr><td class="fname">Supporter updates</td><td><span class="jm-sbadge exploring"><span class="d"></span>Exploring</span></td><td class="who">Supporter</td><td>Supporter &middot; 05</td><td>Ongoing impact cadence, n8n-routed.</td></tr>
        </tbody>
      </table>
    </div>
    <div class="jm-foot">
      OOH Earth &middot; UX Journey Map v1 &middot; Orbital Perspective &middot; Jul 2026<br>
      Status calls are drawn from current build state &mdash; adjust any as the roadmap moves; every label lives in one place (journey/panels).<br>
      <b>Open design decision:</b> the fiat donate step (Supporter &middot; 02) runs terracotta #C0563B (Out of Hell brand) inside the neon Orbital app. Deliberate cross-brand signal, or unify to hi-vis? Flagged, not resolved.
    </div>
  `,
};
