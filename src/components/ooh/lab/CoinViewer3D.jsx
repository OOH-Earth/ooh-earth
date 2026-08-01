import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ZoomIn, ZoomOut, Maximize2, Play, Pause } from "lucide-react";
import { COIN_MATERIALS, TRIGRAM_TICKS, EDGE_VERBS, seededNetwork } from "@/components/ooh/lab/coinPresets";

// ── Color helper: shade a THREE color int by a brightness factor ──
function shade(color, f) {
  const r = Math.round(Math.min(255, ((color >> 16) & 0xff) * f));
  const g = Math.round(Math.min(255, ((color >> 8) & 0xff) * f));
  const b = Math.round(Math.min(255, (color & 0xff) * f));
  return `rgb(${r},${g},${b})`;
}

// ── Obverse face texture — trigram ring, OOH EARTH, serial, edition ──
function makeObverseTexture(config, matColor) {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 1024;
  const ctx = c.getContext("2d");
  const cx = 512, cy = 512, R = 500;

  // Metal base
  const g = ctx.createRadialGradient(cx - 160, cy - 160, 40, cx, cy, R);
  g.addColorStop(0, shade(matColor, 1.3));
  g.addColorStop(0.5, shade(matColor, 1.0));
  g.addColorStop(1, shade(matColor, 0.6));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

  // Reeding ticks
  ctx.strokeStyle = shade(matColor, 0.45); ctx.lineWidth = 5;
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.lineTo(cx + Math.cos(a) * (R - 28), cy + Math.sin(a) * (R - 28));
    ctx.stroke();
  }

  // Outer ring
  ctx.strokeStyle = shade(matColor, 0.55); ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(cx, cy, R - 70, 0, Math.PI * 2); ctx.stroke();

  // Trigrams
  ctx.fillStyle = shade(matColor, 0.4);
  ctx.font = "bold 48px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  TRIGRAM_TICKS.forEach((sym, i) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    ctx.fillText(sym, cx + Math.cos(a) * (R - 115), cy + Math.sin(a) * (R - 115));
  });

  // Inner ring
  ctx.strokeStyle = shade(matColor, 0.5); ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(cx, cy, R - 180, 0, Math.PI * 2); ctx.stroke();

  // OOH EARTH
  ctx.fillStyle = shade(matColor, 0.35);
  ctx.font = "bold 96px 'Inter Tight', sans-serif";
  ctx.fillText("OOH", cx, cy - 70);
  ctx.font = "bold 44px 'Inter Tight', sans-serif";
  ctx.fillText("EARTH", cx, cy);

  // Serial + edition
  ctx.font = "bold 38px monospace";
  ctx.fillText(`№ ${config.serial}`, cx, cy + 80);
  ctx.font = "22px monospace";
  ctx.fillText(config.edition, cx, cy + 130);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 16; tex.needsUpdate = true;
  return tex;
}

// ── Reverse face texture — city as network ──
function makeReverseTexture(num, matColor) {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 1024;
  const ctx = c.getContext("2d");
  const cx = 512, cy = 512, R = 500;

  const g = ctx.createRadialGradient(cx + 160, cy - 160, 40, cx, cy, R);
  g.addColorStop(0, shade(matColor, 1.25));
  g.addColorStop(0.5, shade(matColor, 1.0));
  g.addColorStop(1, shade(matColor, 0.62));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

  // Reeding
  ctx.strokeStyle = shade(matColor, 0.45); ctx.lineWidth = 5;
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.lineTo(cx + Math.cos(a) * (R - 28), cy + Math.sin(a) * (R - 28));
    ctx.stroke();
  }
  ctx.strokeStyle = shade(matColor, 0.55); ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(cx, cy, R - 70, 0, Math.PI * 2); ctx.stroke();

  // City network
  const { nodes, edges } = seededNetwork(num);
  ctx.strokeStyle = shade(matColor, 0.35); ctx.lineWidth = 3;
  edges.forEach((e) => {
    ctx.beginPath();
    ctx.moveTo(e.a.x * 1024, e.a.y * 1024);
    ctx.lineTo(e.b.x * 1024, e.b.y * 1024);
    ctx.stroke();
  });
  ctx.fillStyle = shade(matColor, 0.25);
  nodes.forEach((n) => {
    ctx.beginPath();
    ctx.arc(n.x * 1024, n.y * 1024, n.s * 1024, 0, Math.PI * 2);
    ctx.fill();
  });

  // Motto
  ctx.fillStyle = shade(matColor, 0.3);
  ctx.font = "bold 26px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("NO BORDERS · ONLY NETWORKS", cx, cy + R - 120);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 16; tex.needsUpdate = true;
  return tex;
}

