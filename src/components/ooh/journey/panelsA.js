// Journey Map — tab config + panels A (overview/kit, passer-by, scout, operative).
// Plain HTML strings injected under the scoped .jm-root wrapper.

export const TABS = [
  { id: "overview",   n: "00", label: "Overview + Kit" },
  { id: "passerby",   n: "01", label: "The Passer-by" },
  { id: "scout",      n: "02", label: "The Scout" },
  { id: "operative",  n: "03", label: "Field Operative" },
  { id: "ambassador", n: "04", label: "City Ambassador" },
  { id: "supporter",  n: "05", label: "The Supporter" },
  { id: "partner",    n: "06", label: "Movement Partner" },
  { id: "roadmap",    n: "07", label: "Feature Roadmap" },
];

export const PANELS_A = {

  overview: `
    <div class="jm-grid2">
      <div class="jm-obox">
        <h3><span class="t"></span>How to read this</h3>
        <p>Each <b>perspective</b> in the menu is one user's full journey, left to right, as a rail of stages. Every stage carries a low-fi wireframe of the screen, what happens there, the <b>features it touches</b>, and how each of those features is doing on the roadmap. The final tab is the master feature matrix.</p>
        <ul>
          <li><span class="k">&rarr;</span>Rails scroll sideways. Follow the orange arrows through the flow.</li>
          <li><span class="k">&#9670;</span>Feature dots show status: green live, yellow building, orange planned, grey exploring.</li>
          <li><span class="k">&#9089;</span>Wireframes are proportion-honest but intentionally low-fi &mdash; structure, not skin.</li>
        </ul>
      </div>
      <div class="jm-obox">
        <h3><span class="t"></span>The six who show up</h3>
        <ul>
          <li><span class="k">01</span><b style="color:var(--jm-ink)">Passer-by</b> &mdash; the curious public. No account, just a link and a question: what's cluttering my city?</li>
          <li><span class="k">02</span><b style="color:var(--jm-ink)">Scout</b> &mdash; signed up. Logs the billboard they just walked past.</li>
          <li><span class="k">03</span><b style="color:var(--jm-ink)">Field Operative</b> &mdash; regular. Stops documenting and starts responding.</li>
          <li><span class="k">04</span><b style="color:var(--jm-ink)">City Ambassador</b> &mdash; coordinates a city. Runs people, not just pins.</li>
          <li><span class="k">05</span><b style="color:var(--jm-ink)">Supporter</b> &mdash; funds it. Every pound to the movement.</li>
          <li><span class="k">06</span><b style="color:var(--jm-ink)">Movement Partner</b> &mdash; Brandalism, Adfree Cities, Adbusters. Plugs in at the org level.</li>
        </ul>
      </div>
    </div>

    <div class="jm-sectitle">Low-fi UI <span class="m">/</span> Kit</div>
    <p class="jm-secsub">The wireframe vocabulary every stage is built from. Greyscale by default, one accent to mark the focal action, reticle brackets as the orbital signature. Same primitives, recombined per screen.</p>
    <div class="jm-kitgrid">
      <div class="jm-kititem"><div class="jm-kdemo"><span class="jm-sbk tl"></span><span class="jm-sbk br"></span><div class="jm-bar jm-w70"></div><div class="jm-bar jm-w100"></div><div class="jm-bar jm-w55"></div></div><div class="jm-kname">Screen frame</div><div class="jm-kdesc">Reticle-bracketed viewport. Container for every mock.</div></div>
      <div class="jm-kititem"><div class="jm-kdemo"><div class="jm-map"></div><span class="jm-pin" style="top:40%;left:35%"></span><span class="jm-pin g" style="top:60%;left:65%"></span><span class="jm-pin y" style="top:30%;left:70%"></span></div><div class="jm-kname">Map + pins</div><div class="jm-kdesc">Dotted grid, glowing markers by category.</div></div>
      <div class="jm-kititem"><div class="jm-kdemo"><div class="jm-row"><span class="jm-sq hatch"></span><div class="jm-col"><div class="jm-bar jm-w85"></div><div class="jm-bar jm-w40"></div></div></div><div class="jm-row"><span class="jm-sq hatch"></span><div class="jm-col"><div class="jm-bar jm-w70"></div><div class="jm-bar jm-w55"></div></div></div></div><div class="jm-kname">Feed row</div><div class="jm-kdesc">Thumb + caption. The evidence-feed unit.</div></div>
      <div class="jm-kititem"><div class="jm-kdemo" style="display:flex;align-items:center;justify-content:center"><span class="jm-bignum">247</span></div><div class="jm-kname">Big stat</div><div class="jm-kdesc">One number, loud. Impact + milestones.</div></div>
      <div class="jm-kititem"><div class="jm-kdemo"><div class="jm-photo" style="height:70%"><span class="jm-ptxt">Image slot</span></div></div><div class="jm-kname">Photo slot</div><div class="jm-kdesc">Hatched drop-in for billboard evidence.</div></div>
      <div class="jm-kititem"><div class="jm-kdemo"><div class="jm-cam"></div><div class="jm-reticle"></div><span class="jm-tagmini" style="bottom:8px;left:8px">AI &middot; Offense 4</span></div><div class="jm-kname">Capture / reticle</div><div class="jm-kdesc">Camera frame, AI auto-classify tag.</div></div>
      <div class="jm-kititem"><div class="jm-kdemo"><div class="jm-split"><div class="jm-before"><span class="jm-sl">Now</span></div><div class="jm-after"><span class="jm-sl">Reimagined</span></div></div></div><div class="jm-kname">AR split</div><div class="jm-kdesc">Before / after for Reimagine.</div></div>
      <div class="jm-kititem"><div class="jm-kdemo" style="display:flex;align-items:flex-end;justify-content:center;gap:8px"><span class="jm-btn">Primary</span><span class="jm-btn ghost">Ghost</span></div><div class="jm-kname">Buttons</div><div class="jm-kdesc">Hi-vis pill = the one true action.</div></div>
    </div>
  `,

  passerby: `
    <div class="jm-phead">
      <div class="jm-badge"><span class="jm-bk tl"></span><span class="jm-bk br"></span>&#128065;</div>
      <div>
        <div class="jm-pname">The Passer-by</div>
        <span class="jm-ptier">Unregistered &middot; Public &middot; First contact</span>
        <p class="jm-pgoal">Arrived from a share, a sticker, a QR, a headline. <b>No account, no commitment</b> &mdash; just a question they didn't know they had: how much of my city did I never agree to?</p>
        <div class="jm-pfacts"><span>Entry &middot; <b>ooh.earth link / social / QR</b></span><span>Device &middot; <b>mobile web</b></span><span>Exit goal &middot; <b>convert to Scout or Supporter</b></span></div>
      </div>
    </div>
    <div class="jm-raillabel">Journey &mdash; cold arrival to conversion</div>
    <div class="jm-rail">
      <div class="jm-stage"><div class="jm-connect"><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">01</span><span class="jm-sname">Land on the map</span></div>
        <div class="jm-screen"><div class="jm-map"></div><span class="jm-sbk tl"></span><span class="jm-sbk tr"></span><span class="jm-pin" style="top:35%;left:30%"></span><span class="jm-pin g" style="top:55%;left:58%"></span><span class="jm-pin y" style="top:48%;left:74%"></span><span class="jm-pin" style="top:70%;left:40%"></span><span class="jm-lbl" style="bottom:8px;left:8px">13.75N 100.50E</span></div>
        <div class="jm-desc">The live map opens on <b>their location</b>. Pins bloom where corporate OOH has been documented. No sign-up wall &mdash; the evidence is the hook.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>Live map<span class="st">LIVE</span></div><div class="jm-feat live"><span class="d"></span>9 offense categories<span class="st">LIVE</span></div></div>
        <div class="jm-friction"><b>Moment:</b> "wait, that many &mdash; near me?"</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">02</span><span class="jm-sname">Open a sighting</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk br"></span><div class="jm-photo"><span class="jm-ptxt">Billboard photo</span></div><div class="jm-row" style="margin-top:8px"><div class="jm-col"><div class="jm-bar jm-w85"></div><div class="jm-bar accent2 jm-w40"></div></div></div><span class="jm-lbl" style="bottom:7px;right:8px;color:var(--live)">Offense &middot; 04</span></div>
        <div class="jm-desc">Tap a pin: photo evidence, offense category, coordinates, date. <b>Proof, not opinion.</b> Each sighting reads like a case file.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>Evidence feed<span class="st">LIVE</span></div><div class="jm-feat live"><span class="d"></span>9 offense categories<span class="st">LIVE</span></div></div>
        <div class="jm-friction"><b>Moment:</b> named + dated = undeniable.</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">03</span><span class="jm-sname">Feel the scale</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk tr"></span><div style="text-align:center;padding-top:14px"><span class="jm-bignum">1,247</span></div><div class="jm-bar accent jm-w55" style="margin:12px auto 4px"></div><div class="jm-bar jm-w40" style="margin:0 auto"></div></div>
        <div class="jm-desc">The impact dashboard turns pins into a number: total mapped, cities live, weekly delta. Personal shock becomes <b>collective evidence</b>.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>Impact dashboard<span class="st">LIVE</span></div><div class="jm-feat planned"><span class="d"></span>City stats (OSM)<span class="st">PLANNED</span></div></div>
        <div class="jm-friction"><b>Gap:</b> per-city density needs <b>Overpass/OSM</b>.</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">04</span><span class="jm-sname">Reimagine it</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk br"></span><div class="jm-split"><div class="jm-before"><span class="jm-sl">The ad</span></div><div class="jm-after"><span class="jm-sl">What if</span></div></div></div>
        <div class="jm-desc">AR Reimagine shows the same space as art, sky, nothing. The argument stops being negative &mdash; <b>here's what public space could be</b>.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>AR Reimagine<span class="st">LIVE</span></div></div>
        <div class="jm-friction"><b>Moment:</b> desire, not just outrage.</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">05</span><span class="jm-sname">Cross the line</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk tr"></span><div class="jm-bar jm-w70" style="margin-top:6px"></div><div class="jm-bar jm-w40"></div><div style="margin-top:16px"><span class="jm-btn">Become a Scout</span></div><div style="margin-top:8px"><span class="jm-btn ghost">Fund it &rarr;</span></div></div>
        <div class="jm-desc">One fork, two doors: <b>enlist</b> (become a Scout) or <b>fund</b> (Supporter). The passer-by becomes a participant &mdash; or a patron.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>Operative tiers<span class="st">LIVE</span></div><div class="jm-feat live"><span class="d"></span>DonorBox<span class="st">LIVE</span></div><div class="jm-feat building"><span class="d"></span>Web3 treasury<span class="st">BUILDING</span></div></div>
        <div class="jm-friction"><b>Handoff &rarr;</b> Scout or Supporter journey.</div>
      </div></div></div>
    </div>
  `,

  scout: `
    <div class="jm-phead">
      <div class="jm-badge"><span class="jm-bk tl"></span><span class="jm-bk br"></span>&#128205;</div>
      <div>
        <div class="jm-pname">The Scout</div>
        <span class="jm-ptier">Tier 1 &middot; Entry operative</span>
        <p class="jm-pgoal">Signed up in the heat of the moment. Standing in front of a billboard <b>right now</b> and wants to log it before the feeling fades. Needs the capture to be faster than the doubt.</p>
        <div class="jm-pfacts"><span>Entry &middot; <b>converted from Passer-by</b></span><span>Core act &middot; <b>document</b></span><span>Next tier &middot; <b>Field Operative</b></span></div>
      </div>
    </div>
    <div class="jm-raillabel">Journey &mdash; onboard to first contribution to habit</div>
    <div class="jm-rail">
      <div class="jm-stage"><div class="jm-connect"><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">01</span><span class="jm-sname">Enlist</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk tr"></span><div class="jm-bar tall jm-w70" style="margin-top:4px"></div><div class="jm-bar jm-w100"></div><div class="jm-bar jm-w55"></div><div style="margin-top:14px"><span class="jm-btn">Join as Scout</span></div><span class="jm-lbl" style="bottom:8px;left:8px;color:var(--jm-hivis)">Tier 01</span></div>
        <div class="jm-desc">Lightweight onboard &mdash; enough to attribute contributions, no more. Sets the <b>Scout</b> tier and frames the mission in the campaign voice.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>Operative tiers<span class="st">LIVE</span></div></div>
        <div class="jm-friction"><b>Rule:</b> zero friction &mdash; capture must beat doubt.</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">02</span><span class="jm-sname">Capture</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk br"></span><div class="jm-cam"></div><div class="jm-reticle"></div><span class="jm-tagmini" style="bottom:10px;left:10px">AI reads offense</span><span class="jm-btn" style="position:absolute;bottom:9px;right:9px">Shoot</span></div>
        <div class="jm-desc">AI-assisted capture: point, shoot. The model <b>auto-suggests the offense category</b> and grabs the geotag. Scout confirms, done in seconds.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>AI-assisted capture<span class="st">LIVE</span></div><div class="jm-feat live"><span class="d"></span>9 offense categories<span class="st">LIVE</span></div></div>
        <div class="jm-friction"><b>Moment:</b> the AI did the paperwork.</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">03</span><span class="jm-sname">Submit to the record</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk tr"></span><div class="jm-row"><span class="jm-sq hatch"></span><div class="jm-col"><div class="jm-bar jm-w85"></div><div class="jm-bar accent jm-w40"></div></div></div><div class="jm-row"><span class="jm-sq hatch"></span><div class="jm-col"><div class="jm-bar jm-w70"></div><div class="jm-bar jm-w55"></div></div></div><span class="jm-lbl" style="bottom:7px;right:8px;color:var(--live)">Pending &rarr; verified</span></div>
        <div class="jm-desc">The sighting lands in the evidence feed, flagged <b>pending</b> until verified. Scout sees it enter the shared record &mdash; their proof is now everyone's.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>Evidence feed<span class="st">LIVE</span></div></div>
        <div class="jm-friction"><b>Note:</b> verification state is the trust spine.</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">04</span><span class="jm-sname">See it on the map</span></div>
        <div class="jm-screen"><div class="jm-map"></div><span class="jm-sbk tl"></span><span class="jm-sbk br"></span><span class="jm-pin y" style="top:46%;left:50%;width:10px;height:10px"></span><span class="jm-lbl" style="bottom:8px;left:8px;color:var(--jm-hivis)">Your pin &middot; live</span></div>
        <div class="jm-desc">Their pin lights up on the live map &mdash; a hi-vis dot that wasn't there this morning. <b>Immediate, visible proof of impact.</b></div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>Live map<span class="st">LIVE</span></div></div>
        <div class="jm-friction"><b>Moment:</b> "I put that there."</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">05</span><span class="jm-sname">Rank up</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk tr"></span><div class="jm-idcard"><div style="display:flex;gap:7px;align-items:center"><span class="jm-avatar"></span><div class="jm-col"><div class="jm-bar jm-w70"></div><div class="jm-bar accent jm-w40"></div></div></div><div><div style="font-family:var(--font-mono);font-size:8px;color:rgba(255,255,255,.4);letter-spacing:.1em;margin-bottom:4px">SCOUT &rarr; FIELD OPERATIVE</div><div class="jm-tierbar"><span class="jm-seg fill"></span><span class="jm-seg fill"></span><span class="jm-seg fill"></span><span class="jm-seg"></span></div></div></div></div>
        <div class="jm-desc">Profile shows tier progress toward <b>Field Operative</b>. A nudge points at the next act &mdash; the streak, the gap, the unlock.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>Operative tiers<span class="st">LIVE</span></div><div class="jm-feat exploring"><span class="d"></span>Streaks / nudges<span class="st">EXPLORING</span></div></div>
        <div class="jm-friction"><b>Handoff &rarr;</b> promotion opens Operative tools.</div>
      </div></div></div>
    </div>
  `,

  operative: `
    <div class="jm-phead">
      <div class="jm-badge"><span class="jm-bk tl"></span><span class="jm-bk br"></span>&#128752;</div>
      <div>
        <div class="jm-pname">The Field Operative</div>
        <span class="jm-ptier">Tier 2 &middot; Active responder</span>
        <p class="jm-pgoal">Past logging. This operative wants to <b>do something back</b> &mdash; reimagine the space, file a real objection, put it in front of people. Documentation was the warm-up.</p>
        <div class="jm-pfacts"><span>Entry &middot; <b>promoted Scout</b></span><span>Core act &middot; <b>respond + amplify</b></span><span>Next tier &middot; <b>City Ambassador</b></span></div>
      </div>
    </div>
    <div class="jm-raillabel">Journey &mdash; from documenting to acting</div>
    <div class="jm-rail">
      <div class="jm-stage"><div class="jm-connect"><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">01</span><span class="jm-sname">Mission dashboard</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk tr"></span><div style="display:flex;gap:8px;margin-top:2px"><div class="jm-col"><span style="font-size:22px;font-weight:900;color:var(--jm-hivis)">18</span><div class="jm-bar jm-w70"></div></div><div class="jm-col"><span style="font-size:22px;font-weight:900;color:var(--live)">6</span><div class="jm-bar jm-w55"></div></div></div><div class="jm-bar jm-w100" style="margin-top:10px"></div><div class="jm-bar jm-w85"></div></div>
        <div class="jm-desc">Opens on their own numbers &mdash; captures, verifications, city rank. The impact dashboard reframed as a <b>personal command view</b>.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>Impact dashboard<span class="st">LIVE</span></div></div>
        <div class="jm-friction"><b>Moment:</b> "here's my footprint. now what?"</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">02</span><span class="jm-sname">Reimagine the space</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk br"></span><div class="jm-split"><div class="jm-before"><span class="jm-sl">Capture</span></div><div class="jm-after"><span class="jm-sl">Art / nature</span></div></div><span class="jm-tagmini" style="top:8px;right:8px">AR</span></div>
        <div class="jm-desc">Operative-grade AR Reimagine: take a real sighting and render the alternative &mdash; <b>street art, greenery, blank sky</b> &mdash; then export it as a shareable asset.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>AR Reimagine<span class="st">LIVE</span></div></div>
        <div class="jm-friction"><b>Moment:</b> the counter-image is the weapon.</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">03</span><span class="jm-sname">Generate an objection</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk tr"></span><div class="jm-doc"><div class="jm-bar accent2 jm-w55"></div><div class="jm-bar jm-w100"></div><div class="jm-bar jm-w85"></div><div class="jm-bar jm-w100"></div><div class="jm-bar jm-w70"></div><span class="jm-seal"></span></div></div>
        <div class="jm-desc">Objection Generator drafts a <b>formal, citable complaint</b> for that specific billboard &mdash; planning-consent language, offense grounds, precedent baked in. Copy, send, file.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>Objection Generator<span class="st">LIVE</span></div><div class="jm-feat exploring"><span class="d"></span>Precedent library<span class="st">EXPLORING</span></div></div>
        <div class="jm-friction"><b>Anchor:</b> A/69/286 &middot; D&eacute;boulonneurs (2013).</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">04</span><span class="jm-sname">Push it out</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk br"></span><div class="jm-row"><span class="jm-sq"></span><span class="jm-sq"></span><span class="jm-sq"></span></div><div class="jm-bar jm-w85" style="margin-top:6px"></div><div class="jm-bar jm-w55"></div><div style="margin-top:12px"><span class="jm-btn">Share</span></div><span class="jm-lbl" style="bottom:8px;right:8px;color:var(--jm-flare)">routing &middot; n8n</span></div>
        <div class="jm-desc">One share fans out to channels. User side is simple; behind it, <b>n8n social routing</b> handles distribution &mdash; proven bridge, wiring the real triggers now.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>Share to social<span class="st">LIVE</span></div><div class="jm-feat building"><span class="d"></span>n8n social routing<span class="st">BUILDING</span></div></div>
        <div class="jm-friction"><b>Gap:</b> auto-routing live once triggers wired.</div>
      </div></div></div>
      <div class="jm-stage"><div class="jm-connect"><span class="jm-arrow">&rarr;</span><div class="jm-scard">
        <div class="jm-stagetop"><span class="jm-idx">05</span><span class="jm-sname">Toward Ambassador</span></div>
        <div class="jm-screen"><span class="jm-sbk tl"></span><span class="jm-sbk tr"></span><div class="jm-idcard"><div style="font-family:var(--font-mono);font-size:8px;color:rgba(255,255,255,.4);letter-spacing:.1em">FIELD OPERATIVE &rarr; CITY AMBASSADOR</div><div class="jm-tierbar"><span class="jm-seg fill"></span><span class="jm-seg fill"></span><span class="jm-seg fill"></span><span class="jm-seg fill"></span><span class="jm-seg"></span></div><div class="jm-bar jm-w55"></div></div></div>
        <div class="jm-desc">Sustained output surfaces the <b>City Ambassador</b> path &mdash; the shift from acting solo to coordinating a city's operatives.</div>
        <div class="jm-feats"><div class="jm-feat live"><span class="d"></span>Operative tiers<span class="st">LIVE</span></div></div>
        <div class="jm-friction"><b>Handoff &rarr;</b> unlocks the city command layer.</div>
      </div></div></div>
    </div>
  `,
};
