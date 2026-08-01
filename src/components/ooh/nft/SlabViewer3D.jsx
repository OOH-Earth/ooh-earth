import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { LABEL_COLORS } from "./nftPresets";

const GOLD = 0xd4af37, DARK = 0x1a1a1a, OZONE = 0xedff00;

// ── Card face texture (canvas) — OOH Earth branded grading label ──
function makeCardTexture(config, lc, artworkImg) {
  const c = document.createElement("canvas");
  c.width = 600; c.height = 840;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, 600, 840);

  // Artwork area
  const aX = 20, aY = 110, aW = 560, aH = 670;
  if (artworkImg) {
    const ir = artworkImg.width / artworkImg.height, ar = aW / aH;
    let dw, dh, dx, dy;
    if (ir > ar) { dh = aH; dw = aH * ir; dx = aX - (dw - aW) / 2; dy = aY; }
    else        { dw = aW; dh = aW / ir; dx = aX; dy = aY - (dh - aH) / 2; }
    ctx.drawImage(artworkImg, dx, dy, dw, dh);
  } else {
    ctx.fillStyle = "#111"; ctx.fillRect(aX, aY, aW, aH);
    ctx.strokeStyle = "rgba(241,241,241,0.05)"; ctx.lineWidth = 1;
    for (let i = 40; i < aW; i += 40) { ctx.beginPath(); ctx.moveTo(aX + i, aY); ctx.lineTo(aX + i, aY + aH); ctx.stroke(); }
    for (let i = 40; i < aH; i += 40) { ctx.beginPath(); ctx.moveTo(aX, aY + i); ctx.lineTo(aX + aW, aY + i); ctx.stroke(); }
    ctx.fillStyle = "rgba(237,255,0,0.22)"; ctx.font = "bold 52px monospace"; ctx.textAlign = "center";
    ctx.fillText("ADBUSTING", 300, aY + aH / 2 - 10);
    ctx.font = "18px monospace"; ctx.fillStyle = "rgba(241,241,241,0.14)";
    ctx.fillText("// upload or generate artwork", 300, aY + aH / 2 + 30);
  }

  // Label header
  const lY = 12, lH = 82;
  ctx.fillStyle = "#000"; ctx.fillRect(12, lY, 576, lH);
  ctx.strokeStyle = lc.bg; ctx.lineWidth = 2; ctx.strokeRect(12, lY, 576, lH);
  ctx.fillStyle = "#fff"; ctx.font = "bold 17px monospace"; ctx.textAlign = "left";
  ctx.fillText("OOH EARTH", 28, lY + 30);
  ctx.font = "11px monospace"; ctx.fillStyle = "rgba(241,241,241,0.5)";
  ctx.fillText("SUBVERTISING · ADBUSTING NFT", 28, lY + 50);
  ctx.font = "10px monospace"; ctx.fillStyle = "rgba(241,241,241,0.35)";
  ctx.fillText(config.title || "Untitled", 28, lY + 68);

  // Grade badge
  const bX = 506, bY = lY + 16, bW = 68, bH = 52;
  ctx.fillStyle = lc.bg; ctx.fillRect(bX, bY, bW, bH);
  ctx.fillStyle = lc.fg; ctx.font = "bold 30px monospace"; ctx.textAlign = "center";
  ctx.fillText(String(config.grade || "9.5"), bX + bW / 2, bY + 38);

  // Footer bar
  const fY = 795, fH = 42;
  ctx.fillStyle = lc.bg; ctx.fillRect(12, fY, 576, fH);
  ctx.fillStyle = lc.fg; ctx.font = "bold 13px monospace"; ctx.textAlign = "center";
  ctx.fillText(`OOH·EARTH · ${config.serial || "OOH-00000"} · ${(config.casing || "slab").toUpperCase()}`, 300, fY + 27);

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

// ── Build the 3D slab group for the selected casing ──
function buildSlab(config, cardTexture) {
  const grp = new THREE.Group();
  const casing = config.casing, frosted = config.finish === "frosted";
  const cardW = 1.5, cardH = 2.1;

  const frameMat = new THREE.MeshStandardMaterial({ color: DARK, roughness: 0.3, metalness: 0.6 });
  const clearMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, transparent: true, opacity: frosted ? 0.3 : 0.06,
    roughness: frosted ? 0.85 : 0.05, metalness: 0, depthWrite: false, side: THREE.DoubleSide,
  });
  const goldMat = new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.2, metalness: 0.9 });

  // Card body + face
  grp.add(new THREE.Mesh(
    new THREE.BoxGeometry(cardW, cardH, 0.012),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.7 }),
  ));
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(cardW, cardH),
    new THREE.MeshStandardMaterial({ map: cardTexture, roughness: 0.4, metalness: 0.1 }),
  );
  face.position.z = 0.007;
  grp.add(face);

  if (casing === "slab" || casing === "magnetic") {
    const t = 0.07, d = 0.09, topH = 0.14;
    const top = new THREE.Mesh(new THREE.BoxGeometry(cardW + t * 2, topH, d), frameMat);
    top.position.y = cardH / 2 + topH / 2; grp.add(top);
    const bot = new THREE.Mesh(new THREE.BoxGeometry(cardW + t * 2, t, d), frameMat);
    bot.position.y = -cardH / 2 - t / 2; grp.add(bot);
    const left = new THREE.Mesh(new THREE.BoxGeometry(t, cardH, d), frameMat);
    left.position.x = -cardW / 2 - t / 2; grp.add(left);
    const right = new THREE.Mesh(new THREE.BoxGeometry(t, cardH, d), frameMat);
    right.position.x = cardW / 2 + t / 2; grp.add(right);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(cardW + 0.02, cardH + 0.02), clearMat);
    win.position.z = 0.05; grp.add(win);
    if (casing === "magnetic") {
      const mag = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16),
        new THREE.MeshStandardMaterial({ color: OZONE, roughness: 0.3, metalness: 0.7 }),
      );
      mag.rotation.x = Math.PI / 2;
      mag.position.set(0, cardH / 2 + topH / 2, 0.05);
      grp.add(mag);
    }
  } else if (casing === "screwdown") {
    const cW = cardW + 0.14, cH = cardH + 0.14, cD = 0.08;
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(cW, cH, cD), clearMat));
    const sg = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12);
    const off = 0.08;
    [[cW/2-off, cH/2-off], [-cW/2+off, cH/2-off], [cW/2-off, -cH/2+off], [-cW/2+off, -cH/2+off]].forEach(([x, y]) => {
      const s = new THREE.Mesh(sg, goldMat);
      s.rotation.x = Math.PI / 2;
      s.position.set(x, y, cD / 2 + 0.01);
      grp.add(s);
    });
  } else if (casing === "toploader") {
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(cardW + 0.06, cardH + 0.06, 0.03), clearMat));
  } else if (casing === "sleeve") {
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(cardW + 0.03, cardH + 0.03, 0.02), clearMat));
  }

  return grp;
}