// ── Edge texture — reeded ridges + protocol verbs ──
function makeEdgeTexture(matColor) {
  const c = document.createElement("canvas");
  c.width = 2048; c.height = 64;
  const ctx = c.getContext("2d");
  ctx.fillStyle = shade(matColor, 1.0);
  ctx.fillRect(0, 0, 2048, 64);
  // Ridges
  ctx.strokeStyle = shade(matColor, 0.4); ctx.lineWidth = 2;
  for (let i = 0; i < 256; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 8, 0); ctx.lineTo(i * 8, 64);
    ctx.stroke();
  }
  // Verbs
  ctx.fillStyle = shade(matColor, 0.3);
  ctx.font = "bold 18px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const segW = 2048 / (EDGE_VERBS.length * 4);
  EDGE_VERBS.forEach((v, vi) => {
    for (let rep = 0; rep < 4; rep++) {
      ctx.fillText(v, (vi * 4 + rep) * segW + segW / 2, 32);
    }
  });
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.x = 1;
  tex.anisotropy = 8;
  return tex;
}

// ── Build the 3D coin ──
function buildCoin(matKey, obvTex, revTex, edgeTex) {
  const grp = new THREE.Group();
  const mat = COIN_MATERIALS.find((m) => m.id === matKey) || COIN_MATERIALS[0];

  const metalMat = (extra = {}) => new THREE.MeshPhysicalMaterial({
    color: mat.color,
    metalness: mat.metalness,
    roughness: mat.roughness,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.8,
    ...extra,
  });

  // Cylinder: radius 1.5, height 0.16, 64 radial segments
  // Material order: [side, top, bottom]
  const geo = new THREE.CylinderGeometry(1.5, 1.5, 0.16, 96, 1, false);
  const edgeMat = metalMat({ map: edgeTex, roughness: mat.roughness * 1.1 });
  const obvMat = metalMat({ map: obvTex });
  const revMat = metalMat({ map: revTex });

  const coin = new THREE.Mesh(geo, [edgeMat, obvMat, revMat]);
  coin.rotation.x = Math.PI / 2; // faces toward camera (+Z) / away (-Z)
  coin.castShadow = true;
  coin.receiveShadow = true;
  grp.add(coin);

  return grp;
}

// ── Auto-fit camera ──
function fitCamera(camera, controls, obj) {
  obj.rotation.set(0, 0, 0); obj.updateMatrixWorld();
  const box = new THREE.Box3().setFromObject(obj);
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);
  const center = sphere.center;
  const fov = camera.fov * Math.PI / 180;
  const dist = sphere.radius / Math.sin(fov / 2) * 1.7;
  camera.position.set(center.x, center.y, center.z + dist);
  controls.target.copy(center);
  controls.minDistance = dist * 0.3;
  controls.maxDistance = dist * 4;
  controls.update();
  return { dist, center };
}

