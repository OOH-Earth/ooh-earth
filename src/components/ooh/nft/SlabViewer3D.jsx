import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { LABEL_COLORS } from "./nftPresets";

const GOLD = 0xd4af37, FRAME = 0x141414, WELL = 0x0e0e0e, OZONE = 0xedff00;

// ── Card face texture — full grading label with barcode + sub-grades ──
function makeCardTexture(config, lc, artworkImg) {
  const c = document.createElement("canvas");
  c.width = 600; c.height = 840;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, 600, 840);

  // Artwork area
  const aX = 16, aY = 106, aW = 568, aH = 678;
  if (artworkImg) {
    const ir = artworkImg.width / artworkImg.height, ar = aW / aH;
    let dw, dh, dx, dy;
    if (ir > ar) { dh = aH; dw = aH * ir; dx = aX - (dw - aW) / 2; dy = aY; }
    else        { dw = aW; dh = aW / ir; dx = aX; dy = aY - (dh - aH) / 2; }
    ctx.drawImage(artworkImg, dx, dy, dw, dh);
  } else {
    ctx.fillStyle = "#111"; ctx.fillRect(aX, aY, aW, aH);
    ctx.strokeStyle = "rgba(241,241,241,0.04)"; ctx.lineWidth = 1;
    for (let i = 40; i < aW; i += 40) { ctx.beginPath(); ctx.moveTo(aX + i, aY); ctx.lineTo(aX + i, aY + aH); ctx.stroke(); }
    for (let i = 40; i < aH; i += 40) { ctx.beginPath(); ctx.moveTo(aX, aY + i); ctx.lineTo(aX + aW, aY + i); ctx.stroke(); }
    ctx.fillStyle = "rgba(237,255,0,0.2)"; ctx.font = "bold 52px monospace"; ctx.textAlign = "center";
    ctx.fillText("ADBUSTING", 300, aY + aH / 2 - 10);
    ctx.font = "18px monospace"; ctx.fillStyle = "rgba(241,241,241,0.12)";
    ctx.fillText("// upload or generate artwork", 300, aY + aH / 2 + 30);
  }

  // Label header — dark bg + colored border
  const lY = 10, lH = 88;
  ctx.fillStyle = "#000"; ctx.fillRect(10, lY, 580, lH);
  ctx.strokeStyle = lc.bg; ctx.lineWidth = 2; ctx.strokeRect(10, lY, 580, lH);

  // Brand + title
  ctx.fillStyle = "#fff"; ctx.font = "bold 17px monospace"; ctx.textAlign = "left";
  ctx.fillText("OOH EARTH", 26, lY + 24);
  ctx.font = "10px monospace"; ctx.fillStyle = "rgba(241,241,241,0.5)";
  ctx.fillText("SUBVERTISING · ADBUSTING NFT", 26, lY + 40);
  ctx.font = "bold 12px monospace"; ctx.fillStyle = "#fff";
  ctx.fillText(config.title || "Untitled", 26, lY + 58);

  // Barcode
  ctx.fillStyle = "#fff";
  let bx = 26;
  for (let i = 0; i < 48; i++) {
    const w = (i * 7 + 3) % 5 < 2 ? 1 : 2;
    if (i % 2 === 0) ctx.fillRect(bx, lY + 64, w, 16);
    bx += w + 1;
  }
  ctx.font = "9px monospace"; ctx.fillStyle = "rgba(241,241,241,0.4)";
  ctx.fillText(config.serial || "OOH-00000", 240, lY + 78);

  // Grade badge
  const bX = 504, bY = lY + 12, bW = 72, bH = 58;
  ctx.fillStyle = lc.bg; ctx.fillRect(bX, bY, bW, bH);
  ctx.fillStyle = lc.fg; ctx.font = "bold 30px monospace"; ctx.textAlign = "center";
  ctx.fillText(String(config.grade || "9.5"), bX + bW / 2, bY + 34);
  ctx.font = "bold 8px monospace";
  const g = String(config.grade);
  ctx.fillText(g === "10" ? "GEM MT" : g === "9.5" ? "MINT" : "GRADE", bX + bW / 2, bY + 50);

  // Footer bar
  const fY = 792, fH = 44;
  ctx.fillStyle = lc.bg; ctx.fillRect(10, fY, 580, fH);
  ctx.fillStyle = lc.fg; ctx.font = "bold 13px monospace"; ctx.textAlign = "center";
  ctx.fillText(`OOH·EARTH · ${config.serial || "OOH-00000"} · ${(config.casing || "slab").toUpperCase()}`, 300, fY + 28);

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  tex.anisotropy = 8;
  return tex;
}

