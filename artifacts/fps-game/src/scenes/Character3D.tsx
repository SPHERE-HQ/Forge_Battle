import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CHARACTER_MODEL_PATH } from "../constants/game";

// ─── 3D viewer constants ───────────────────────────────────────────────────────
const CAMERA_FOV           = 42;
const CAMERA_Y             = 1.0;
const CAMERA_Z             = 3.6;
const CAMERA_TARGET_Y      = 0.85;
const TARGET_MODEL_HEIGHT  = 2.1;
const PIXEL_RATIO_CAP      = 2;

// ─── Idle animation constants ─────────────────────────────────────────────────
const FLOAT_FREQ       = 1.15;   // cycles / sec  (up-down breathing)
const FLOAT_AMP        = 0.038;  // world units
const SWAY_FREQ        = 0.55;   // cycles / sec  (side lean)
const SWAY_AMP         = 0.016;  // radians
const HEAD_FREQ        = 0.28;   // cycles / sec  (head look-around)
const HEAD_AMP         = 0.014;  // radians
const SPINE_SCALE_AMP  = 0.012;  // chest scale pulse

// ─── Lighting constants ───────────────────────────────────────────────────────
const AMBIENT_INTENSITY  = 0.40;
const KEY_INTENSITY      = 1.20;
const RIM_INTENSITY      = 0.65;
const FILL_INTENSITY     = 0.28;
const RIM_COLOR_DARK     = 0xff7700;
const RIM_COLOR_LIGHT    = 0x0088ff;

interface Props {
  theme:     "dark" | "light";
  onLoaded?: () => void;
}

export default function Character3D({ theme, onLoaded }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, PIXEL_RATIO_CAP));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    // ── Camera ────────────────────────────────────────────────────────────────
    const w0 = canvas.clientWidth  || 300;
    const h0 = canvas.clientHeight || 200;
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, w0 / h0, 0.1, 100);
    camera.position.set(0, CAMERA_Y, CAMERA_Z);
    camera.lookAt(0, CAMERA_TARGET_Y, 0);

    // ── Lights ────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, AMBIENT_INTENSITY));

    const keyLight = new THREE.DirectionalLight(0xffffff, KEY_INTENSITY);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    const rimColor = theme === "dark" ? RIM_COLOR_DARK : RIM_COLOR_LIGHT;
    const rimLight = new THREE.DirectionalLight(rimColor, RIM_INTENSITY);
    rimLight.position.set(-2, 2, -3);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0x88aaff, FILL_INTENSITY);
    fillLight.position.set(1, 0, 2);
    scene.add(fillLight);

    // ── Scene groups ──────────────────────────────────────────────────────────
    const floatGroup = new THREE.Group();
    const rootGroup  = new THREE.Group();
    floatGroup.add(rootGroup);
    scene.add(floatGroup);

    // ── Bone refs for procedural animation ───────────────────────────────────
    let headBone:  THREE.Object3D | null = null;
    let spineBone: THREE.Object3D | null = null;

    // ── Load model ────────────────────────────────────────────────────────────
    const loader = new GLTFLoader();
    loader.load(
      CHARACTER_MODEL_PATH,
      (gltf) => {
        const model = gltf.scene;

        // Scale model so it fills TARGET_MODEL_HEIGHT world-units
        const rawBox    = new THREE.Box3().setFromObject(model);
        const rawHeight = rawBox.getSize(new THREE.Vector3()).y;
        if (rawHeight > 0) {
          model.scale.setScalar(TARGET_MODEL_HEIGHT / rawHeight);
        }

        // Re-center: base at y=0, horizontally centered
        const box    = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.x = -center.x;
        model.position.y = -box.min.y;
        model.position.z = -center.z;

        // Discover bones
        model.traverse(obj => {
          const n = obj.name.toLowerCase();
          if (!headBone  && (n.includes("head")))              headBone  = obj;
          if (!spineBone && (n.includes("spine") || n.includes("chest") || n.includes("torso")))
                                                                spineBone = obj;
        });

        rootGroup.add(model);
        onLoaded?.();
      },
      undefined,
      (err) => console.error("Character3D GLB load error:", err),
    );

    // ── Resize ────────────────────────────────────────────────────────────────
    const handleResize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas);
    handleResize();

    // ── Render loop ───────────────────────────────────────────────────────────
    let raf: number;
    const clock = new THREE.Clock();

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const twoPi = Math.PI * 2;

      // Float (whole character gently bobs up-down)
      floatGroup.position.y = Math.sin(t * FLOAT_FREQ * twoPi) * FLOAT_AMP;

      // Side sway (subtle lean left-right)
      floatGroup.rotation.z = Math.sin(t * SWAY_FREQ * twoPi) * SWAY_AMP;

      // Head look-around
      if (headBone) {
        (headBone as THREE.Object3D).rotation.y =
          Math.sin(t * HEAD_FREQ * twoPi) * HEAD_AMP;
      }

      // Spine breathing pulse
      if (spineBone) {
        const pulse = 1 + Math.sin(t * FLOAT_FREQ * twoPi) * SPINE_SCALE_AMP;
        (spineBone as THREE.Object3D).scale.set(pulse, pulse, pulse);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
    };
  }, [theme, onLoaded]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
