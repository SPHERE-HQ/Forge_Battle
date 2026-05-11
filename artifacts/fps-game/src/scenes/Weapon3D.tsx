import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// ─── Render constants ─────────────────────────────────────────────────────────
const CAM_FOV         = 42;
const CAM_Z           = 2.4;
const CAM_Y           = 0.15;
const CAM_TARGET_Y    = 0.0;
const PIXEL_RATIO_CAP = 2;
const ROTATE_SPEED    = 0.55;
const BOB_FREQ        = 0.30;
const BOB_AMP         = 0.06;
const TARGET_SIZE     = 1.0;
const DT_CAP          = 0.1;

// ─── Lighting ─────────────────────────────────────────────────────────────────
const AMBIENT_INT  = 1.0;
const KEY_INT      = 2.2;
const FILL_INT     = 0.65;
const RIM_INT      = 1.0;
const RIM_DARK_HEX = 0xff7700;
const RIM_LITE_HEX = 0x0088ff;

interface Props {
  modelPath: string;
  theme:     "dark" | "light";
  onLoaded?: () => void;
}

export default function Weapon3D({ modelPath, theme, onLoaded }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, PIXEL_RATIO_CAP));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene  = new THREE.Scene();
    const w0     = canvas.clientWidth  || 300;
    const h0     = canvas.clientHeight || 200;
    const camera = new THREE.PerspectiveCamera(CAM_FOV, w0 / h0, 0.01, 100);
    camera.position.set(0, CAM_Y, CAM_Z);
    camera.lookAt(0, CAM_TARGET_Y, 0);

    scene.add(new THREE.AmbientLight(0xffffff, AMBIENT_INT));

    const keyLight = new THREE.DirectionalLight(0xffffff, KEY_INT);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xaabbff, FILL_INT);
    fillLight.position.set(-1, 1, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(
      theme === "dark" ? RIM_DARK_HEX : RIM_LITE_HEX,
      RIM_INT,
    );
    rimLight.position.set(-2, 2, -3);
    scene.add(rimLight);

    const pivot = new THREE.Group();
    scene.add(pivot);

    let loaded = false;
    let raf: number;
    let prevT = 0;
    const clock = new THREE.Clock();

    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;

        const rawBox = new THREE.Box3().setFromObject(model);
        const size   = rawBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) model.scale.setScalar(TARGET_SIZE / maxDim);

        const box2   = new THREE.Box3().setFromObject(model);
        const center = box2.getCenter(new THREE.Vector3());
        model.position.sub(center);

        pivot.add(model);
        loaded = true;
        onLoaded?.();
      },
      undefined,
      (err) => console.error("Weapon3D load error:", err),
    );

    const ro = new ResizeObserver(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(canvas);

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t  = clock.getElapsedTime();
      const dt = Math.min(t - prevT, DT_CAP);
      prevT    = t;
      if (loaded) {
        pivot.rotation.y += ROTATE_SPEED * dt;
        pivot.position.y  = Math.sin(t * BOB_FREQ * Math.PI * 2) * BOB_AMP;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
    };
  }, [modelPath, theme, onLoaded]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