// ── Helpers ──
function rbox(w, h, d, r = 0.02) {
  return new RoundedBoxGeometry(w, h, d, 6, r);
}

// ── Build the 3D slab — rounded frame, inner well, glass layers ──
function buildSlab(config, cardTexture, st) {
  const grp = new THREE.Group();
  const casing = config.casing, frosted = config.finish === "frosted";
  const cardW = 1.5, cardH = 2.1;

  const frameMat = new THREE.MeshPhysicalMaterial({
    color: FRAME, roughness: 0.18, metalness: 0.4,
    clearcoat: 0.9, clearcoatRoughness: 0.12, envMapIntensity: 1.2,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, transmission: frosted ? 0.35 : 0.95,
    transparent: true, opacity: 1,
    roughness: frosted ? 0.7 : 0.02, metalness: 0,
    clearcoat: 1, clearcoatRoughness: frosted ? 0.5 : 0.01,
    ior: 1.52, thickness: 0.08, envMapIntensity: 1.5,
    side: THREE.DoubleSide,
  });
  const wellMat = new THREE.MeshStandardMaterial({ color: WELL, roughness: 0.45, metalness: 0.2 });
  const goldMat = new THREE.MeshPhysicalMaterial({
    color: GOLD, roughness: 0.1, metalness: 0.95,
    clearcoat: 0.6, clearcoatRoughness: 0.05, envMapIntensity: 1.8,
  });
  const cardBodyMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.5, metalness: 0.1 });
  const cardFaceMat = new THREE.MeshPhysicalMaterial({
    map: cardTexture, roughness: 0.3, metalness: 0.1,
    clearcoat: 0.5, clearcoatRoughness: 0.3, envMapIntensity: 0.7,
  });
  if (st) st.cardFaceMat = cardFaceMat;

  // Card body + face
  const cardBody = new THREE.Mesh(rbox(cardW, cardH, 0.02, 0.03), cardBodyMat);
  grp.add(cardBody);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(cardW - 0.04, cardH - 0.04), cardFaceMat);
  face.position.z = 0.012;
  grp.add(face);

  if (casing === "slab" || casing === "magnetic") {
    const t = 0.08, d = 0.14, topH = 0.18;
    const fW = cardW + t * 2;
    // Frame bars (rounded)
    const top = new THREE.Mesh(rbox(fW, topH, d, 0.03), frameMat);
    top.position.y = cardH / 2 + topH / 2; grp.add(top);
    const bot = new THREE.Mesh(rbox(fW, t, d, 0.025), frameMat);
    bot.position.y = -cardH / 2 - t / 2; grp.add(bot);
    const left = new THREE.Mesh(rbox(t, cardH, d, 0.025), frameMat);
    left.position.x = -cardW / 2 - t / 2; grp.add(left);
    const right = new THREE.Mesh(rbox(t, cardH, d, 0.025), frameMat);
    right.position.x = cardW / 2 + t / 2; grp.add(right);
    // Inner well — thin dark bars around card edges, creating recessed look
    const wT = 0.012, wD = 0.1;
    const wTop = new THREE.Mesh(rbox(cardW, wT, wD, 0.005), wellMat); wTop.position.set(0, cardH / 2 - wT / 2, 0.03); grp.add(wTop);
    const wBot = new THREE.Mesh(rbox(cardW, wT, wD, 0.005), wellMat); wBot.position.set(0, -cardH / 2 + wT / 2, 0.03); grp.add(wBot);
    const wLeft = new THREE.Mesh(rbox(wT, cardH - wT * 2, wD, 0.005), wellMat); wLeft.position.set(-cardW / 2 + wT / 2, 0, 0.03); grp.add(wLeft);
    const wRight = new THREE.Mesh(rbox(wT, cardH - wT * 2, wD, 0.005), wellMat); wRight.position.set(cardW / 2 - wT / 2, 0, 0.03); grp.add(wRight);
    // Front + back glass
    const winF = new THREE.Mesh(new THREE.PlaneGeometry(fW - 0.02, cardH + topH + 0.02), glassMat);
    winF.position.set(0, topH / 2 - 0.01, d / 2 + 0.001); grp.add(winF);
    const winB = new THREE.Mesh(new THREE.PlaneGeometry(fW - 0.02, cardH + topH + 0.02), glassMat);
    winB.position.set(0, topH / 2 - 0.01, -(d / 2 + 0.001)); winB.rotation.y = Math.PI; grp.add(winB);
    // Magnetic stud
    if (casing === "magnetic") {
      const mag = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.03, 24),
        new THREE.MeshPhysicalMaterial({ color: OZONE, roughness: 0.2, metalness: 0.8, clearcoat: 0.7, envMapIntensity: 1.3 }),
      );
      mag.rotation.x = Math.PI / 2;
      mag.position.set(0, cardH / 2 + topH / 2, d / 2 + 0.02);
      grp.add(mag);
    }
  } else if (casing === "screwdown") {
    const cW = cardW + 0.16, cH = cardH + 0.16, cD = 0.1;
    grp.add(new THREE.Mesh(rbox(cW, cH, cD, 0.03), glassMat));
    // Gold screws (rounded heads)
    const sg = new THREE.CylinderGeometry(0.045, 0.045, 0.04, 20);
    const off = 0.09;
    [[cW/2-off, cH/2-off], [-cW/2+off, cH/2-off], [cW/2-off, -cH/2+off], [-cW/2+off, -cH/2+off]].forEach(([x, y]) => {
      const sf = new THREE.Mesh(sg, goldMat); sf.rotation.x = Math.PI / 2; sf.position.set(x, y, cD / 2 + 0.01); grp.add(sf);
      const sb = new THREE.Mesh(sg, goldMat); sb.rotation.x = Math.PI / 2; sb.position.set(x, y, -(cD / 2 + 0.01)); grp.add(sb);
    });
  } else if (casing === "toploader") {
    grp.add(new THREE.Mesh(rbox(cardW + 0.06, cardH + 0.06, 0.04, 0.02), glassMat));
  } else if (casing === "sleeve") {
    grp.add(new THREE.Mesh(rbox(cardW + 0.04, cardH + 0.04, 0.025, 0.015), glassMat));
  }

  return grp;
}

