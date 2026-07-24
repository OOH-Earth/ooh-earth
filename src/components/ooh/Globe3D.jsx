import { useEffect, useRef } from "react";
import * as THREE from "three";

const RADIUS = 2;

function latLngToVec3(lat, lng, r = RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

export default function Globe3D({ markers, selectedId, onSelect }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  // setup once + rebuild markers when markers change
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let width = mount.clientWidth || 400;
    let height = mount.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5.6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    group.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(RADIUS, 64, 64),
        new THREE.MeshBasicMaterial({ color: 0x0a0a0a })
      )
    );
    group.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(RADIUS * 1.001, 36, 24),
        new THREE.MeshBasicMaterial({ color: 0x2b2b2b, wireframe: true, transparent: true, opacity: 0.45 })
      )
    );
    group.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(RADIUS * 1.09, 48, 48),
        new THREE.MeshBasicMaterial({ color: 0xedff00, transparent: true, opacity: 0.06, side: THREE.BackSide })
      )
    );

    const markerGroup = new THREE.Group();
    group.add(markerGroup);
    const markerMeshes = [];

    markers.forEach((m) => {
      if (typeof m.lat !== "number" || typeof m.lng !== "number") return;
      const pos = latLngToVec3(m.lat, m.lng, RADIUS * 1.01);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xedff00 })
      );
      dot.position.copy(pos);
      dot.userData = { id: m.id };
      markerGroup.add(dot);
      markerMeshes.push(dot);
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xedff00, transparent: true, opacity: 0.22 })
      );
      halo.position.copy(pos);
      halo.userData.halo = true;
      markerGroup.add(halo);
    });

    stateRef.current = { group, markerMeshes };

    const rotation = { x: 0.2, y: 0 };
    group.rotation.x = rotation.x;
    let dragging = false;
    let last = { x: 0, y: 0 };
    let autoRotate = true;
    let downPos = null;
    let autoTimer = null;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onDown = (e) => {
      dragging = true;
      autoRotate = false;
      last = { x: e.clientX, y: e.clientY };
      downPos = { x: e.clientX, y: e.clientY };
      if (autoTimer) clearTimeout(autoTimer);
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      rotation.y += dx * 0.005;
      rotation.x += dy * 0.005;
      rotation.x = Math.max(-1.2, Math.min(1.2, rotation.x));
      last = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e) => {
      if (!dragging) return;
      dragging = false;
      if (downPos) {
        const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
        if (moved < 5) {
          const rect = renderer.domElement.getBoundingClientRect();
          pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(pointer, camera);
          const hits = raycaster.intersectObjects(markerMeshes, false);
          if (hits.length && hits[0].object.userData.id && onSelect) {
            onSelect(hits[0].object.userData.id);
          }
        }
      }
      downPos = null;
      autoTimer = setTimeout(() => {
        if (!dragging) autoRotate = true;
      }, 3500);
    };

    const dom = renderer.domElement;
    dom.style.cursor = "grab";
    dom.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (autoRotate) rotation.y += 0.0015;
      group.rotation.y = rotation.y;
      group.rotation.x = rotation.x;
      markerGroup.children.forEach((c) => {
        if (c.userData.halo) {
          const s = 1 + Math.sin(Date.now() * 0.003 + c.position.x * 4) * 0.35;
          c.scale.setScalar(s);
        }
      });
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth || 400;
      const h = mount.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (autoTimer) clearTimeout(autoTimer);
      dom.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      renderer.dispose();
      if (dom.parentNode) dom.parentNode.removeChild(dom);
    };
  }, [markers, onSelect]);

  // recolor selected marker
  useEffect(() => {
    const { markerMeshes } = stateRef.current;
    if (!markerMeshes) return;
    markerMeshes.forEach((d) => {
      d.material.color.set(d.userData.id === selectedId ? 0xff5c00 : 0xedff00);
    });
  }, [selectedId, markers]);

  return (
    <div className="absolute inset-0">
      <div ref={mountRef} className="h-full w-full" />
      <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
        // drag to rotate · click a marker to select
      </div>
    </div>
  );
}