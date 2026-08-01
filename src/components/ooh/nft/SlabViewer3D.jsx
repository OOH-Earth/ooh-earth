import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { LABEL_COLORS } from "./nftPresets";

const GOLD = 0xd4af37, DARK = 0x1a1a1a, OZONE = 0xedff00;

// ── Card face texture (canvas) — OOH Earth branded grading label ──
function makeCardTexture(config, lc, artworkImg) {
  const c = document.createElement("canvas");
  c.width = 600; c.height = 840;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, 600, 840);

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

  const lY = 12, lH = 82;
  ctx.fillStyle = "#000"; ctx.fillRect(12, lY, 576, lH);
  ctx.strokeStyle = lc.bg; ctx.lineWidth = 2; ctx.strokeRect(12, lY, 576, lH);
  ctx.fillStyle = "#fff"; ctx.font = "bold 17px monospace"; ctx.textAlign = "left";
  ctx.fillText("OOH EARTH", 28, lY + 30);
  ctx.font = "11px monospace"; ctx.fillStyle = "rgba(241,241,241,0.5)";
  ctx.fillText("SUBVERTISING · ADBUSTING NFT", 28, lY + 50);
  ctx.font = "10px monospace"; ctx.fillStyle = "rgba(241,241,241,0.35)";
  ctx.fillText(config.title || "Untitled", 28, lY + 68);

  const bX = 506, bY = lY + 16, bW = 68, bH = 52;
  ctx.fillStyle = lc.bg; ctx.fillRect(bX, bY, bW, bH);
  ctx.fillStyle = lc.fg; ctx.font = "bold 30px monospace"; ctx.textAlign = "center";
  ctx.fillText(String(config.grade || "9.5"), bX + bW / 2, bY + 38);

  const fY = 795, fH = 42;
  ctx.fillStyle = lc.bg; ctx.fillRect(12, fY, 576, fH);
  ctx.fillStyle = lc.fg; ctx.font = "bold 13px monospace"; ctx.textAlign = "center";
  ctx.fillText(`OOH·EARTH · ${config.serial || "OOH-00000"} · ${(config.casing || "slab").toUpperCase()}`, 300, fY + 27);

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

// ── Build the 3D slab group — physical-grade materials ──
function buildSlab(config, cardTexture) {
  const grp = new THREE.Group();
  const casing = config.casing, frosted = config.finish === "frosted";
  const cardW = 1.5, cardH = 2.1;

  const frameMat = new THREE.MeshPhysicalMaterial({
    color: DARK, roughness: 0.25, metalness: 0.5,
    clearcoat: 0.85, clearcoatRoughness: 0.2, envMapIntensity: 1,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, transmission: frosted ? 0.4 : 0.92,
    transparent: true, opacity: 1,
    roughness: frosted ? 0.75 : 0.03, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.02,
    ior: 1.5, thickness: 0.06, envMapIntensity: 1.3,
    side: THREE.DoubleSide,
  });
  const goldMat = new THREE.MeshPhysicalMaterial({
    color: GOLD, roughness: 0.12, metalness: 0.95,
    clearcoat: 0.5, clearcoatRoughness: 0.08, envMapIntensity: 1.5,
  });
  const cardBodyMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.6, metalness: 0.1 });
  const cardFaceMat = new THREE.MeshPhysicalMaterial({
    map: cardTexture, roughness: 0.35, metalness: 0.1,
    clearcoat: 0.4, clearcoatRoughness: 0.35, envMapIntensity: 0.6,
  });

  // Card body + face
  grp.add(new THREE.Mesh(new THREE.BoxGeometry(cardW, cardH, 0.012), cardBodyMat));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(cardW, cardH), cardFaceMat);
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
    // Front + back glass windows
    const winF = new THREE.Mesh(new THREE.PlaneGeometry(cardW + 0.02, cardH + 0.02), glassMat);
    winF.position.z = 0.05; grp.add(winF);
    const winB = new THREE.Mesh(new THREE.PlaneGeometry(cardW + 0.02, cardH + 0.02), glassMat);
    winB.position.z = -0.05; winB.rotation.y = Math.PI; grp.add(winB);
    if (casing === "magnetic") {
      const mag = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16),
        new THREE.MeshPhysicalMaterial({ color: OZONE, roughness: 0.25, metalness: 0.8, clearcoat: 0.6, envMapIntensity: 1.2 }),
      );
      mag.rotation.x = Math.PI / 2;
      mag.position.set(0, cardH / 2 + topH / 2, 0.05);
      grp.add(mag);
    }
  } else if (casing === "screwdown") {
    const cW = cardW + 0.14, cH = cardH + 0.14, cD = 0.08;
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(cW, cH, cD), glassMat));
    const sg = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16);
    const off = 0.08;
    [[cW/2-off, cH/2-off], [-cW/2+off, cH/2-off], [cW/2-off, -cH/2+off], [-cW/2+off, -cH/2+off]].forEach(([x, y]) => {
      const s = new THREE.Mesh(sg, goldMat);
      s.rotation.x = Math.PI / 2; s.position.set(x, y, cD / 2 + 0.01); grp.add(s);
    });
  } else if (casing === "toploader") {
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(cardW + 0.06, cardH + 0.06, 0.03), glassMat));
  } else if (casing === "sleeve") {
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(cardW + 0.03, cardH + 0.03, 0.02), glassMat));
  }

  return grp;
}

const DEFAULT_CAM = new THREE.Vector3(0, 0, 6);

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

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || S.current) return;
    const w = mount.clientWidth, h = mount.clientHeight || 560;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.copy(DEFAULT_CAM);

    // Environment for realistic reflections
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.enablePan = false;
    controls.minDistance = 3; controls.maxDistance = 14;
    controls.autoRotate = false;

    // 3-point lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.12));
    const key = new THREE.DirectionalLight(0xfff0d6, 1.2); key.position.set(3, 5, 4); scene.add(key);
    const fill = new THREE.DirectionalLight(0x6fd6ff, 0.45); fill.position.set(-4, -1, 3); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xedff00, 0.35); rim.position.set(0, 2, -5); scene.add(rim);

    S.current = { renderer, scene, camera, controls, slab: null, raf: 0 };

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
      if (scene.environment) scene.environment.dispose();
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
    st.camera.position.copy(DEFAULT_CAM);
    st.controls.target.set(0, 0, 0);
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
      {/* Zoom controls */}
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