// ── Auto-fit camera to slab bounding box (fixes cropping at any rotation) ──
function fitCamera(camera, controls, slab) {
  slab.rotation.y = 0; slab.updateMatrixWorld();
  const box = new THREE.Box3().setFromObject(slab);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const diag = Math.sqrt(size.x * size.x + size.y * size.y);
  const fov = camera.fov * Math.PI / 180;
  const dist = (diag / 2) / Math.tan(fov / 2) * 1.35;
  camera.position.set(center.x, center.y, center.z + dist);
  controls.target.copy(center);
  controls.minDistance = dist * 0.35;
  controls.maxDistance = dist * 3;
  controls.update();
  return { dist, center };
}

const SlabViewer3D = forwardRef(function SlabViewer3D({ config, artworkUrl }, ref) {
  const mountRef = useRef(null);
  const S = useRef(null);

  useImperativeHandle(ref, () => ({
    exportPNG: () => {
      const st = S.current; if (!st) return;
      st.renderer.render(st.scene, st.camera);
      const a = document.createElement("a");
      a.href = st.renderer.domElement.toDataURL("image/png");
      a.download = `ooh-nft-${config.serial || "prototype"}.png`;
      a.click();
    },
  }));

  // ── Scene init (once) ──
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || S.current) return;
    const w = mount.clientWidth, h = mount.clientHeight || 560;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    camera.position.set(0, 0, 7);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.enablePan = false;
    controls.autoRotate = false;

    // Studio 3-point lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.1));
    const key = new THREE.DirectionalLight(0xfff0d6, 1.3); key.position.set(4, 6, 5); scene.add(key);
    const fill = new THREE.DirectionalLight(0x6fd6ff, 0.5); fill.position.set(-5, -1, 3); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xedff00, 0.4); rim.position.set(0, 3, -6); scene.add(rim);

    S.current = { renderer, scene, camera, controls, slab: null, raf: 0, cardFaceMat: null, fitDist: 7, fitCenter: new THREE.Vector3(0, 0, 0) };

    const onResize = () => {
      const nw = mount.clientWidth, nh = mount.clientHeight || 560;
      camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    const animate = () => {
      const st = S.current; if (!st) return;
      st.raf = requestAnimationFrame(animate);
      if (st.slab) {
        st.slab.rotation.y += 0.0025;
        st.slab.position.y = Math.sin(performance.now() * 0.0008) * 0.03;
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
      if (scene.environment) scene.environment.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      S.current = null;
    };
  }, []);

  // ── Phase 1: Geometry rebuild (casing / finish change) + auto-fit ──
  useEffect(() => {
    const st = S.current; if (!st) return;
    let cancelled = false;
    if (st.slab) {
      st.scene.remove(st.slab);
      st.slab.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { const m = o.material; (Array.isArray(m) ? m : [m]).forEach((x) => { if (x.map) x.map.dispose(); x.dispose(); }); }
      });
      st.slab = null; st.cardFaceMat = null;
    }
    const lc = LABEL_COLORS.find((c) => c.id === config.labelColor) || LABEL_COLORS[0];
    const build = (img) => {
      if (cancelled) return;
      const tex = makeCardTexture(config, lc, img);
      st.slab = buildSlab(config, tex, st);
      st.scene.add(st.slab);
      const { dist, center } = fitCamera(st.camera, st.controls, st.slab);
      st.fitDist = dist; st.fitCenter = center;
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
  }, [config.casing, config.finish]);

  // ── Phase 2: Texture-only update (label / grade / serial / colour / artwork) ──
  useEffect(() => {
    const st = S.current; if (!st || !st.cardFaceMat) return;
    let cancelled = false;
    const lc = LABEL_COLORS.find((c) => c.id === config.labelColor) || LABEL_COLORS[0];
    const update = (img) => {
      if (cancelled) return;
      const tex = makeCardTexture(config, lc, img);
      if (st.cardFaceMat.map) st.cardFaceMat.map.dispose();
      st.cardFaceMat.map = tex;
      st.cardFaceMat.needsUpdate = true;
    };
    if (artworkUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => update(img);
      img.onerror = () => update(null);
      img.src = artworkUrl;
    } else {
      update(null);
    }
    return () => { cancelled = true; };
  }, [config.title, config.grade, config.serial, config.labelColor, artworkUrl]);

  const zoomIn = () => {
    const st = S.current; if (!st) return;
    const dist = st.camera.position.distanceTo(st.controls.target);
    const newDist = Math.max(st.controls.minDistance, dist - 0.8);
    const dir = st.camera.position.clone().sub(st.controls.target).normalize();
    st.camera.position.copy(st.controls.target).add(dir.multiplyScalar(newDist));
    st.controls.update();
  };
  const zoomOut = () => {
    const st = S.current; if (!st) return;
    const dist = st.camera.position.distanceTo(st.controls.target);
    const newDist = Math.min(st.controls.maxDistance, dist + 0.8);
    const dir = st.camera.position.clone().sub(st.controls.target).normalize();
    st.camera.position.copy(st.controls.target).add(dir.multiplyScalar(newDist));
    st.controls.update();
  };
  const resetView = () => {
    const st = S.current; if (!st) return;
    st.camera.position.set(st.fitCenter.x, st.fitCenter.y, st.fitCenter.z + st.fitDist);
    st.controls.target.copy(st.fitCenter);
    st.controls.update();
  };

  return (
    <div className="relative overflow-hidden border border-slate2 bg-card">
      <style>{`@keyframes nft-scan{0%{top:6%}100%{top:94%}}`}</style>
      <div ref={mountRef} className="h-[560px] w-full" style={{ touchAction: "none", cursor: "grab" }} />
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-ozone/60" />
        <span className="absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-ozone/60" />
        <span className="absolute left-3 bottom-3 h-4 w-4 border-l-2 border-b-2 border-ozone/60" />
        <span className="absolute right-3 bottom-3 h-4 w-4 border-r-2 border-b-2 border-ozone/60" />
        <div className="absolute inset-x-6" style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(237,255,0,.4),transparent)", animation: "nft-scan 5s linear infinite" }} />
      </div>
      <div className="absolute right-3 top-12 flex flex-col gap-1.5">
        <button onClick={zoomIn} aria-label="Zoom in" className="flex h-8 w-8 items-center justify-center border border-slate2 bg-void/80 text-silver/70 backdrop-blur transition-colors hover:border-ozone hover:text-ozone"><ZoomIn className="h-3.5 w-3.5" /></button>
        <button onClick={zoomOut} aria-label="Zoom out" className="flex h-8 w-8 items-center justify-center border border-slate2 bg-void/80 text-silver/70 backdrop-blur transition-colors hover:border-ozone hover:text-ozone"><ZoomOut className="h-3.5 w-3.5" /></button>
        <button onClick={resetView} aria-label="Reset view" className="flex h-8 w-8 items-center justify-center border border-slate2 bg-void/80 text-silver/70 backdrop-blur transition-colors hover:border-ozone hover:text-ozone"><Maximize2 className="h-3.5 w-3.5" /></button>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-3 border-t border-slate2/60 bg-void/70 px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest text-silver/50 backdrop-blur">
        <span className="text-ozone">{(config.casing || "slab").toUpperCase()}</span>
        <span>{(config.finish || "clear").toUpperCase()}</span>
        <span className="ml-auto">DRAG TO ROTATE · SCROLL TO ZOOM</span>
      </div>
    </div>
  );
});

export default SlabViewer3D;