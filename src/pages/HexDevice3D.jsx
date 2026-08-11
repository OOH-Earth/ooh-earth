import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Link } from "react-router-dom";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";
import { KW, fromLines } from "@/lib/hexagrams";

// OOH Earth — Living Coin · 3D (Lab)
// Spherified brass coin-cube whose six faces are detented rotary dials. A step
// sequencer runs the real I Ching program (King Wen / Fuxi / OOH protocol) over
// the dials — six dials = six hexagram lines, flipping yin/yang to display each
// state. Detent clicks + a per-hexagram chord. Cyberpunk energy-shell view.
// Ref: A. Judge (2021) — 64 hexagrams as a toroidal Ouroboros / firing engine.

const OZONE = 0xedff00, SILVER = 0x8a94a8;
const SIZE = 2.6, ROUND = 0.72, OFF = 1.2, MED = 0.72;
const N = 8, STEP = (Math.PI * 2) / N, YIN = 0, YANG = 4;
const FREQS = [110, 130.81, 146.83, 164.81, 196, 220];
const TRIGRAMS = ["111", "110", "101", "100", "011", "010", "001", "000"];

const kwLines = {}; Object.entries(KW).forEach(([k, kw]) => { const [lo, up] = k.split("|"); kwLines[kw] = (lo + up).split("").map(Number); });
const fuxi = Array.from({ length: 64 }, (_, i) => i.toString(2).padStart(6, "0").split("").map(Number));
const ORDERINGS = [(i) => kwLines[i + 1], (i) => fuxi[i], (i) => [0, 1, 2, 3, 4, 5].map((b) => (i >> b) & 1)];
const ORDER_NAMES = ["King Wen", "Fuxi", "OOH Protocol"];

const FACES = [
  { key: "bagua", cn: "太極八卦", py: "Tàijí · Bā Guà" }, { key: "coin", cn: "招財進寶", py: "Zhāo Cái Jìn Bǎo" },
  { key: "dragon", cn: "雙龍戲珠", py: "Shuāng Lóng Xì Zhū" }, { key: "bagua", cn: "財源滾滾", py: "Cái Yuán Gǔn Gǔn" },
  { key: "coin", cn: "時來運轉", py: "Shí Lái Yùn Zhuǎn" }, { key: "coin", cn: "牛轉乾坤", py: "Niú Zhuǎn Qián Kūn" },
];
const SIDES = [[0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, -1], [-1, 0, 0], [0, -1, 0]];

const P = (r, a) => new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
const circle = (r, n = 80) => { const p = []; for (let i = 0; i <= n; i++) p.push(P(r, (i / n) * Math.PI * 2)); return p; };
const arc = (r, a0, a1, n = 18) => { const p = []; for (let i = 0; i <= n; i++) p.push(P(r, a0 + (a1 - a0) * (i / n))); return p; };
const arcAt = (cx, cz, r, a0, a1, n = 18) => { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); p.push(new THREE.Vector3(cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r)); } return p; };
const mkLine = (pts, mat, loop) => new (loop ? THREE.LineLoop : THREE.Line)(new THREE.BufferGeometry().setFromPoints(pts), mat);

function roundCube(size, seg, t) {
  const g = new THREE.BoxGeometry(2, 2, 2, seg, seg, seg);
  const pos = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i); const x = v.x, y = v.y, z = v.z;
    const sx = x * Math.sqrt(1 - y * y / 2 - z * z / 2 + y * y * z * z / 3);
    const sy = y * Math.sqrt(1 - z * z / 2 - x * x / 2 + z * z * x * x / 3);
    const sz = z * Math.sqrt(1 - x * x / 2 - y * y / 2 + x * x * y * y / 3);
    v.set(THREE.MathUtils.lerp(x, sx, t), THREE.MathUtils.lerp(y, sy, t), THREE.MathUtils.lerp(z, sz, t)).multiplyScalar(size / 2);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}
