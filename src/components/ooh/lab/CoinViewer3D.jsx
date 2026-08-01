import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ZoomIn, ZoomOut, Maximize2, Play, Pause } from "lucide-react";
import { COIN_MATERIALS, ENAMEL_ACCENTS, TRIGRAM_TICKS, EDGE_VERBS, seededNetwork } from "@/components/ooh/lab/coinPresets";

// ── Color helper: shade a THREE color int by a brightness factor ──
function shade(color, f) {
  const r = Math.round(Math.min(255, ((color >> 16) & 0xff) * f));
  const g = Math.round(Math.min(255, ((color >> 8) & 0xff) * f));
  const b = Math.round(Math.min(255, (color & 0xff) * f));
  return `rgb(${r},${g},${b})`;
}

// ── Guilloché security pattern (subtle concentric + radial interlace) ──
function drawGuilloche(ctx, cx, cy, R, matColor) {
  ctx.save();
  ctx.strokeStyle = shade(matColor, 0.88); ctx.lineWidth = 0.6; ctx.globalAlpha = 0.35;
  for (let r = 210; r < R - 30; r += 6) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.strokeStyle = shade(matColor, 0.82); ctx.globalAlpha = 0.2;
  for (let i = 0; i < 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 210, cy + Math.sin(a) * 210);
    ctx.lineTo(cx + Math.cos(a) * (R - 30), cy + Math.sin(a) * (R - 30));
    ctx.stroke();
  }
  ctx.restore();
}

// ── Obverse face — COLOR texture (metal + enamel + engraving) ──
function makeObverseTexture(config, matColor, enamelHex) {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 1024;
  const ctx = c.getContext("2d");
  const cx = 512, cy = 512, R = 500;

  // Metal base
  const g = ctx.createRadialGradient(cx - 160, cy - 160, 40, cx, cy, R);
  g.addColorStop(0, shade(matColor, 1.35));
  g.addColorStop(0.5, shade(matColor, 1.0));
  g.addColorStop(1, shade(matColor, 0.55));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

  // Guilloché field
  drawGuilloche(ctx, cx, cy, R - 80, matColor);

  // Reeding ticks at edge
  ctx.strokeStyle = shade(matColor, 0.4); ctx.lineWidth = 6;
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.lineTo(cx + Math.cos(a) * (R - 32), cy + Math.sin(a) * (R - 32));
    ctx.stroke();
  }

  // Outer ring
  ctx.strokeStyle = shade(matColor, 0.5); ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(cx, cy, R - 76, 0, Math.PI * 2); ctx.stroke();

  // Enamel trigram wells (hard enamel pools)
  if (enamelHex) {
    ctx.fillStyle = enamelHex;
    TRIGRAM_TICKS.forEach((_, i) => {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * (R - 122), cy + Math.sin(a) * (R - 122), 36, 0, Math.PI * 2);
      ctx.fill();
    });
    // Enamel highlight on inner ring
    ctx.strokeStyle = enamelHex; ctx.lineWidth = 4; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(cx, cy, R - 190, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Trigrams (engraved over enamel)
  ctx.fillStyle = shade(matColor, 0.3);
  ctx.font = "bold 50px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  TRIGRAM_TICKS.forEach((sym, i) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    ctx.fillText(sym, cx + Math.cos(a) * (R - 122), cy + Math.sin(a) * (R - 122));
  });

  // Inner medallion ring
  ctx.strokeStyle = shade(matColor, 0.45); ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(cx, cy, R - 195, 0, Math.PI * 2); ctx.stroke();

  // OOH EARTH — engraved
  ctx.fillStyle = shade(matColor, 0.28);
  ctx.font = "bold 100px 'Inter Tight', sans-serif";
  ctx.fillText("OOH", cx, cy - 75);
  ctx.font = "bold 46px 'Inter Tight', sans-serif";
  ctx.fillText("EARTH", cx, cy);

  // Serial + edition
  ctx.fillStyle = shade(matColor, 0.25);
  ctx.font = "bold 40px monospace";
  ctx.fillText(`№ ${config.serial}`, cx, cy + 82);
  ctx.font = "22px monospace";
  ctx.fillText(config.edition, cx, cy + 132);

  // Mint mark (small, bottom)
  ctx.font = "16px monospace"; ctx.fillStyle = shade(matColor, 0.35);
  ctx.fillText("OOH MINT · UNION MADE", cx, cy + R - 40);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 16; tex.needsUpdate = true;
  return tex;
}

