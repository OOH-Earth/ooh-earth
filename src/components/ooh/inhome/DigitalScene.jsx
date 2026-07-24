import { useEffect, useRef } from "react";
import * as THREE from "three";
import { platformMeta } from "./digitalConfig";

// 3D metaverse-style ad field: floating billboard planes on posts.
// Operatives drag to orbit, click a billboard to select the bust.
export default function DigitalScene({ busts = [], selectedId, onSelect, onPlace }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  // mount once
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const w = mount.clientWidth || 1;
    const h = mount.clientHeight || 1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 20, 64);

    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 200);
    camera.position.set(0, 6, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.PointLight(0xedff00, 1.4, 90);
    key.position.set(0, 14, 0);
    scene.add(key);
    const rim = new THREE.PointLight(0xff5c00, 0.6, 70);
    rim.position.set(-12, 4, -10);
    scene.add(rim);

    const grid = new THREE.GridHelper(90, 45, 0x1a1a1a, 0x101010);
    grid.position.y = -3;
    scene.add(grid);

    // invisible ground plane for click-to-place raycasting
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 90),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0a, transparent: true, opacity: 0.01 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.99;
    scene.add(ground);
    stateRef.current.ground = ground;

    const group = new THREE.Group();
    scene.add(group);
    stateRef.current.group = group;
    stateRef.current.planes = [];

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let dragged = false;
    const onClick = (e) => {
      if (dragged) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(stateRef.current.planes, false)[0];
      if (hit && hit.object.userData.bustId) { onSelect && onSelect(hit.object.userData.bustId); return; }
      const g = stateRef.current.ground && raycaster.intersectObject(stateRef.current.ground, false)[0];
      if (g) onPlace && onPlace();
    };
    renderer.domElement.addEventListener("click", onClick);

    // drag to orbit
    let dragging = false, lastX = 0, lastY = 0;
    let yaw = 0, pitch = 0.25;
    const down = () => { dragging = true; dragged = false; lastX = 0; lastY = 0; };
    const move = (e) => {
      if (!dragging) return;
      if (lastX || lastY) {
        if (Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY) > 4) dragged = true;
      }
      yaw += (e.clientX - lastX) * 0.005;
      pitch = Math.max(-0.4, Math.min(1.1, pitch + (e.clientY - lastY) * 0.005));
      lastX = e.clientX; lastY = e.clientY;
    };
    const up = () => { dragging = false; };
    renderer.domElement.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!dragging) yaw += 0.0015;
      const r = 22;
      camera.position.x = Math.sin(yaw) * r;
      camera.position.z = Math.cos(yaw) * r;
      camera.position.y = 6 + Math.sin(pitch) * 8;
      camera.lookAt(0, 1, 0);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const W = mount.clientWidth || 1, H = mount.clientHeight || 1;
      camera.aspect = W / H; camera.updateProjectionMatrix(); renderer.setSize(W, H);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("pointerdown", down);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // build billboard meshes when busts change
  useEffect(() => {
    const group = stateRef.current.group;
    if (!group) return;
    while (group.children.length) {
      const c = group.children[0];
      group.remove(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    }
    const planes = [];
    stateRef.current.planes = planes;

    const cols = 5;
    busts.forEach((b, i) => {
      const meta = platformMeta(b.platform);
      const verified = b.status === "verified";
      const color = verified ? 0xedff00 : (meta.accent === "#FF5C00" ? 0xff5c00 : 0xedff00);
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - (cols - 1) / 2) * 4.4;
      const z = (row - 1) * 4.4;
      const y = 1.2;

      const geo = new THREE.PlaneGeometry(3, 1.8);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: new THREE.Color(color),
        emissiveIntensity: verified ? 0.6 : 0.28,
        transparent: true,
        opacity: 0.94,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.userData.bustId = b.id;
      mesh.userData.baseEmissive = verified ? 0.6 : 0.28;
      group.add(mesh);
      planes.push(mesh);

      const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, y - 2.2, z);
      group.add(post);
    });
  }, [busts]);

  // highlight selected
  useEffect(() => {
    const planes = stateRef.current.planes || [];
    planes.forEach((m) => {
      const sel = m.userData.bustId === selectedId;
      m.material.emissiveIntensity = sel ? 0.95 : m.userData.baseEmissive;
      m.scale.setScalar(sel ? 1.18 : 1);
    });
  }, [selectedId, busts]);

  return <div ref={mountRef} className="absolute inset-0" />;
}