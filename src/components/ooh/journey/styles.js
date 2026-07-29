// Journey Map — scoped low-fi styles (Orbital Perspective).
// Everything is namespaced under .jm-root with jm- prefixed classes so it
// never collides with Tailwind utilities or global app CSS. Brand accents,
// text and lines pull from the app's theme tokens (var(--c-*) / --flare) so
// the page follows whatever theme is active; the status semaphore + low-fi
// placeholder greys are fixed so their meaning never shifts across themes.

export const JM_CSS = `
.jm-root{
  --jm-ink:rgb(var(--c-silver));
  --jm-hivis:rgb(var(--c-ozone));
  --jm-flare:hsl(var(--flare));
  --jm-line:rgb(var(--c-slate2));
  --jm-dim:rgb(var(--c-dim));
  --jm-glow-y:0 0 22px rgba(237,255,0,.26);
  --jm-glow-o:0 0 22px rgba(255,92,0,.30);
  --jm-glow-g:0 0 18px rgba(57,255,20,.30);
  --live:#39FF14; --building:#EDFF00; --planned:#FF5C00; --exploring:rgba(255,255,255,.42);
  --lo0:#111214; --lo1:#17181b; --lo2:#26282d; --lo3:#33363c; --lo4:#44474e;
  --lo-line:rgba(255,255,255,.13);
  color:var(--jm-ink);
  font-family:var(--font-display);
}
.jm-root *{box-sizing:border-box}

/* header */
.jm-head{padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,.14)}
.jm-eyebrow{font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:var(--jm-hivis)}
.jm-title{font-size:clamp(28px,5vw,52px);font-weight:900;letter-spacing:-.025em;line-height:.96;margin:12px 0 8px}
.jm-title .dot{color:var(--jm-flare)}
.jm-sub{color:var(--jm-dim);font-size:14.5px;font-weight:500;max-width:74ch;line-height:1.5}
.jm-metarow{display:flex;flex-wrap:wrap;gap:20px;margin-top:18px;font-family:var(--font-mono);font-size:10.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--jm-dim)}
.jm-metarow b{color:var(--jm-hivis);font-weight:700}
.jm-legend{display:flex;flex-wrap:wrap;gap:9px;margin-top:20px}
.jm-chip{display:inline-flex;align-items:center;gap:7px;font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:5px 10px;border:1px solid;border-radius:3px}
.jm-chip .d{width:8px;height:8px;border-radius:50%}
.jm-chip.live{color:var(--live);border-color:rgba(57,255,20,.4)} .jm-chip.live .d{background:var(--live);box-shadow:var(--jm-glow-g)}
.jm-chip.building{color:var(--building);border-color:rgba(237,255,0,.4)} .jm-chip.building .d{background:var(--building);box-shadow:var(--jm-glow-y)}
.jm-chip.planned{color:var(--planned);border-color:rgba(255,92,0,.42)} .jm-chip.planned .d{background:var(--planned);box-shadow:var(--jm-glow-o)}
.jm-chip.exploring{color:var(--exploring);border-color:rgba(255,255,255,.22)} .jm-chip.exploring .d{background:var(--exploring)}

/* tab menu */
.jm-menu{position:sticky;top:56px;z-index:20;display:flex;gap:4px;overflow-x:auto;background:rgba(6,6,6,.9);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,.12);margin:22px -8px 0;padding:0 8px;scrollbar-width:none}
.jm-menu::-webkit-scrollbar{display:none}
.jm-tab{appearance:none;background:none;border:0;cursor:pointer;font-family:var(--font-display);color:var(--jm-dim);font-size:12.5px;font-weight:700;padding:15px 14px 13px;border-bottom:2px solid transparent;white-space:nowrap;transition:.15s}
.jm-tab:hover{color:var(--jm-ink)}
.jm-tab .n{font-family:var(--font-mono);font-size:10px;color:rgba(255,255,255,.3);margin-right:6px}
.jm-tab.jm-on{color:#000;background:var(--jm-hivis);border-radius:3px 3px 0 0}
.jm-tab.jm-on .n{color:rgba(0,0,0,.5)}
.jm-tab:focus-visible{outline:2px solid var(--jm-flare);outline-offset:-2px}

.jm-panel{padding-top:40px;animation:jmfade .28s ease}
@keyframes jmfade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

/* persona header */
.jm-phead{display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:start;border-left:3px solid var(--jm-flare);padding-left:18px}
.jm-badge{width:60px;height:60px;border:1px solid rgba(255,255,255,.18);border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:28px;background:var(--lo0);position:relative;flex:none}
.jm-bk{position:absolute;width:11px;height:11px;border:2px solid var(--jm-hivis)}
.jm-bk.tl{top:5px;left:5px;border-right:0;border-bottom:0}
.jm-bk.br{bottom:5px;right:5px;border-left:0;border-top:0}
.jm-pname{font-size:25px;font-weight:900;letter-spacing:-.02em;line-height:1}
.jm-ptier{font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--jm-hivis);margin-top:7px;display:inline-block}
.jm-pgoal{margin-top:10px;font-size:14.5px;font-weight:500;color:var(--jm-dim);max-width:70ch;line-height:1.45}
.jm-pgoal b{color:var(--jm-ink);font-weight:700}
.jm-pfacts{display:flex;flex-wrap:wrap;gap:16px;margin-top:13px;font-family:var(--font-mono);font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--jm-dim);font-weight:600}
.jm-pfacts b{color:var(--jm-hivis);font-weight:700}

/* rail */
.jm-raillabel{margin:30px 0 2px;font-family:var(--font-mono);font-size:10.5px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--jm-dim)}
.jm-rail{display:flex;overflow-x:auto;padding:14px 2px 22px}
.jm-rail::-webkit-scrollbar{height:8px}
.jm-rail::-webkit-scrollbar-thumb{background:var(--lo3);border-radius:8px}
.jm-stage{flex:0 0 244px;display:flex;flex-direction:column}
.jm-connect{display:flex;align-items:stretch}
.jm-arrow{flex:0 0 24px;text-align:center;color:var(--jm-flare);font-size:20px;font-weight:700;padding-top:118px}
.jm-scard{flex:1;background:var(--lo0);border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:14px;display:flex;flex-direction:column;gap:10px}
.jm-stagetop{display:flex;align-items:baseline;gap:8px}
.jm-idx{font-family:var(--font-mono);font-size:11px;font-weight:600;color:var(--jm-flare)}
.jm-sname{font-size:14px;font-weight:800;letter-spacing:-.01em;line-height:1.1}

/* low-fi screen kit */
.jm-screen{position:relative;background:var(--lo1);border:1px solid var(--lo-line);border-radius:5px;height:150px;overflow:hidden;padding:9px}
.jm-sbk{position:absolute;width:9px;height:9px;border:1.5px solid rgba(237,255,0,.55);z-index:4}
.jm-sbk.tl{top:5px;left:5px;border-right:0;border-bottom:0}
.jm-sbk.tr{top:5px;right:5px;border-left:0;border-bottom:0}
.jm-sbk.bl{bottom:5px;left:5px;border-right:0;border-top:0}
.jm-sbk.br{bottom:5px;right:5px;border-left:0;border-top:0}
.jm-bar{height:8px;border-radius:2px;background:var(--lo3);margin:2px 0}
.jm-bar.tall{height:12px}
.jm-bar.accent{background:var(--jm-hivis)} .jm-bar.accent2{background:var(--jm-flare)}
.jm-w40{width:40%}.jm-w55{width:55%}.jm-w70{width:70%}.jm-w85{width:85%}.jm-w100{width:100%}
.jm-row{display:flex;gap:6px;align-items:center;margin:6px 0}
.jm-sq{width:20px;height:20px;border-radius:3px;background:var(--lo2);flex:none}
.jm-sq.hatch{background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.06) 0 5px,transparent 5px 10px);background-color:var(--lo2)}
.jm-col{flex:1;display:flex;flex-direction:column;gap:4px}
.jm-map{position:absolute;inset:0;background:radial-gradient(circle at 30% 40%,rgba(57,255,20,.08),transparent 40%),var(--lo0);background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:18px 18px}
.jm-pin{position:absolute;width:7px;height:7px;border-radius:50%;background:var(--jm-flare);box-shadow:var(--jm-glow-o);transform:translate(-50%,-50%)}
.jm-pin.g{background:var(--live);box-shadow:var(--jm-glow-g)}
.jm-pin.y{background:var(--jm-hivis);box-shadow:var(--jm-glow-y)}
.jm-lbl{position:absolute;font-family:var(--font-mono);font-size:8px;color:rgba(255,255,255,.5);letter-spacing:.04em}
.jm-photo{height:56%;border-radius:3px;border-bottom:2px solid var(--jm-hivis);background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.04) 0 8px,transparent 8px 16px);background-color:var(--lo2);display:flex;align-items:center;justify-content:center}
.jm-ptxt{font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.3)}
.jm-stamp{position:absolute;top:8px;left:8px;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#FF0040;border:1px solid #FF0040;padding:2px 4px;transform:rotate(-4deg);z-index:5}
.jm-bignum{font-size:44px;font-weight:900;letter-spacing:-.04em;color:var(--jm-hivis);text-shadow:var(--jm-glow-y);line-height:.8}
.jm-btn{display:inline-block;background:var(--jm-hivis);color:#000;font-family:var(--font-mono);font-size:9px;font-weight:800;letter-spacing:.02em;padding:5px 9px;border-radius:99px;box-shadow:var(--jm-glow-y)}
.jm-btn.ghost{background:transparent;color:var(--jm-ink);border:1px solid rgba(255,255,255,.28);box-shadow:none}
.jm-cam{position:absolute;inset:9px;border:1px dashed rgba(237,255,0,.4);border-radius:4px}
.jm-reticle{position:absolute;top:50%;left:50%;width:34px;height:34px;transform:translate(-50%,-50%);border:1px solid var(--jm-hivis)}
.jm-reticle:before,.jm-reticle:after{content:"";position:absolute;background:var(--jm-hivis)}
.jm-reticle:before{top:50%;left:-8px;right:-8px;height:1px}
.jm-reticle:after{left:50%;top:-8px;bottom:-8px;width:1px}
.jm-tagmini{position:absolute;font-family:var(--font-mono);font-size:7px;background:rgba(0,0,0,.6);border:1px solid var(--live);color:var(--live);padding:1px 3px;border-radius:2px}
.jm-split{display:flex;height:100%;gap:5px}
.jm-split>div{flex:1;border-radius:3px;position:relative;overflow:hidden}
.jm-before{background:var(--lo2);background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.04) 0 8px,transparent 8px 16px)}
.jm-after{background:radial-gradient(circle at 50% 60%,rgba(57,255,20,.16),var(--lo1))}
.jm-sl{position:absolute;bottom:4px;left:4px;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.55)}
.jm-doc{background:var(--lo0);border:1px solid var(--lo-line);border-radius:3px;padding:8px;height:100%;display:flex;flex-direction:column;gap:5px}
.jm-seal{align-self:flex-end;width:16px;height:16px;border:1px solid var(--live);border-radius:50%}
.jm-idcard{height:100%;border-radius:6px;border:1px solid var(--jm-hivis);background:linear-gradient(135deg,var(--lo1),var(--lo0));padding:9px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:inset 0 0 0 1px rgba(237,255,0,.15)}
.jm-avatar{width:26px;height:26px;border-radius:3px;background:var(--lo3)}
.jm-tierbar{display:flex;gap:3px;align-items:center}
.jm-seg{height:6px;flex:1;border-radius:2px;background:var(--lo3)}
.jm-seg.fill{background:var(--live);box-shadow:var(--jm-glow-g)}

.jm-desc{font-size:12px;line-height:1.42;color:var(--jm-dim);font-weight:500}
.jm-desc b{color:var(--jm-ink);font-weight:700}
.jm-feats{display:flex;flex-direction:column;gap:5px;margin-top:2px}
.jm-feat{display:flex;align-items:center;gap:7px;font-family:var(--font-mono);font-size:10px;font-weight:600;color:rgba(255,255,255,.8)}
.jm-feat .d{width:7px;height:7px;border-radius:50%;flex:none}
.jm-feat.live .d{background:var(--live)} .jm-feat.building .d{background:var(--building)} .jm-feat.planned .d{background:var(--planned)} .jm-feat.exploring .d{background:var(--exploring)}
.jm-feat .st{margin-left:auto;font-size:8px;font-weight:600;letter-spacing:.08em;opacity:.7}
.jm-friction{font-size:10px;color:rgba(255,255,255,.42);font-style:italic;border-top:1px dashed rgba(255,255,255,.12);padding-top:7px;margin-top:auto}
.jm-friction b{color:var(--jm-flare);font-style:normal;font-weight:700}

/* overview + kit */
.jm-grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
.jm-obox{background:var(--lo0);border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:20px}
.jm-obox h3{font-size:14px;font-weight:800;letter-spacing:.02em;margin-bottom:10px;display:flex;align-items:center;gap:8px}
.jm-obox h3 .t{width:16px;height:5px;background:var(--jm-flare);box-shadow:var(--jm-glow-o)}
.jm-obox p{font-size:13px;line-height:1.5;color:var(--jm-dim);font-weight:500}
.jm-obox p b{color:var(--jm-ink)}
.jm-obox ul{list-style:none;margin-top:10px;display:flex;flex-direction:column;gap:8px;padding:0}
.jm-obox li{font-size:12.5px;color:var(--jm-dim);display:flex;gap:9px;line-height:1.35}
.jm-obox li .k{font-family:var(--font-mono);font-size:10px;color:var(--jm-hivis);flex:none;padding-top:1px}

.jm-sectitle{font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--jm-ink);margin:40px 0 4px}
.jm-sectitle .m{color:var(--jm-flare)}
.jm-secsub{font-size:12.5px;color:var(--jm-dim);font-weight:500;margin-bottom:14px;max-width:80ch}

.jm-kitgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;margin-top:12px}
.jm-kititem{background:var(--lo0);border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:12px}
.jm-kdemo{height:82px;position:relative;border-radius:4px;overflow:hidden;background:var(--lo1);border:1px solid var(--lo-line);padding:8px;margin-bottom:9px}
.jm-kname{font-size:11px;font-weight:700}
.jm-kdesc{font-size:10px;color:var(--jm-dim);margin-top:2px;line-height:1.3}

/* roadmap matrix */
.jm-matrix{margin-top:14px;border:1px solid rgba(255,255,255,.12);border-radius:8px;overflow-x:auto}
.jm-matrix table{width:100%;border-collapse:collapse;min-width:820px}
.jm-matrix thead th{background:var(--lo1);text-align:left;font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--jm-dim);padding:13px 14px;border-bottom:1px solid rgba(255,255,255,.14)}
.jm-matrix tbody td{padding:13px 14px;border-bottom:1px solid rgba(255,255,255,.07);font-size:12.5px;color:var(--jm-dim);vertical-align:top;font-weight:500}
.jm-matrix tbody tr:hover{background:rgba(237,255,0,.03)}
.jm-matrix td.fname{font-weight:800;color:var(--jm-ink);letter-spacing:-.01em}
.jm-matrix td .who{font-family:var(--font-mono);font-size:10px;color:var(--jm-dim)}
.jm-sbadge{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:4px 9px;border-radius:3px;border:1px solid;white-space:nowrap}
.jm-sbadge .d{width:7px;height:7px;border-radius:50%}
.jm-sbadge.live{color:var(--live);border-color:rgba(57,255,20,.4)} .jm-sbadge.live .d{background:var(--live)}
.jm-sbadge.building{color:var(--building);border-color:rgba(237,255,0,.4)} .jm-sbadge.building .d{background:var(--building)}
.jm-sbadge.planned{color:var(--planned);border-color:rgba(255,92,0,.42)} .jm-sbadge.planned .d{background:var(--planned)}
.jm-sbadge.exploring{color:var(--exploring);border-color:rgba(255,255,255,.22)} .jm-sbadge.exploring .d{background:var(--exploring)}

.jm-foot{margin-top:52px;padding-top:22px;border-top:1px solid rgba(255,255,255,.12);font-family:var(--font-mono);font-size:11px;color:rgba(255,255,255,.4);line-height:1.6}
.jm-foot b{color:var(--live)}

@media (max-width:640px){
  .jm-phead{grid-template-columns:1fr}
  .jm-arrow{padding-top:0;display:flex;align-items:center;transform:rotate(90deg)}
  .jm-stage{flex-basis:82vw}
}
@media (prefers-reduced-motion:reduce){.jm-panel{animation:none}}
`;