// ── Obverse face — BUMP map (engraved = dark, raised = light) ──
function makeObverseBump(config) {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 1024;
  const ctx = c.getContext("2d");
  const cx = 512, cy = 512, R = 500;
  ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, 1024, 1024); // flat base

  // Engraved elements = dark (recessed)
  ctx.fillStyle = "#181818";
  ctx.font = "bold 50px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  TRIGRAM_TICKS.forEach((sym, i) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    ctx.fillText(sym, cx + Math.cos(a) * (R - 122), cy + Math.sin(a) * (R - 122));
  });
  ctx.font = "bold 100px 'Inter Tight', sans-serif"; ctx.fillText("OOH", cx, cy - 75);
  ctx.font = "bold 46px 'Inter Tight', sans-serif"; ctx.fillText("EARTH", cx, cy);
  ctx.font = "bold 40px monospace"; ctx.fillText(`№ ${config.serial}`, cx, cy + 82);
  ctx.font = "22px monospace"; ctx.fillText(config.edition, cx, cy + 132);
  ctx.font = "16px monospace"; ctx.fillText("OOH MINT · UNION MADE", cx, cy + R - 40);
  // Reeding ticks
  ctx.strokeStyle = "#0a0a0a"; ctx.lineWidth = 6;
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.lineTo(cx + Math.cos(a) * (R - 32), cy + Math.sin(a) * (R - 32));
    ctx.stroke();
  }

  // Raised elements = light
  ctx.strokeStyle = "#d0d0d0"; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(cx, cy, R - 76, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "#c0c0c0"; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(cx, cy, R - 195, 0, Math.PI * 2); ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 16;
  return tex;
}