const CoinViewer3D = forwardRef(function CoinViewer3D({ config, materialId }, ref) {
  const mountRef = useRef(null);
  const S = useRef(null);
  const [bgColor, setBgColor] = useState("void");
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);

  useImperativeHandle(ref, () => ({
    exportPNG: () => {
      const st = S.current; if (!st) return;
      st.renderer.render(st.scene, st.camera);
      const a = document.createElement("a");
      a.href = st.renderer.domElement.toDataURL("image/png");
      a.download = `ooh-genesis-${config.serial || "0000"}.png`;
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
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

    // 3-point lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.18));
    const key = new THREE.DirectionalLight(0xfff0d6, 1.6);
    key.position.set(3, 7, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5; key.shadow.camera.far = 20;
    key.shadow.camera.left = -3; key.shadow.camera.right = 3;
    key.shadow.camera.top = 3; key.shadow.camera.bottom = -3;
    key.shadow.bias = -0.0008; key.shadow.radius = 6;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x6fd6ff, 0.5); fill.position.set(-5, -1, 3); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xedff00, 0.45); rim.position.set(0, 3, -6); scene.add(rim);
    const spot = new THREE.SpotLight(0xffffff, 0.8, 15, Math.PI / 5, 0.4, 1);
    spot.position.set(2, 8, 3); scene.add(spot);

    // Contact shadow
    const sCv = document.createElement("canvas"); sCv.width = 256; sCv.height = 256;
    const sCx = sCv.getContext("2d");
    const sG = sCx.createRadialGradient(128, 128, 0, 128, 128, 128);
    sG.addColorStop(0, "rgba(0,0,0,0.5)"); sG.addColorStop(0.5, "rgba(0,0,0,0.2)"); sG.addColorStop(1, "rgba(0,0,0,0)");
    sCx.fillStyle = sG; sCx.fillRect(0, 0, 256, 256);
    const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sCv), transparent: true, depthWrite: false }));
    contactShadow.rotation.x = -Math.PI / 2; contactShadow.position.y = -1.0; scene.add(contactShadow);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShadowMaterial({ opacity: 0.35 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -1.01; ground.receiveShadow = true; scene.add(ground);

    S.current = { renderer, scene, camera, controls, coin: null, raf: 0, obvMat: null, revMat: null, edgeMat: null, fitDist: 7, fitCenter: new THREE.Vector3(0, 0, 0), playing: true, speed: 0.004 };

    const onResize = () => {
      const nw = mount.clientWidth, nh = mount.clientHeight || 560;
      camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    const animate = () => {
      const st = S.current; if (!st) return;
      st.raf = requestAnimationFrame(animate);
      if (st.coin && st.playing) {
        st.coin.rotation.y += st.speed;
        st.coin.position.y = Math.sin(performance.now() * 0.0008) * 0.03;
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

  // ── Rebuild coin on material change ──
  useEffect(() => {
    const st = S.current; if (!st) return;
    if (st.coin) {
      st.scene.remove(st.coin);
      st.coin.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { const m = o.material; (Array.isArray(m) ? m : [m]).forEach((x) => { if (x.map) x.map.dispose(); x.dispose(); }); }
      });
      st.coin = null;
    }
    const mat = COIN_MATERIALS.find((m) => m.id === materialId) || COIN_MATERIALS[0];
    const obvTex = makeObverseTexture(config, mat.color);
    const revTex = makeReverseTexture(Number(config.serial) || 1, mat.color);
    const edgeTex = makeEdgeTexture(mat.color);
    st.coin = buildCoin(materialId, obvTex, revTex, edgeTex);
    st.scene.add(st.coin);
    const { dist, center } = fitCamera(st.camera, st.controls, st.coin);
    st.fitDist = dist; st.fitCenter = center;
  }, [materialId]);

  // ── Update face textures on serial/edition change ──
  useEffect(() => {
    const st = S.current; if (!st || !st.coin) return;
    const mat = COIN_MATERIALS.find((m) => m.id === materialId) || COIN_MATERIALS[0];
    const obvTex = makeObverseTexture(config, mat.color);
    const revTex = makeReverseTexture(Number(config.serial) || 1, mat.color);
    // Cylinder material order: [side(0), top(1), bottom(2)]
    const coinMesh = st.coin.children[0];
    if (coinMesh && coinMesh.material) {
      if (coinMesh.material[1]?.map) { coinMesh.material[1].map.dispose(); coinMesh.material[1].map = obvTex; coinMesh.material[1].needsUpdate = true; }
      if (coinMesh.material[2]?.map) { coinMesh.material[2].map.dispose(); coinMesh.material[2].map = revTex; coinMesh.material[2].needsUpdate = true; }
    }
  }, [config.serial, config.edition]);

  // ── Background ──
  useEffect(() => {
    const st = S.current; if (!st) return;
    const opts = {
      void: { c: 0x000000, a: 0 }, dark: { c: 0x1a1a1a, a: 1 },
      grey: { c: 0x2a2a2a, a: 1 }, light: { c: 0x444444, a: 1 }, white: { c: 0xe8e8e8, a: 1 },
    };
    const o = opts[bgColor] || opts.void;
    st.renderer.setClearColor(o.c, o.a);
  }, [bgColor]);

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
  const togglePlay = () => {
    const np = !playing; setPlaying(np);
    if (S.current) S.current.playing = np;
  };
  const setSpeedVal = (v) => {
    setSpeed(v);
    if (S.current) S.current.speed = 0.004 * v;
  };

  return (
    <div className="relative overflow-hidden border border-slate2 bg-card">
      <style>{`@keyframes coin-scan{0%{top:6%}100%{top:94%}}`}</style>
      <div ref={mountRef} className="h-[560px] w-full" style={{ touchAction: "none", cursor: "grab" }} />
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-ozone/60" />
        <span className="absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-ozone/60" />
        <span className="absolute left-3 bottom-3 h-4 w-4 border-l-2 border-b-2 border-ozone/60" />
        <span className="absolute right-3 bottom-3 h-4 w-4 border-r-2 border-b-2 border-ozone/60" />
        <div className="absolute inset-x-6" style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(237,255,0,.4),transparent)", animation: "coin-scan 5s linear infinite" }} />
      </div>
      <div className="absolute left-3 top-12 flex flex-col gap-1.5">
        {[
          { id: "void", bg: "#0a0a0a", label: "Void" },
          { id: "dark", bg: "#1a1a1a", label: "Dark" },
          { id: "grey", bg: "#2a2a2a", label: "Grey" },
          { id: "light", bg: "#444444", label: "Light" },
          { id: "white", bg: "#e8e8e8", label: "White" },
        ].map((bg) => (
          <button key={bg.id} onClick={() => setBgColor(bg.id)} aria-label={`Background: ${bg.label}`}
            className={`h-7 w-7 border ${bgColor === bg.id ? "border-ozone ring-1 ring-ozone" : "border-slate2"}`}
            style={{ backgroundColor: bg.bg }} />
        ))}
      </div>
      <div className="absolute right-3 top-12 flex flex-col gap-1.5">
        <button onClick={zoomIn} aria-label="Zoom in" className="flex h-8 w-8 items-center justify-center border border-slate2 bg-void/80 text-silver/70 backdrop-blur transition-colors hover:border-ozone hover:text-ozone"><ZoomIn className="h-3.5 w-3.5" /></button>
        <button onClick={zoomOut} aria-label="Zoom out" className="flex h-8 w-8 items-center justify-center border border-slate2 bg-void/80 text-silver/70 backdrop-blur transition-colors hover:border-ozone hover:text-ozone"><ZoomOut className="h-3.5 w-3.5" /></button>
        <button onClick={resetView} aria-label="Reset view" className="flex h-8 w-8 items-center justify-center border border-slate2 bg-void/80 text-silver/70 backdrop-blur transition-colors hover:border-ozone hover:text-ozone"><Maximize2 className="h-3.5 w-3.5" /></button>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 border-t border-slate2/60 bg-void/70 px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest text-silver/50 backdrop-blur">
        <span className="text-ozone">{(materialId || "brass").toUpperCase()}</span>
        <span>64MM Ø</span>
        <button onClick={togglePlay} className="ml-2 flex items-center gap-1 border border-slate2 px-1.5 py-0.5 text-silver/70 transition-colors hover:border-ozone hover:text-ozone">
          {playing ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
          {playing ? "PAUSE" : "PLAY"}
        </button>
        <div className="flex items-center gap-0.5">
          {[0.5, 1, 2].map((v) => (
            <button key={v} onClick={() => setSpeedVal(v)} className={`px-1.5 py-0.5 ${speed === v ? "bg-ozone font-bold text-void" : "border border-slate2 text-silver/50 hover:text-ozone"}`}>×{v}</button>
          ))}
        </div>
        <span className="ml-auto">DRAG TO ROTATE · SCROLL TO ZOOM</span>
      </div>
    </div>
  );
});

export default CoinViewer3D;