function buildMotif(key, mat) {
  const g = new THREE.Group();
  g.add(mkLine(circle(MED), mat, true)); g.add(mkLine(circle(MED - 0.05), mat, true));
  for (let i = 0; i < N; i++) { const a = i * STEP; g.add(mkLine([P(MED, a), P(MED + 0.08, a)], mat)); }
  const taiji = (R) => {
    g.add(mkLine(circle(R), mat, true));
    g.add(mkLine(arcAt(0, -R / 2, R / 2, -Math.PI / 2, Math.PI / 2), mat));
    g.add(mkLine(arcAt(0, R / 2, R / 2, Math.PI / 2, 3 * Math.PI / 2), mat));
    g.add(mkLine(circle(R / 6).map((v) => v.clone().setZ(v.z - R / 2)), mat, true));
    g.add(mkLine(circle(R / 6).map((v) => v.clone().setZ(v.z + R / 2)), mat, true));
  };
  if (key === "bagua") {
    for (let i = 0; i < 8; i++) { const ang = -Math.PI / 2 + i * Math.PI / 4; TRIGRAMS[i].split("").forEach((bit, k) => { const r = 0.38 + k * 0.06; if (bit === "1") g.add(mkLine(arc(r, ang - 0.26, ang + 0.26, 8), mat)); else { g.add(mkLine(arc(r, ang - 0.26, ang - 0.05, 4), mat)); g.add(mkLine(arc(r, ang + 0.05, ang + 0.26, 4), mat)); } }); }
    taiji(0.16);
  } else if (key === "dragon") {
    taiji(0.17);
    for (const s of [-1, 1]) g.add(mkLine([new THREE.Vector3(s * 0.22, 0, -0.32), new THREE.Vector3(s * 0.5, 0, -0.08), new THREE.Vector3(s * 0.44, 0, 0.28), new THREE.Vector3(s * 0.24, 0, 0.46)], mat));
  } else {
    g.add(mkLine([P(0.12, Math.PI / 4), P(0.12, 3 * Math.PI / 4), P(0.12, 5 * Math.PI / 4), P(0.12, 7 * Math.PI / 4)], mat, true));
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; g.add(mkLine([P(0.32, a), P(0.5, a)], mat)); }
  }
  return g;
}

