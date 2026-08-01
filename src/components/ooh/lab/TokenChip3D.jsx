import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ZoomIn, ZoomOut, Maximize2, Play, Pause } from "lucide-react";

// TokenChip3D — casino-style chip spinner for the $OOHEX token mark.
// Flat poker-chip geometry (colored ring + edge spots + center field +
// arched text) rendered in Three.js with the full viewer feature set:
// auto-rotation, speed, zoom, background swatches, PNG export.

const S = 1024;

// ── rounded-rect path helper ──
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── arched text along an arc ──
function archedText(ctx, text, cx, cy, radius, centerAngle, span, bottom, color, font) {
  ctx.fillStyle = color; ctx.font = font; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const chars = text.split("");
  const step = span / chars.length;
  chars.forEach((ch, i) => {
    const a = bottom
      ? centerAngle + span / 2 - step * (i + 0.5)
      : centerAngle - span / 2 + step * (i + 0.5);
    ctx.save();
    ctx.translate(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.rotate(a + (bottom ? -Math.PI / 2 : Math.PI / 2));
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
}

// ── Chip face texture (top or bottom) ──
function makeChipFace(cfg) {
  const c = document.createElement("canvas");
  c.width = S; c.height = S;
  const ctx = c.getContext("2d");
  const cx = S / 2, cy = S / 2, R = 500;
  const fieldR = 320;
  const ringW = R - fieldR;
  const spotR = (R + fieldR) / 2;

  // Outer ring fill
  ctx.fillStyle = cfg.ring;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

  // Subtle ring shading (matte/satin)
  const g = ctx.createRadialGradient(cx - 120, cy - 120, 60, cx, cy, R);
  g.addColorStop(0, "rgba(255,255,255,0.14)");
  g.addColorStop(0.5, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

  // 4 edge spots at 12 / 3 / 6 / 9 o'clock
  const spotAngles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
  spotAngles.forEach((a) => {
    ctx.save();
    ctx.translate(cx + Math.cos(a) * spotR, cy + Math.sin(a) * spotR);
    ctx.rotate(a);
    ctx.fillStyle = cfg.spot;
    roundRectPath(ctx, -ringW / 2 + 8, -64, ringW - 16, 128, 20);
    ctx.fill();
    // spot shading
    const sg = ctx.createLinearGradient(0, -64, 0, 64);
    sg.addColorStop(0, "rgba(255,255,255,0.18)");
    sg.addColorStop(0.5, "rgba(255,255,255,0)");
    sg.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = sg; roundRectPath(ctx, -ringW / 2 + 8, -64, ringW - 16, 128, 20); ctx.fill();
    ctx.restore();
  });

  // Center field
  ctx.fillStyle = cfg.field;
  ctx.beginPath(); ctx.arc(cx, cy, fieldR, 0, Math.PI * 2); ctx.fill();

  // Thin field border (white or contrast)
  const fieldDark = cfg.field === "#000000" || cfg.field === "#0a0a0a" || cfg.field === "#002554";
  ctx.strokeStyle = fieldDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.5)";
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(cx, cy, fieldR, 0, Math.PI * 2); ctx.stroke();

  // Inner decorative ring (double line)
  ctx.strokeStyle = fieldDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, fieldR - 18, 0, Math.PI * 2); ctx.stroke();

  // Arched text — top + bottom
  const textCol = fieldDark ? "#FFFFFF" : "#0a0a0a";
  const accent = cfg.ring === "#0a0a0a" ? "#EDFF00" : "#FFFFFF";
  archedText(ctx, cfg.topText, cx, cy, R - 40, -Math.PI / 2, Math.PI * 0.62, false, accent, "bold 46px 'Inter Tight', sans-serif");
  archedText(ctx, cfg.bottomText, cx, cy, R - 40, Math.PI / 2, Math.PI * 0.5, true, accent, "bold 40px 'Inter Tight', sans-serif");

  // Center glyph
  const glyphCol = fieldDark ? cfg.accent || "#D4AF37" : "#0a0a0a";
  ctx.fillStyle = glyphCol;
  ctx.font = "900 180px 'Inter Tight', sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(cfg.glyph, cx, cy - 10);

  // Divider with diamond flourishes
  ctx.strokeStyle = glyphCol; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx - 120, cy + 90); ctx.lineTo(cx - 18, cy + 90); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 18, cy + 90); ctx.lineTo(cx + 120, cy + 90); ctx.stroke();
  ctx.fillStyle = glyphCol;
  ctx.beginPath();
  ctx.moveTo(cx, cy + 84); ctx.lineTo(cx + 10, cy + 90); ctx.lineTo(cx, cy + 96); ctx.lineTo(cx - 10, cy + 90);
  ctx.closePath(); ctx.fill();

  // Token label under glyph
  ctx.fillStyle = fieldDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)";
  ctx.font = "bold 34px 'Inter Tight', sans-serif";
  ctx.fillText("$OOHEX", cx, cy + 130);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 16; tex.needsUpdate = true;
  return tex;
}