const SlabViewer3D = forwardRef(function SlabViewer3D({ config, artworkUrl }, ref) {
  const mountRef = useRef(null);
  const S = useRef(null);

  useImperativeHandle(ref, () => ({
    exportPNG: () => {
      const st = S.current;
      if (!st) return;
      st.renderer.render(st.scene, st.camera);
      const a = document.createElement("a");
      a.href = st.renderer.domElement.toDataURL("image/png");
      a.download = `ooh-nft-${config.serial || "prototype"}.png`;
      a.click();
    },
  }));

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || S.current) return;
    const w = mount.clientWidth, h = mount.clientHeight || 520;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
    camera.position.set(0.5, 0.2, 5.5);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.enablePan = false;
    controls.minDistance = 3.5; controls.maxDistance = 12;
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const kl = new THREE.DirectionalLight(0xfff0d6, 1.0); kl.position.set(3, 5, 4); scene.add(kl);
    const fl = new THREE.DirectionalLight(0x6fd6ff, 0.35); fl.position.set(-4, -2, -3); scene.add(fl);
    S.current = { renderer, scene, camera, controls, slab: null, raf: 0 };
    const onResize = () => {
      const nw = mount.clientWidth, nh = mount.clientHeight || 520;
      camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);
    const animate = () => {
      const st = S.current; if (!st) return;
      st.raf = requestAnimationFrame(animate);
      if (st.slab) {
        st.slab.rotation.y += 0.003;
        st.slab.position.y = Math.sin(performance.now() * 0.0008) * 0.04;
      }
      controls.update(); renderer.render(scene, camera);
    };
    animate();
    return () => {
      const st = S.current; if (st) cancelAnimationFrame(st.raf);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { const m = o.material; (Array.isArray(m) ? m : [m]).forEach((x) => { if (x.map) x.map.dispose(); x.dispose(); }); }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      S.current = null;
    };
  }, []);

  useEffect(() => {
    const st = S.current; if (!st) return;
    let cancelled = false;
    if (st.slab) {
      st.scene.remove(st.slab);
      st.slab.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { const m = o.material; (Array.isArray(m) ? m : [m]).forEach((x) => { if (x.map) x.map.dispose(); x.dispose(); }); }
      });
      st.slab = null;
    }
    const lc = LABEL_COLORS.find((c) => c.id === config.labelColor) || LABEL_COLORS[0];
    const build = (img) => {
      if (cancelled) return;
      const tex = makeCardTexture(config, lc, img);
      st.slab = buildSlab(config, tex);
      st.scene.add(st.slab);
    };
    if (artworkUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => build(img);
      img.onerror = () => build(null);
      img.src = artworkUrl;
    } else {
      build(null);
    }
    return () => { cancelled = true; };
  }, [config.casing, config.finish, config.title, config.grade, config.serial, config.labelColor, artworkUrl]);

  return (
    <div className="relative overflow-hidden border border-slate2 bg-card">
      <style>{`@keyframes nft-scan{0%{top:6%}100%{top:94%}}`}</style>
      <div ref={mountRef} className="h-[520px] w-full" style={{ touchAction: "none", cursor: "grab" }} />
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-ozone/60" />
        <span className="absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-ozone/60" />
        <span className="absolute left-3 bottom-3 h-4 w-4 border-l-2 border-b-2 border-ozone/60" />
        <span className="absolute right-3 bottom-3 h-4 w-4 border-r-2 border-b-2 border-ozone/60" />
        <div className="absolute inset-x-6" style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(237,255,0,.4),transparent)", animation: "nft-scan 5s linear infinite" }} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-3 border-t border-slate2/60 bg-void/70 px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest text-silver/50 backdrop-blur">
        <span className="text-ozone">{(config.casing || "slab").toUpperCase()}</span>
        <span>{(config.finish || "clear").toUpperCase()}</span>
        <span className="ml-auto">DRAG TO ROTATE</span>
      </div>
    </div>
  );
});

export default SlabViewer3D;