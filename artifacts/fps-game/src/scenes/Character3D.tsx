import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CHARACTER_MODEL_PATH } from "../constants/game";

// ─── 3D viewer constants ───────────────────────────────────────────────────────
const CAMERA_FOV          = 42;
const CAMERA_Y            = 1.0;
const CAMERA_Z            = 3.6;
const CAMERA_TARGET_Y     = 0.85;
const TARGET_MODEL_HEIGHT = 2.1;
const PIXEL_RATIO_CAP     = 2;

// ─── Lighting constants ───────────────────────────────────────────────────────
const AMBIENT_INTENSITY = 0.40;
const KEY_INTENSITY     = 1.20;
const RIM_INTENSITY     = 0.65;
const FILL_INTENSITY    = 0.28;
const RIM_COLOR_DARK    = 0xff7700;
const RIM_COLOR_LIGHT   = 0x0088ff;

// ─── Robot idle: head look-around state machine ───────────────────────────────
// Sequence of Y-rotation angles (radians): center → left → center → right → repeat
const HEAD_LOOK_SEQUENCE = [0, -0.38, 0, 0.38] as const;
const HEAD_TURN_SPEED    = 2.0;   // lerp coefficient — how fast the head turns
const HEAD_HOLD_MIN_SEC  = 2.5;   // minimum seconds to hold each pose
const HEAD_HOLD_MAX_SEC  = 5.5;   // maximum seconds to hold each pose
const HEAD_SCAN_TILT_AMP = 0.022; // subtle X-tilt while looking sideways (sensor sweep)

// ─── Robot idle: arm inspection gesture ──────────────────────────────────────
const ARM_GESTURE_MIN_SEC = 5.0;  // minimum gap between gestures (seconds)
const ARM_GESTURE_MAX_SEC = 10.0; // maximum gap between gestures (seconds)
const ARM_RAISE_RADIANS   = 0.22; // how far the forearm raises during the gesture
const ARM_GESTURE_SPEED   = 1.2;  // phase advance speed (1 = completes in ~1/speed secs)

// ─── Robot idle: spine power-hum ─────────────────────────────────────────────
const SPINE_HUM_FREQ_CPS  = 0.35;  // cycles per second
const SPINE_HUM_SCALE_AMP = 0.004; // scale delta (barely perceptible — just "alive")

// ─── Animation delta-time cap ─────────────────────────────────────────────────
const DT_CAP_SEC = 0.1; // cap dt so tab-switch doesn't cause jumps

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
    const w0     = canvas.clientWidth  || 300;
    const h0     = canvas.clientHeight || 200;
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

    // ── Scene group ───────────────────────────────────────────────────────────
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // ── Bone refs for procedural animation ───────────────────────────────────
    let headBone:  THREE.Object3D | null = null;
    let spineBone: THREE.Object3D | null = null;
    let armBone:   THREE.Object3D | null = null; // forearm for inspection gesture

    // ── Load model ────────────────────────────────────────────────────────────
    const loader = new GLTFLoader();
    loader.load(
      CHARACTER_MODEL_PATH,
      (gltf) => {
        const model = gltf.scene;

        // Scale model so it fills TARGET_MODEL_HEIGHT world-units
        const rawBox    = new THREE.Box3().setFromObject(model);
        const rawHeight = rawBox.getSize(new THREE.Vector3()).y;
        if (rawHeight > 0) model.scale.setScalar(TARGET_MODEL_HEIGHT / rawHeight);

        // Re-center: base at y=0, horizontally centered
        const box    = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.x = -center.x;
        model.position.y = -box.min.y;
        model.position.z = -center.z;

        // Discover bones — prioritise forearm for arm gesture (wrist check, robot style)
        model.traverse(obj => {
          const n = obj.name.toLowerCase();
          if (!headBone  && n.includes("head"))                                                           headBone  = obj;
          if (!spineBone && (n.includes("spine") || n.includes("chest") || n.includes("torso")))          spineBone = obj;
          if (!armBone   && (n.includes("forearm") || n.includes("lower_arm") || n.includes("lowerarm"))) armBone   = obj;
          if (!armBone   && n.includes("arm") && !n.includes("upper"))                                    armBone   = obj;
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

    // ── Robot idle state ──────────────────────────────────────────────────────
    let headCurrentY  = 0;
    let headTargetY   = 0;
    let headSeqIdx    = 0;
    let headHoldTimer = HEAD_HOLD_MIN_SEC + Math.random() * (HEAD_HOLD_MAX_SEC - HEAD_HOLD_MIN_SEC);

    let armTimer   = ARM_GESTURE_MIN_SEC + Math.random() * (ARM_GESTURE_MAX_SEC - ARM_GESTURE_MIN_SEC);
    let armPhase   = 0;
    let armRunning = false;

    // ── Render loop ───────────────────────────────────────────────────────────
    let raf: number;
    let prevT = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t  = clock.getElapsedTime();
      const dt = Math.min(t - prevT, DT_CAP_SEC);
      prevT    = t;

      // ── Head: state machine — look left/right/center with eased turns ──────
      headCurrentY += (headTargetY - headCurrentY) * Math.min(HEAD_TURN_SPEED * dt, 1);
      if (Math.abs(headCurrentY - headTargetY) < 0.008) {
        headHoldTimer -= dt;
        if (headHoldTimer <= 0) {
          headSeqIdx    = (headSeqIdx + 1) % HEAD_LOOK_SEQUENCE.length;
          headTargetY   = HEAD_LOOK_SEQUENCE[headSeqIdx];
          headHoldTimer = HEAD_HOLD_MIN_SEC + Math.random() * (HEAD_HOLD_MAX_SEC - HEAD_HOLD_MIN_SEC);
        }
      }
      if (headBone) {
        (headBone as THREE.Object3D).rotation.y = headCurrentY;
        // Subtle X-tilt proportional to how far the head is turned (sensor sweep feel)
        (headBone as THREE.Object3D).rotation.x =
          Math.sin(t * 0.7) * HEAD_SCAN_TILT_AMP * Math.abs(headCurrentY / 0.38);
      }

      // ── Arm: occasional inspection gesture (raise forearm, hold, lower) ────
      armTimer -= dt;
      if (armTimer <= 0 && !armRunning) {
        armRunning = true;
        armPhase   = 0;
        armTimer   = ARM_GESTURE_MIN_SEC + Math.random() * (ARM_GESTURE_MAX_SEC - ARM_GESTURE_MIN_SEC);
      }
      if (armRunning && armBone) {
        armPhase += dt * ARM_GESTURE_SPEED;
        // sin(0→π) gives a smooth raise-hold-lower arc over the gesture duration
        const arc = Math.sin(Math.min(armPhase, 1) * Math.PI);
        (armBone as THREE.Object3D).rotation.x = -ARM_RAISE_RADIANS * arc;
        if (armPhase >= 1) {
          armRunning = false;
          (armBone as THREE.Object3D).rotation.x = 0;
        }
      }

      // ── Spine: power-hum (internal systems are running) ───────────────────
      if (spineBone) {
        const hum = 1 + Math.sin(t * SPINE_HUM_FREQ_CPS * Math.PI * 2) * SPINE_HUM_SCALE_AMP;
        (spineBone as THREE.Object3D).scale.set(hum, hum, hum);
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