// ── Chip bump map (spots recessed, text engraved) ──
function makeChipBump(cfg) {
  const c = document.createElement("canvas");
  c.width = S; c.height = S;
  const ctx = c.getContext("2d");
  const cx = S / 2, cy = S / 2, R = 500, fieldR = 320, ringW = R - fieldR, spotR = (R + fieldR) / 2;
  ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, S, S);
  // Spots slightly recessed
  ctx.fillStyle = "#5a5a5a";
  [-Math.PI / 2, 0, Math.PI / 2, Math.PI].forEach((a) => {
    ctx.save();
    ctx.translate(cx + Math.cos(a) * spotR, cy + Math.sin(a) * spotR);
    ctx.rotate(a);
    roundRectPath(ctx, -ringW / 2 + 8, -64, ringW - 16, 128, 20); ctx.fill();
    ctx.restore();
  });
  // Engraved text (dark)
  ctx.fillStyle = "#303030"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  archedText(ctx, cfg.topText, cx, cy, R - 40, -Math.PI / 2, Math.PI * 0.62, false, "#303030", "bold 46px 'Inter Tight', sans-serif");
  archedText(ctx, cfg.bottomText, cx, cy, R - 40, Math.PI / 2, Math.PI * 0.5, true, "#303030", "bold 40px 'Inter Tight', sans-serif");
  ctx.fillStyle = "#262626"; ctx.font = "900 180px 'Inter Tight', sans-serif";
  ctx.fillText(cfg.glyph, cx, cy - 10);
  // Raised outer rim (light)
  ctx.strokeStyle = "#b8b8b8"; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.arc(cx, cy, R - 6, 0, Math.PI * 2); ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 16;
  return tex;
}

// ── Edge texture: ring color + 4 spot bands + reeding ──
function makeChipEdge(ring, spot) {
  const c = document.createElement("canvas");
  c.width = 2048; c.height = 64;
  const ctx = c.getContext("2d");
  ctx.fillStyle = ring; ctx.fillRect(0, 0, 2048, 64);
  // Reeding
  ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.lineWidth = 1.5;
  for (let i = 0; i < 256; i++) { ctx.beginPath(); ctx.moveTo(i * 8, 0); ctx.lineTo(i * 8, 64); ctx.stroke(); }
  // 4 spot bands aligned with face spots (every 512px)
  ctx.fillStyle = spot;
  for (let i = 0; i < 4; i++) { ctx.fillRect(i * 512 + 156, 0, 200, 64); }
  ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) { ctx.strokeRect(i * 512 + 156, 0, 200, 64); }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping; tex.anisotropy = 8;
  return tex;
}

// ── Build the 3D chip: thin disc + edge sleeve + two face discs ──
function buildChip(ring, spot, field, glyph, topText, bottomText, accent) {
  const R = 1.5;
  const halfH = 0.11;

  const group = new THREE.Group();
  const inner = new THREE.Group();
  inner.rotation.x = Math.PI / 2;
  group.add(inner);

  const faceTex = makeChipFace({ ring, spot, field, glyph, topText, bottomText, accent });
  const faceBump = makeChipBump({ glyph, topText, bottomText });
  const edgeTex = makeChipEdge(ring, spot);

  const clayMat = (map, bump) => new THREE.MeshPhysicalMaterial({
    map, bumpMap: bump, bumpScale: 0.04,
    metalness: 0.12, roughness: 0.42,
    clearcoat: 0.8, clearcoatRoughness: 0.2, envMapIntensity: 1.4,
  });

  // Edge sleeve
  const edgeGeo = new THREE.CylinderGeometry(R, R, halfH * 2, 160, 1, true);
  const edgeMat = new THREE.MeshPhysicalMaterial({
    map: edgeTex, metalness: 0.1, roughness: 0.5, clearcoat: 0.6, envMapIntensity: 1.2,
  });
  const edge = new THREE.Mesh(edgeGeo, edgeMat);
  edge.castShadow = true; edge.receiveShadow = true;
  inner.add(edge);

  // Face discs
  const faceGeo = new THREE.CircleGeometry(R, 160);
  const top = new THREE.Mesh(faceGeo, clayMat(faceTex, faceBump));
  top.name = "faceTop"; top.rotation.x = -Math.PI / 2; top.position.y = halfH + 0.001;
  top.receiveShadow = true; top.castShadow = true;
  inner.add(top);
  const bot = new THREE.Mesh(faceGeo.clone(), clayMat(faceTex.clone(), faceBump.clone()));
  bot.name = "faceBot"; bot.rotation.x = Math.PI / 2; bot.rotation.z = Math.PI; bot.position.y = -(halfH + 0.001);
  bot.receiveShadow = true; bot.castShadow = true;
  inner.add(bot);

  return group;
}

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

