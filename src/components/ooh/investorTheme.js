// Shared scoped stylesheet for the logged-in investor area
// (Investor Hub, Investor Dashboard, Client Portal). Themed off the
// app channel tokens so it inherits dark · light · matrix. Every page
// wraps content in <div className="inv"> and injects INVESTOR_CSS once.

export const INVESTOR_CSS = `
.inv{--y:rgb(var(--c-ozone));--o:rgb(var(--c-flare));--bg:rgb(var(--c-void));--tx:rgb(var(--c-silver));--ln:rgb(var(--c-slate2));--mu:rgb(var(--c-dim));--al:hsl(var(--destructive));
  background:var(--bg);color:var(--tx);font-family:var(--font-display);min-height:100vh;
  background-image:linear-gradient(rgb(var(--c-slate2)/.28) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--c-slate2)/.28) 1px,transparent 1px);background-size:44px 44px;padding-bottom:80px}
.inv *{box-sizing:border-box}
.inv .inv-wrap{max-width:1000px;margin:0 auto;padding:0 22px}
.inv section{padding:48px 0}
.inv .inv-eye{font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:var(--y);display:flex;align-items:center;gap:10px}
.inv .inv-tick{display:inline-block;width:22px;height:7px;background:var(--o);box-shadow:0 0 20px rgb(var(--c-flare)/.5)}
.inv .cur{color:var(--o)}
.inv .alert{color:var(--al)}
/* hero */
.inv .inv-hero{padding:116px 22px 40px}
.inv h1{font-size:clamp(30px,5vw,54px);font-weight:900;letter-spacing:-.03em;line-height:.98;margin:16px 0 0;max-width:20ch}
.inv h1 em{font-style:normal;color:var(--y);text-shadow:0 0 24px rgb(var(--c-ozone)/.35)}
.inv .inv-lede{margin-top:18px;font-size:clamp(14px,1.8vw,17px);font-weight:500;color:var(--mu);max-width:64ch;line-height:1.55}
.inv .authchip{display:inline-flex;align-items:center;gap:8px;margin-top:20px;font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--y);border:1px solid rgb(var(--c-ozone)/.45);border-radius:99px;padding:6px 12px}
.inv .authchip .dotpulse{width:7px;height:7px;border-radius:99px;background:var(--y);box-shadow:0 0 10px rgb(var(--c-ozone)/.7)}
/* ask row */
.inv .inv-ask{display:flex;flex-wrap:wrap;gap:14px 36px;align-items:flex-end;margin-top:28px;padding-top:24px;border-top:1px solid var(--ln)}
.inv .inv-ask .b .l{font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--mu)}
.inv .inv-ask .b .v{font-size:clamp(24px,4vw,40px);font-weight:900;letter-spacing:-.03em;line-height:1;margin-top:8px}
.inv .inv-ask .b.big .v{color:var(--y);text-shadow:0 0 24px rgb(var(--c-ozone)/.35)}
.inv .inv-ask .b .s{font-size:12px;color:var(--mu);margin-top:8px;font-weight:500}
/* section head */
.inv .inv-head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;border-left:3px solid var(--o);padding-left:14px;margin-bottom:24px}
.inv .inv-head h2{font-size:clamp(18px,3vw,25px);font-weight:900;letter-spacing:-.02em}
.inv .inv-head .m{font-family:var(--font-mono);font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--mu);text-align:right}
.inv .inv-note{font-size:12.5px;color:var(--mu);margin-top:16px;line-height:1.55;max-width:82ch}
.inv .inv-note b{color:var(--tx)}
/* card grid */
.inv .inv-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.inv .inv-card{display:flex;flex-direction:column;gap:8px;border:1px solid var(--ln);border-radius:2px;padding:22px 20px;background:hsl(var(--card));transition:border-color .15s,transform .12s}
.inv a.inv-card:hover{border-color:rgb(var(--c-ozone)/.45);transform:translateY(-2px)}
.inv .inv-card .k{font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--o)}
.inv .inv-card h4{font-size:16px;font-weight:800;letter-spacing:-.01em;line-height:1.15}
.inv .inv-card p{font-size:12.5px;color:var(--mu);line-height:1.5}
.inv .inv-card .go{margin-top:auto;font-size:12px;font-weight:700;color:var(--y)}
.inv .inv-card .lock{align-self:flex-start;font-family:var(--font-mono);font-size:8.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--mu);border:1px solid var(--ln);border-radius:2px;padding:2px 6px}
/* metrics */
.inv .inv-metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--ln);border:1px solid var(--ln)}
.inv .inv-metric{background:var(--bg);padding:22px 18px}
.inv .inv-metric .mv{font-size:clamp(22px,3.4vw,34px);font-weight:900;letter-spacing:-.03em;line-height:1;color:var(--y);text-shadow:0 0 24px rgb(var(--c-ozone)/.3);font-variant-numeric:tabular-nums}
.inv .inv-metric .ml{font-family:var(--font-mono);font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--mu);margin-top:10px}
.inv .inv-metric .mf{margin-top:9px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;display:inline-block;padding:2px 6px;border-radius:2px}
.inv .mf.unv{color:var(--al);border:1px solid var(--al)}
.inv .mf.live{color:var(--y);border:1px solid var(--y)}
/* rows / lists with status chips */
.inv .inv-rows{border:1px solid var(--ln)}
.inv .inv-row{display:flex;align-items:center;gap:14px;padding:15px 18px;border-bottom:1px solid rgb(var(--c-slate2)/.5);background:hsl(var(--card))}
.inv .inv-row:last-child{border-bottom:0}
.inv .inv-row .rmain{min-width:0;flex:1}
.inv .inv-row .rt{font-size:14px;font-weight:700;letter-spacing:-.01em}
.inv .inv-row .rd{font-size:12px;color:var(--mu);margin-top:2px;line-height:1.4}
.inv .chip{font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;border-radius:2px;white-space:nowrap;flex-shrink:0}
.inv .chip.ok{color:var(--y);border:1px solid rgb(var(--c-ozone)/.45)}
.inv .chip.pending{color:var(--o);border:1px solid rgb(var(--c-flare)/.45)}
.inv .chip.sample{color:var(--mu);border:1px solid var(--ln)}
.inv .chip.live{color:var(--y);border:1px solid rgb(var(--c-ozone)/.45)}
/* buttons */
.inv .inv-btn{display:inline-block;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:11px 18px;border-radius:2px;text-align:center;transition:transform .12s,background .15s,border-color .15s}
.inv .inv-btn.primary{background:var(--y);color:#000;box-shadow:0 0 24px rgb(var(--c-ozone)/.3)}
.inv .inv-btn.primary:hover{background:var(--o)}
.inv .inv-btn.ghost{border:1px solid var(--ln);color:var(--tx)}
.inv .inv-btn.ghost:hover{border-color:var(--y);color:var(--y)}
.inv .inv-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
/* empty state */
.inv .inv-empty{border:1px dashed rgb(var(--c-slate2)/.8);border-radius:2px;padding:22px 22px;font-size:13px;color:var(--mu);line-height:1.55;background:rgb(var(--c-ozone)/.02)}
.inv .inv-empty b{color:var(--tx)}
/* footer */
.inv .inv-foot{display:flex;flex-wrap:wrap;gap:24px;justify-content:space-between;margin-top:40px;padding-top:26px;border-top:1px solid var(--ln)}
.inv .inv-foot .fb{font-weight:900;font-size:22px;letter-spacing:-.02em}
.inv .inv-foot .fb span{color:var(--o)}
.inv .inv-foot p{font-size:12px;color:var(--mu);line-height:1.7;margin-top:10px;font-weight:500}
.inv .inv-foot .right{text-align:right}
.inv .inv-foot .cls{font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--al);border:1px solid var(--al);border-radius:2px;padding:6px 10px;display:inline-block}
@media(max-width:860px){.inv .inv-grid{grid-template-columns:repeat(2,1fr)}.inv .inv-metrics{grid-template-columns:repeat(2,1fr)}.inv .inv-head .m{display:none}}
@media(prefers-reduced-motion:reduce){.inv *{transition:none!important}}
`;