// ── Reverse face — COLOR texture (city network + enamel) ──
function makeReverseTexture(num, matColor, enamelHex) {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 1024;
  const ctx = c.getContext("2d");
  const cx = 512, cy = 512, R = 500;

  const g = ctx.createRadialGradient(cx + 160, cy - 160, 40, cx, cy, R);
  g.addColorStop(0, shade(matColor, 1.3));
  g.addColorStop(0.5, shade(matColor, 1.0));
  g.addColorStop(1, shade(matColor, 0.58));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

  drawGuilloche(ctx, cx, cy, R - 80, matColor);

  // Reeding
  ctx.strokeStyle = shade(matColor, 0.4); ctx.lineWidth = 6;
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.lineTo(cx + Math.cos(a) * (R - 32), cy + Math.sin(a) * (R - 32));
    ctx.stroke();
  }
  ctx.strokeStyle = shade(matColor, 0.5); ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(cx, cy, R - 76, 0, Math.PI * 2); ctx.stroke();

  // City network — engraved
  const { nodes, edges } = seededNetwork(num);
  ctx.strokeStyle = shade(matColor, 0.28); ctx.lineWidth = 3.5;
  edges.forEach((e) => {
    ctx.beginPath();
    ctx.moveTo(e.a.x * 1024, e.a.y * 1024);
    ctx.lineTo(e.b.x * 1024, e.b.y * 1024);
    ctx.stroke();
  });
  // Enamel node wells
  if (enamelHex) {
    ctx.fillStyle = enamelHex;
    nodes.forEach((n) => {
      ctx.beginPath();
      ctx.arc(n.x * 1024, n.y * 1024, n.s * 1024 + 3, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    ctx.fillStyle = shade(matColor, 0.2);
    nodes.forEach((n) => {
      ctx.beginPath();
      ctx.arc(n.x * 1024, n.y * 1024, n.s * 1024, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Motto — engraved
  ctx.fillStyle = shade(matColor, 0.25);
  ctx.font = "bold 28px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("NO BORDERS · ONLY NETWORKS", cx, cy + R - 130);
  ctx.font = "16px monospace";
  ctx.fillText("SDG 11 · 16 · 17", cx, cy + R - 90);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 16; tex.needsUpdate = true;
  return tex;
}

// ── Reverse face — BUMP map ──
function makeReverseBump(num) {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 1024;
  const ctx = c.getContext("2d");
  const cx = 512, cy = 512, R = 500;
  ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, 1024, 1024);

  ctx.strokeStyle = "#181818"; ctx.lineWidth = 3.5;
  const { nodes, edges } = seededNetwork(num);
  edges.forEach((e) => {
    ctx.beginPath();
    ctx.moveTo(e.a.x * 1024, e.a.y * 1024);
    ctx.lineTo(e.b.x * 1024, e.b.y * 1024);
    ctx.stroke();
  });
  ctx.fillStyle = "#101010";
  nodes.forEach((n) => {
    ctx.beginPath();
    ctx.arc(n.x * 1024, n.y * 1024, n.s * 1024, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "#181818";
  ctx.font = "bold 28px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("NO BORDERS · ONLY NETWORKS", cx, cy + R - 130);
  ctx.font = "16px monospace"; ctx.fillText("SDG 11 · 16 · 17", cx, cy + R - 90);

  // Raised outer ring
  ctx.strokeStyle = "#d0d0d0"; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(cx, cy, R - 76, 0, Math.PI * 2); ctx.stroke();
  // Reeding
  ctx.strokeStyle = "#0a0a0a"; ctx.lineWidth = 6;
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.lineTo(cx + Math.cos(a) * (R - 32), cy + Math.sin(a) * (R - 32));
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 16;
  return tex;
}

// ── Edge texture — reeded / rope / lettered / smooth ──
function makeEdgeTexture(matColor, edgeType) {
  const c = document.createElement("canvas");
  c.width = 2048; c.height = 64;
  const ctx = c.getContext("2d");
  ctx.fillStyle = shade(matColor, 1.0);
  ctx.fillRect(0, 0, 2048, 64);

  if (edgeType === "reeded" || edgeType === "lettered") {
    ctx.strokeStyle = shade(matColor, 0.38); ctx.lineWidth = 2;
    for (let i = 0; i < 256; i++) {
      ctx.beginPath(); ctx.moveTo(i * 8, 0); ctx.lineTo(i * 8, 64); ctx.stroke();
    }
  }
  if (edgeType === "rope") {
    ctx.strokeStyle = shade(matColor, 0.5); ctx.lineWidth = 7;
    for (let i = 0; i < 128; i++) {
      const x = i * 16;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 16, 64); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 16, 0); ctx.lineTo(x, 64); ctx.stroke();
    }
    ctx.strokeStyle = shade(matColor, 1.35); ctx.lineWidth = 2.5;
    for (let i = 0; i < 128; i++) {
      ctx.beginPath(); ctx.moveTo(i * 16 + 4, 6); ctx.lineTo(i * 16 + 12, 26); ctx.stroke();
    }
  }
  if (edgeType === "lettered") {
    ctx.fillStyle = shade(matColor, 0.28);
    ctx.font = "bold 18px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const segW = 2048 / (EDGE_VERBS.length * 4);
    EDGE_VERBS.forEach((v, vi) => {
      for (let rep = 0; rep < 4; rep++) ctx.fillText(v, (vi * 4 + rep) * segW + segW / 2, 36);
    });
  }
  // smooth = no additional marks

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

// ── Build the 3D crypto chip: single LatheGeometry body (rim + bevel minted
//    as one solid piece — no floating rings) + reeded edge sleeve + recessed
//    face texture discs. Matches the Casascius / Cryptochips reference profile.
function buildCoin(matKey, edgeType, obvTex, revTex, edgeTex, obvBump, revBump) {
  const mat = COIN_MATERIALS.find((m) => m.id === matKey) || COIN_MATERIALS[0];
  const metalMat = (extra = {}) => new THREE.MeshPhysicalMaterial({
    color: mat.color,
    metalness: mat.metalness,
    roughness: mat.roughness,
    clearcoat: 0.7,
    clearcoatRoughness: 0.14,
    envMapIntensity: 2.0,
    ...extra,
  });

  const outer = new THREE.Group();
  const inner = new THREE.Group();
  inner.rotation.x = Math.PI / 2;
  outer.add(inner);

  // Dimensions (64mm Ø × 4.5mm heft → scaled units)
  const R = 1.5;              // outer radius (widest at edge midline)
  const halfH = 0.14;        // half thickness = rim top height
  const fieldH = 0.115;      // recessed field height (rim raised 0.025 above field)
  const bevel = 0.05;        // rounding radius at rim↔edge transition
  const bodyR = R - bevel;   // 1.45 — rim outer / bevel start
  const rimR = bodyR - 0.12; // 1.33 — rim inner / field outer

  // ── Lathe profile: recessed field → raised rim → rounded bevel → straight
  //    edge → rounded bevel → raised rim → recessed field. One solid revolution. ──
  const segs = 8;
  const bBev = [], tBev = [];
  for (let i = 0; i <= segs; i++) {
    const t = (i / segs) * (Math.PI / 2);
    bBev.push(new THREE.Vector2(bodyR + bevel * Math.sin(t), -halfH + bevel - bevel * Math.cos(t)));
  }
  for (let i = 0; i <= segs; i++) {
    const t = ((segs - i) / segs) * (Math.PI / 2);
    tBev.push(new THREE.Vector2(bodyR + bevel * Math.sin(t), halfH - bevel + bevel * Math.cos(t)));
  }
  const profile = [
    new THREE.Vector2(0, -fieldH),
    new THREE.Vector2(rimR, -fieldH),
    new THREE.Vector2(rimR, -halfH),
    new THREE.Vector2(bodyR, -halfH),
    ...bBev.slice(1),
    new THREE.Vector2(R, halfH - bevel),
    ...tBev.slice(1),
    new THREE.Vector2(rimR, halfH),
    new THREE.Vector2(rimR, fieldH),
    new THREE.Vector2(0, fieldH),
  ];
  const bodyGeo = new THREE.LatheGeometry(profile, 128);
  const bodyMat = metalMat({ roughness: mat.roughness * 0.82 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true; body.receiveShadow = true;
  inner.add(body);

  // ── Edge texture sleeve — reeded/rope/lettered on the straight side ──
  const edgeH = 2 * (halfH - bevel);
  const edgeGeo = new THREE.CylinderGeometry(R + 0.003, R + 0.003, edgeH, 160, 1, true);
  const edgeMat = metalMat({ map: edgeTex, roughness: mat.roughness * 1.1 });
  const edge = new THREE.Mesh(edgeGeo, edgeMat);
  edge.castShadow = true;
  inner.add(edge);

  // ── Face texture discs — sit in the recessed field, inside the raised rim ──
  const faceGeo = new THREE.CircleGeometry(rimR, 128);
  const obvMat = metalMat({ map: obvTex, bumpMap: obvBump, bumpScale: 0.09 });
  const revMat = metalMat({ map: revTex, bumpMap: revBump, bumpScale: 0.09 });
  const faceTop = new THREE.Mesh(faceGeo, obvMat);
  faceTop.name = "faceTop";
  faceTop.rotation.x = -Math.PI / 2;
  faceTop.position.y = fieldH + 0.004;
  faceTop.receiveShadow = true;
  inner.add(faceTop);
  const faceBot = new THREE.Mesh(faceGeo.clone(), revMat);
  faceBot.name = "faceBot";
  faceBot.rotation.x = Math.PI / 2;
  faceBot.rotation.z = Math.PI;
  faceBot.position.y = -(fieldH + 0.004);
  faceBot.receiveShadow = true;
  inner.add(faceBot);

  return outer;
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

const CoinViewer3D = forwardRef(function CoinViewer3D({ config, materialId, edgeType, enamelId }, ref) {
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
    renderer.toneMappingExposure = 1.25;
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

    // 3-point lighting + spotlight
    scene.add(new THREE.AmbientLight(0xffffff, 0.18));
    const key = new THREE.DirectionalLight(0xfff0d6, 1.8);
    key.position.set(3, 7, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5; key.shadow.camera.far = 20;
    key.shadow.camera.left = -3; key.shadow.camera.right = 3;
    key.shadow.camera.top = 3; key.shadow.camera.bottom = -3;
    key.shadow.bias = -0.0008; key.shadow.radius = 6;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x6fd6ff, 0.55); fill.position.set(-5, -1, 3); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xedff00, 0.5); rim.position.set(0, 3, -6); scene.add(rim);
    const spot = new THREE.SpotLight(0xffffff, 0.9, 15, Math.PI / 5, 0.4, 1);
    spot.position.set(2, 8, 3); scene.add(spot);

    // Contact shadow
    const sCv = document.createElement("canvas"); sCv.width = 256; sCv.height = 256;
    const sCx = sCv.getContext("2d");
    const sG = sCx.createRadialGradient(128, 128, 0, 128, 128, 128);
    sG.addColorStop(0, "rgba(0,0,0,0.5)"); sG.addColorStop(0.5, "rgba(0,0,0,0.2)"); sG.addColorStop(1, "rgba(0,0,0,0)");
    sCx.fillStyle = sG; sCx.fillRect(0, 0, 256, 256);
    const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 3), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sCv), transparent: true, depthWrite: false }));
    contactShadow.rotation.x = -Math.PI / 2; contactShadow.position.y = -1.55; scene.add(contactShadow);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShadowMaterial({ opacity: 0.4 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -1.56; ground.receiveShadow = true; scene.add(ground);

    S.current = { renderer, scene, camera, controls, coin: null, raf: 0, fitDist: 7, fitCenter: new THREE.Vector3(0, 0, 0), playing: true, speed: 0.004 };

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
        if (o.material) { const m = o.material; (Array.isArray(m) ? m : [m]).forEach((x) => { if (x.map) x.map.dispose(); if (x.bumpMap) x.bumpMap.dispose(); x.dispose(); }); }
      });
      if (scene.environment) scene.environment.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      S.current = null;
    };
  }, []);

  // ── Rebuild coin on material or edge change ──
  useEffect(() => {
    const st = S.current; if (!st) return;
    if (st.coin) {
      st.scene.remove(st.coin);
      st.coin.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { const m = o.material; (Array.isArray(m) ? m : [m]).forEach((x) => { if (x.map) x.map.dispose(); if (x.bumpMap) x.bumpMap.dispose(); x.dispose(); }); }
      });
      st.coin = null;
    }
    const mat = COIN_MATERIALS.find((m) => m.id === materialId) || COIN_MATERIALS[0];
    const enamelHex = getEnamelHex(enamelId);
    const obvTex = makeObverseTexture(config, mat.color, enamelHex);
    const revTex = makeReverseTexture(Number(config.serial) || 1, mat.color, enamelHex);
    const edgeTex = makeEdgeTexture(mat.color, edgeType);
    const obvBump = makeObverseBump(config);
    const revBump = makeReverseBump(Number(config.serial) || 1);
    st.coin = buildCoin(materialId, edgeType, obvTex, revTex, edgeTex, obvBump, revBump);
    st.scene.add(st.coin);
    const { dist, center } = fitCamera(st.camera, st.controls, st.coin);
    st.fitDist = dist; st.fitCenter = center;
  }, [materialId, edgeType]);

  // ── Update face textures + bump maps on serial/edition/enamel change ──
  useEffect(() => {
    const st = S.current; if (!st || !st.coin) return;
    const mat = COIN_MATERIALS.find((m) => m.id === materialId) || COIN_MATERIALS[0];
    const enamelHex = getEnamelHex(enamelId);
    const obvTex = makeObverseTexture(config, mat.color, enamelHex);
    const revTex = makeReverseTexture(Number(config.serial) || 1, mat.color, enamelHex);
    const obvBump = makeObverseBump(config);
    const revBump = makeReverseBump(Number(config.serial) || 1);
    const inner = st.coin.children[0];
    const faceTop = inner?.children?.find((o) => o.name === "faceTop");
    const faceBot = inner?.children?.find((o) => o.name === "faceBot");
    if (faceTop?.material) {
      if (faceTop.material.map) faceTop.material.map.dispose();
      if (faceTop.material.bumpMap) faceTop.material.bumpMap.dispose();
      faceTop.material.map = obvTex; faceTop.material.bumpMap = obvBump;
      faceTop.material.needsUpdate = true;
    }
    if (faceBot?.material) {
      if (faceBot.material.map) faceBot.material.map.dispose();
      if (faceBot.material.bumpMap) faceBot.material.bumpMap.dispose();
      faceBot.material.map = revTex; faceBot.material.bumpMap = revBump;
      faceBot.material.needsUpdate = true;
    }
  }, [config.serial, config.edition, enamelId]);

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
          { id: "void", bg: "#0a0a0a" },
          { id: "dark", bg: "#1a1a1a" },
          { id: "grey", bg: "#2a2a2a" },
          { id: "light", bg: "#444444" },
          { id: "white", bg: "#e8e8e8" },
        ].map((bg) => (
          <button key={bg.id} onClick={() => setBgColor(bg.id)} aria-label={`Background ${bg.id}`}
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
        <span>· {(edgeType || "reeded").toUpperCase()} EDGE</span>
        <span>· 64MM Ø · 4.5MM</span>
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

function getEnamelHex(id) {
  return (ENAMEL_ACCENTS.find((e) => e.id === id) || {}).hex || null;
}

export default CoinViewer3D;