const TokenChip3D = forwardRef(function TokenChip3D({ ring, spot, field, glyph, topText, bottomText, accent }, ref) {
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
      a.download = `oohex-chip-${(glyph || "token").toLowerCase()}.png`;
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

    scene.add(new THREE.AmbientLight(0xffffff, 0.22));
    const key = new THREE.DirectionalLight(0xfff0d6, 1.6);
    key.position.set(3, 7, 4); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5; key.shadow.camera.far = 20;
    key.shadow.camera.left = -3; key.shadow.camera.right = 3;
    key.shadow.camera.top = 3; key.shadow.camera.bottom = -3;
    key.shadow.bias = -0.0008; key.shadow.radius = 6;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x6fd6ff, 0.5); fill.position.set(-5, -1, 3); scene.add(fill);
    const rimL = new THREE.DirectionalLight(0xedff00, 0.45); rimL.position.set(0, 3, -6); scene.add(rimL);

    // Contact shadow (soft radial anchor) + real shadow-catching ground.
    // Disc radius = 1.5 → bottom sits at y ≈ -1.5; planes flush just below.
    const sCv = document.createElement("canvas"); sCv.width = 256; sCv.height = 256;
    const sCx = sCv.getContext("2d");
    const sG = sCx.createRadialGradient(128, 128, 0, 128, 128, 128);
    sG.addColorStop(0, "rgba(0,0,0,0.5)"); sG.addColorStop(0.5, "rgba(0,0,0,0.2)"); sG.addColorStop(1, "rgba(0,0,0,0)");
    sCx.fillStyle = sG; sCx.fillRect(0, 0, 256, 256);
    const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 3), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sCv), transparent: true, depthWrite: false }));
    contactShadow.rotation.x = -Math.PI / 2; contactShadow.position.y = -1.55; scene.add(contactShadow);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShadowMaterial({ opacity: 0.4 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -1.56; ground.receiveShadow = true; scene.add(ground);

    S.current = { renderer, scene, camera, controls, chip: null, raf: 0, fitDist: 7, fitCenter: new THREE.Vector3(0, 0, 0), playing: true, speed: 0.005 };

    const onResize = () => {
      const nw = mount.clientWidth, nh = mount.clientHeight || 560;
      camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    const animate = () => {
      const st = S.current; if (!st) return;
      st.raf = requestAnimationFrame(animate);
      if (st.chip && st.playing) {
        st.chip.rotation.y += st.speed;
        st.chip.position.y = Math.sin(performance.now() * 0.0008) * 0.025;
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

  // Rebuild chip on any visual config change
  useEffect(() => {
    const st = S.current; if (!st) return;
    if (st.chip) {
      st.scene.remove(st.chip);
      st.chip.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { const m = o.material; (Array.isArray(m) ? m : [m]).forEach((x) => { if (x.map) x.map.dispose(); if (x.bumpMap) x.bumpMap.dispose(); x.dispose(); }); }
      });
      st.chip = null;
    }
    st.chip = buildChip(ring, spot, field, glyph, topText, bottomText, accent);
    st.scene.add(st.chip);
    const { dist, center } = fitCamera(st.camera, st.controls, st.chip);
    st.fitDist = dist; st.fitCenter = center;
  }, [ring, spot, field, glyph, topText, bottomText, accent]);

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
    if (S.current) S.current.speed = 0.005 * v;
  };

  return (
    <div className="relative overflow-hidden border border-slate2 bg-card">
      <style>{`@keyframes chip-scan{0%{top:6%}100%{top:94%}}`}</style>
      <div ref={mountRef} className="h-[560px] w-full" style={{ touchAction: "none", cursor: "grab" }} />
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-ozone/60" />
        <span className="absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-ozone/60" />
        <span className="absolute left-3 bottom-3 h-4 w-4 border-l-2 border-b-2 border-ozone/60" />
        <span className="absolute right-3 bottom-3 h-4 w-4 border-r-2 border-b-2 border-ozone/60" />
        <div className="absolute inset-x-6" style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(237,255,0,.4),transparent)", animation: "chip-scan 5s linear infinite" }} />
      </div>
      <div className="absolute left-3 top-12 flex flex-col gap-1.5">
        {[
          { id: "void", bg: "#0a0a0a" }, { id: "dark", bg: "#1a1a1a" }, { id: "grey", bg: "#2a2a2a" }, { id: "light", bg: "#444444" }, { id: "white", bg: "#e8e8e8" },
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
        <span className="text-ozone">$OOHEX</span>
        <span>· CHIP MARK</span>
        <span>· 64MM Ø · 3.2MM</span>
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

export default TokenChip3D;