export default function HexDevice3D() {
  const mountRef = useRef(null);
  const S = useRef(null);
  const soundRef = useRef(true);
  const explodedRef = useRef(false);
  const orderingRef = useRef(2);
  const stepRef = useRef(0);
  const [ordering, setOrdering] = useState(2);
  const [seqOn, setSeqOn] = useState(true);
  const [sound, setSound] = useState(true);
  const [bpm, setBpm] = useState(108);
  const [exploded, setExploded] = useState(false);
  const [shell, setShell] = useState(true);
  const [labels, setLabels] = useState(true);
  const [lines, setLines] = useState([1, 0, 1, 1, 0, 1]);
  useEffect(() => { soundRef.current = sound; }, [sound]);
  useEffect(() => { explodedRef.current = exploded; }, [exploded]);
  useEffect(() => { orderingRef.current = ordering; }, [ordering]);

  const h = fromLines(lines);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || S.current) return;
    const w = mount.clientWidth, ht = mount.clientHeight || 560;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(w, ht); mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, w / ht, 0.1, 100); camera.position.set(3.2, 2.4, 4.9);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 3.4; controls.maxDistance = 11;
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const kl = new THREE.DirectionalLight(0xfff0d6, 1.0); kl.position.set(4, 6, 5); scene.add(kl);
    const fl = new THREE.DirectionalLight(0x6fd6ff, 0.4); fl.position.set(-5, -2, -4); scene.add(fl);

    let ac = null;
    const ensure = () => { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); return ac; };
    const playClick = () => {
      if (!soundRef.current || !ac) return; const c = ac, t = c.currentTime;
      const o = c.createOscillator(), g = c.createGain(); o.type = "square"; o.frequency.value = 1750;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.14, t + 0.001); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.03);
      const o2 = c.createOscillator(), g2 = c.createGain(); o2.type = "triangle"; o2.frequency.value = 300;
      g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.1, t + 0.002); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o2.connect(g2); g2.connect(c.destination); o2.start(t); o2.stop(t + 0.06);
    };
    const playChord = (ln) => {
      if (!soundRef.current || !ac) return; const c = ac, t = c.currentTime;
      ln.forEach((v, i) => { if (!v) return; const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.value = FREQS[i] * 2;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
        o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.36); });
    };

    const device = new THREE.Group(); scene.add(device);
    const geom = roundCube(SIZE, 8, ROUND);
    const wireMat = new THREE.MeshBasicMaterial({ color: SILVER, wireframe: true, transparent: true, opacity: 0.13 });
    const bodyWire = new THREE.Mesh(geom, wireMat); device.add(bodyWire);
    const shellMat = new THREE.MeshBasicMaterial({ color: OZONE, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const bodyShell = new THREE.Mesh(geom, shellMat); device.add(bodyShell);
    const shellEdge = new THREE.LineSegments(new THREE.EdgesGeometry(geom, 18), new THREE.LineBasicMaterial({ color: OZONE, transparent: true, opacity: 0.35 })); device.add(shellEdge);

    const motifMat = new THREE.LineBasicMaterial({ color: OZONE });
    const cyanMat = new THREE.LineBasicMaterial({ color: 0x6fd6ff, transparent: true, opacity: 0.7 });
    const pickMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const idxMat = new THREE.MeshBasicMaterial({ color: OZONE });

    const faces = [];
    SIDES.forEach((s, i) => {
      const grp = new THREE.Group(); const n = new THREE.Vector3(...s);
      grp.userData = { base: n.clone().multiplyScalar(OFF), ext: 1, idx: i, angle: 0, target: 0, lastDet: 0, flash: 0 };
      grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
      const spinner = new THREE.Group(); spinner.add(buildMotif(FACES[i].key, motifMat)); grp.add(spinner);
      const inner = new THREE.Group(); const ig = new THREE.Group(); ig.add(mkLine(circle(0.34), cyanMat, true));
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; ig.add(mkLine([P(0.28, a), P(0.34, a)], cyanMat)); }
      inner.add(ig); grp.add(inner);
      const idx = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 3), idxMat); idx.position.set(MED + 0.14, 0, 0); idx.rotation.z = Math.PI / 2; grp.add(idx);
      const pick = new THREE.Mesh(new THREE.CircleGeometry(MED, 24), pickMat); pick.rotation.x = -Math.PI / 2; pick.userData.idx = i; grp.add(pick);
      device.add(grp); faces.push({ grp, spinner, inner, idx, pick });
    });

    const orbitMat = new THREE.LineBasicMaterial({ color: OZONE, transparent: true, opacity: 0.16 });
    const orbits = [];
    [[0, 0, 0], [Math.PI / 2, 0, 0], [0, 0, Math.PI / 2]].forEach((rot) => {
      const outer = new THREE.Group(); outer.rotation.set(rot[0], rot[1], rot[2]);
      const inner = new THREE.Group(); inner.add(mkLine(circle(1.62), orbitMat, true));
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshBasicMaterial({ color: OZONE })); bead.position.set(1.62, 0, 0); inner.add(bead);
      outer.add(inner); device.add(outer); orbits.push({ inner, spin: 0.004 + Math.random() * 0.003 });
    });

    const rc = new THREE.Raycaster(), ptr = new THREE.Vector2(), dn = { x: 0, y: 0 };
    const onDown = (e) => { ensure(); dn.x = e.clientX; dn.y = e.clientY; };
    const onUp = (e) => {
      if (Math.hypot(e.clientX - dn.x, e.clientY - dn.y) > 6) return;
      const r = renderer.domElement.getBoundingClientRect();
      ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1; ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      rc.setFromCamera(ptr, camera);
      const hits = rc.intersectObjects(S.current.faces.map((x) => x.pick), false);
      if (hits.length) S.current.faces[hits[0].object.userData.idx].grp.userData.target += STEP;
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

    S.current = { renderer, scene, camera, controls, device, bodyWire, bodyShell, shellEdge, faces, orbits, spread: 1, raf: 0, playClick, playChord, ensure };

    const onResize = () => { const nw = mount.clientWidth, nh = mount.clientHeight || 560; camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh); };
    window.addEventListener("resize", onResize);
    const animate = () => {
      const st = S.current; if (!st) return; st.raf = requestAnimationFrame(animate);
      const now = performance.now(); const tgt = explodedRef.current ? 1.9 : 1; st.spread += (tgt - st.spread) * 0.08;
      st.faces.forEach((fc) => {
        const u = fc.grp.userData; u.ext += ((u.idx === 0 ? 1 : 1) - u.ext) * 0.1;
        fc.grp.position.copy(u.base).multiplyScalar(st.spread);
        u.angle += (u.target - u.angle) * 0.22; fc.spinner.rotation.y = u.angle;
        const d = Math.round(u.angle / STEP); if (d !== u.lastDet) { u.lastDet = d; u.flash = now; st.playClick(); }
        fc.idx.scale.setScalar(now - u.flash < 110 ? 1.7 : 1); fc.inner.rotation.y -= 0.018;
      });
      st.orbits.forEach((o) => { o.inner.rotation.y += o.spin; }); st.device.rotation.y += 0.0012;
      controls.update(); renderer.render(scene, camera);
    };
    animate();

    return () => {
      const st = S.current; if (st) cancelAnimationFrame(st.raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onDown); renderer.domElement.removeEventListener("pointerup", onUp);
      controls.dispose(); scene.traverse((/** @type {any} */ o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { const m = o.material; (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose()); } });
      renderer.dispose(); if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      if (ac) ac.close(); S.current = null;
    };
  }, []);

  // sequencer — runs the ordering program over the dials (6 dials = 6 lines)
  useEffect(() => {
    if (!seqOn) return;
    const id = setInterval(() => {
      const st = S.current; if (!st) return;
      const ln = ORDERINGS[orderingRef.current](stepRef.current);
      st.faces.forEach((fc, i) => { fc.grp.userData.target = (ln[i] ? YANG : YIN) * STEP; });
      st.playChord(ln); setLines(ln.slice());
      stepRef.current = (stepRef.current + 1) % 64;
    }, 60000 / bpm);
    return () => clearInterval(id);
  }, [seqOn, bpm]);

  // manual mode → read hexagram from dial detents
  useEffect(() => {
    const id = setInterval(() => {
      const st = S.current; if (!st || seqOn) return;
      setLines(st.faces.map((fc) => { const d = ((Math.round(fc.grp.userData.angle / STEP)) % N + N) % N; return d >= 3 && d <= 5 ? 1 : 0; }));
    }, 140);
    return () => clearInterval(id);
  }, [seqOn]);

  useEffect(() => { const st = S.current; if (!st) return; st.bodyShell.visible = shell; st.shellEdge.visible = shell; st.bodyWire.material.opacity = shell ? 0.2 : 0.13; }, [shell]);

  const Br = ({ c }) => <span className={`pointer-events-none absolute h-5 w-5 border-ozone/70 ${c}`} />;
  const Bars = ({ ln, big }) => (
    <div className={`flex flex-col-reverse gap-1 ${big ? "w-16" : "w-10"}`}>
      {ln.map((v, i) => (<div key={i} className="flex h-2 gap-1">{v ? <span className="w-full bg-ozone" /> : <><span className="flex-1 bg-silver/25" /><span className="flex-1 bg-silver/25" /></>}</div>))}
    </div>
  );

  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <style>{`@keyframes scan{0%{top:6%}100%{top:94%}}@keyframes blink{50%{opacity:.25}}`}</style>
      <Nav />
      <div className="mx-auto max-w-6xl page-top px-6 pb-12">
        <Breadcrumbs items={[{ label: "Lab", to: "/lab" }, { label: "3D Device" }]} className="mb-4" />
        <header className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">Living Coin <span className="text-ozone">3D</span></h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">Rotary dials · running the sequence</p>
          <div className="ml-auto flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em]">
            <Link to="/lab/sequencer" className="text-silver/40 transition-colors hover:text-ozone">Sequencer</Link>
            <Link to="/lab/status" className="text-silver/40 transition-colors hover:text-ozone">Status</Link>
            <span className="border border-flare/40 px-2 py-0.5 text-flare">Working copy</span>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.55fr_1fr]">
          <div className="border border-slate2 bg-card">
            <div className="relative overflow-hidden">
              <div ref={mountRef} className="h-[560px] w-full" style={{ touchAction: "none", cursor: "grab" }} />
            {labels && (
              <div className="pointer-events-none absolute inset-0">
                <Br c="left-3 top-3 border-l-2 border-t-2" /><Br c="right-3 top-3 border-r-2 border-t-2" /><Br c="left-3 bottom-3 border-l-2 border-b-2" /><Br c="right-3 bottom-3 border-r-2 border-b-2" />
                <div className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-ozone/25" /><div className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 bg-ozone/25" />
                <div className="absolute inset-x-6" style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(237,255,0,.4),transparent)", animation: "scan 5s linear infinite" }} />
                <div className="absolute left-4 top-8 font-mono text-[9px] uppercase leading-relaxed tracking-widest text-silver/45"><div>OOH-COIN · REV E</div><div className="text-ozone/70">{ORDER_NAMES[ordering]}</div><div>H{h.kw} · {h.binary}</div></div>
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-4 border-t border-slate2/60 bg-void/70 px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest text-silver/50 backdrop-blur">
              <span className="text-flare" style={{ animation: "blink 1.4s infinite" }}>● REC</span>
              <span className="text-ozone/70">{h.char} H{h.kw} {h.pinyin}</span><span>{h.lower.verb}×{h.upper.layer}</span>
              <span className="ml-auto">{ORDER_NAMES[ordering].toUpperCase()} · {h.binary} · SEQ {seqOn ? "RUN" : "HOLD"}</span>
            </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-slate2 p-3">
              <button onClick={() => { S.current?.ensure(); setSeqOn((v) => !v); }} className={`border-2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${seqOn ? "border-brand-green bg-brand-green/10 text-brand-green" : "border-slate2 text-silver/60"}`}>{seqOn ? "Run ▮▮" : "Run ▶"}</button>
              <label className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-silver/50">{bpm} BPM<input type="range" min={40} max={360} value={bpm} onChange={(e) => setBpm(+e.target.value)} className="w-20 accent-ozone" /></label>
              {/** @type {[string, boolean, () => void][]} */ ([["Sound", sound, () => { S.current?.ensure(); setSound((v) => !v); }], ["Shell", shell, () => setShell((v) => !v)], ["Explode", exploded, () => setExploded((v) => !v)], ["Labels", labels, () => setLabels((v) => !v)]]).map(([lab, on, fn]) => (
                <button key={lab} onClick={fn} className={`border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] ${on ? "border-ozone text-ozone" : "border-slate2 text-silver/50"}`}>{lab}</button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="border border-slate2 bg-card p-5">
              <div className="flex items-center gap-5">
                <div className="text-6xl leading-none text-ozone" style={{ textShadow: "0 0 24px rgba(237,255,0,.35)" }}>{h.char}</div>
                <div className="flex-1">
                  <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver/60">Hexagram {h.kw} · {h.pinyin}</div>
                  <div className="text-lg font-bold">{h.english}</div>
                  <div className="mt-1 font-mono text-[11px] text-silver/50"><span className="text-ozone">{h.lower.verb}</span> × <span className="text-ozone">{h.upper.layer}</span></div>
                  <div className="font-mono text-[10px] text-silver/40">{h.binary} · {h.hex}</div>
                </div>
                <Bars ln={lines} big />
              </div>
            </div>
            <div className="border border-slate2 bg-card p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Sequence ordering</div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {ORDER_NAMES.map((nm, i) => (
                  <button key={nm} onClick={() => setOrdering(i)} className={`border py-2 font-mono text-[10px] uppercase tracking-wide ${i === ordering ? "border-ozone text-ozone" : "border-slate2 text-silver/50"}`}>{nm}</button>
                ))}
              </div>
              <p className="mt-3 font-mono text-[10px] leading-relaxed text-silver/45">Six dials = six lines. The chosen program flips them yin/yang through the 64 states — each a click, each hexagram a chord. Click a face to notch it by hand.</p>
            </div>
            <div className="border border-slate2 bg-card p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Live combination · Ring 6 → 1</div>
              <div className="mt-3 flex items-end justify-between font-mono text-[11px]">
                {lines.slice().reverse().map((v, i) => (<div key={i} className="text-center"><div className={v ? "text-ozone" : "text-silver/40"}>{v}</div><div className="text-silver/30">R{6 - i}</div></div>))}
                <div className="border-l border-slate2 pl-3 text-right"><div className="text-ozone">{h.hex}</div><div className="text-silver/40">{h.dec}</div></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 border border-slate2 bg-card p-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Design reference · the science</div>
          <p className="mt-3 max-w-4xl font-mono text-[11px] leading-loose text-silver/60">The 64 hexagrams as a <span className="text-silver">toroidal Ouroboros</span>. Judge: the set "recalls the function of a combustion engine… the pattern in which the cylinders fire." The coin is that engine — six trigram dials firing in sequence, a living slice of the torus.</p>
          <a href="https://www.laetusinpraesens.org/docs20s/chinouro.php" target="_blank" rel="noreferrer" className="mt-3 inline-block font-mono text-[10px] uppercase tracking-widest text-silver/40 underline hover:text-ozone">Judge (2021) · Integrating Ouroboros &amp; Yi Jing in 3D →</a>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
