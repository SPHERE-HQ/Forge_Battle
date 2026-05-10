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

// ─── Lighting ─────────────────────────────────────────────────────────────────
const AMBIENT_INTENSITY = 0.85;
const KEY_INTENSITY     = 2.00;
const RIM_INTENSITY     = 1.10;
const FILL_INTENSITY    = 0.65;
const RIM_COLOR_DARK    = 0xff7700;
const RIM_COLOR_LIGHT   = 0x0088ff;

// ─── Delta-time cap ───────────────────────────────────────────────────────────
const DT_CAP_SEC = 0.1;

// ─── Bone discovery: finds the first bone whose name includes any keyword ─────
function findBone(root: THREE.Object3D, ...keywords: string[]): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  root.traverse(obj => {
    if (found) return;
    const n = obj.name.toLowerCase();
    if (keywords.some(k => n.includes(k))) found = obj;
  });
  return found;
}

// ─── Lerp helpers ─────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function smoothstep(t: number) { return t * t * (3 - 2 * t); }
// smooth arc 0→1→0 over phase 0→1
function arc(phase: number) { return Math.sin(Math.max(0, Math.min(1, phase)) * Math.PI); }

// ─── Gesture state machine ────────────────────────────────────────────────────
type Gesture =
  | "idle"
  | "check_hand"
  | "shoulder_stretch"
  | "neck_roll"
  | "weight_shift"
  | "crouch";

interface BoneSet {
  head:          THREE.Object3D | null;
  neck:          THREE.Object3D | null;
  spine:         THREE.Object3D | null;  // lower spine / hips
  chest:         THREE.Object3D | null;  // upper spine / chest
  hips:          THREE.Object3D | null;
  leftUpperArm:  THREE.Object3D | null;
  rightUpperArm: THREE.Object3D | null;
  leftForearm:   THREE.Object3D | null;
  rightForearm:  THREE.Object3D | null;
  leftHand:      THREE.Object3D | null;
  rightHand:     THREE.Object3D | null;
  leftThigh:     THREE.Object3D | null;
  rightThigh:    THREE.Object3D | null;
}

interface BoneRest {
  rx: number; ry: number; rz: number;
}

function saveRest(bone: THREE.Object3D | null): BoneRest {
  if (!bone) return { rx: 0, ry: 0, rz: 0 };
  return { rx: bone.rotation.x, ry: bone.rotation.y, rz: bone.rotation.z };
}

function applyRot(bone: THREE.Object3D | null, rest: BoneRest, dx: number, dy: number, dz: number) {
  if (!bone) return;
  bone.rotation.x = rest.rx + dx;
  bone.rotation.y = rest.ry + dy;
  bone.rotation.z = rest.rz + dz;
}

interface Props {
  theme:      "dark" | "light";
  modelPath?: string;
  onLoaded?:  () => void;
}

export default function Character3D({ theme, modelPath, onLoaded }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, PIXEL_RATIO_CAP));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;

    const scene = new THREE.Scene();

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

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // ── Bone refs + rest rotations ─────────────────────────────────────────────
    const bones: BoneSet = {
      head: null, neck: null, spine: null, chest: null, hips: null,
      leftUpperArm: null, rightUpperArm: null,
      leftForearm: null,  rightForearm: null,
      leftHand: null,     rightHand: null,
      leftThigh: null,    rightThigh: null,
    };

    const rest: Record<keyof BoneSet, BoneRest> = {
      head: { rx:0,ry:0,rz:0 }, neck: { rx:0,ry:0,rz:0 },
      spine: { rx:0,ry:0,rz:0 }, chest: { rx:0,ry:0,rz:0 }, hips: { rx:0,ry:0,rz:0 },
      leftUpperArm: { rx:0,ry:0,rz:0 }, rightUpperArm: { rx:0,ry:0,rz:0 },
      leftForearm: { rx:0,ry:0,rz:0 }, rightForearm: { rx:0,ry:0,rz:0 },
      leftHand: { rx:0,ry:0,rz:0 }, rightHand: { rx:0,ry:0,rz:0 },
      leftThigh: { rx:0,ry:0,rz:0 }, rightThigh: { rx:0,ry:0,rz:0 },
    };

    // ── Load model ────────────────────────────────────────────────────────────
    const loader = new GLTFLoader();
    loader.load(
      modelPath ?? CHARACTER_MODEL_PATH,
      (gltf) => {
        const model = gltf.scene;

        const rawBox    = new THREE.Box3().setFromObject(model);
        const rawHeight = rawBox.getSize(new THREE.Vector3()).y;
        if (rawHeight > 0) model.scale.setScalar(TARGET_MODEL_HEIGHT / rawHeight);

        const box    = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.x = -center.x;
        model.position.y = -box.min.y;
        model.position.z = -center.z;

        // ── Bone discovery (covers Mixamo, Blender, Kenney naming) ──────────
        bones.hips          = findBone(model, "hips", "pelvis", "root");
        bones.spine         = findBone(model, "spine");
        bones.chest         = findBone(model, "spine1", "spine2", "chest", "torso", "upperchest");
        bones.neck          = findBone(model, "neck");
        bones.head          = findBone(model, "head");
        bones.leftUpperArm  = findBone(model, "leftshoulder", "leftupperarm", "leftarm", "upperarm.l", "upper_arm.l", "l_upperarm");
        bones.rightUpperArm = findBone(model, "rightshoulder", "rightupperarm", "rightarm", "upperarm.r", "upper_arm.r", "r_upperarm");
        bones.leftForearm   = findBone(model, "leftforearm", "forearm.l", "lower_arm.l", "l_forearm", "lowerarm.l");
        bones.rightForearm  = findBone(model, "rightforearm", "forearm.r", "lower_arm.r", "r_forearm", "lowerarm.r");
        bones.leftHand      = findBone(model, "lefthand", "hand.l", "l_hand");
        bones.rightHand     = findBone(model, "righthand", "hand.r", "r_hand");
        bones.leftThigh     = findBone(model, "leftupleg", "thigh.l", "l_thigh", "lefthip", "leftleg");
        bones.rightThigh    = findBone(model, "rightupleg", "thigh.r", "r_thigh", "righthip", "rightleg");

        // Save rest rotations AFTER model is placed
        (Object.keys(bones) as Array<keyof BoneSet>).forEach(key => {
          rest[key] = saveRest(bones[key]);
        });

        rootGroup.add(model);
        onLoaded?.();
      },
      undefined,
      (err) => console.error("Character3D load error:", err),
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

    // ─────────────────────────────────────────────────────────────────────────
    // Animation state
    // ─────────────────────────────────────────────────────────────────────────

    // -- Breathing (always on) ------------------------------------------------
    const BREATH_FREQ   = 0.22;  // breaths per second (~13/min)
    const BREATH_CHEST  = 0.018; // chest X rotation amplitude
    const BREATH_SPINE  = 0.008; // lower spine X amplitude
    const BREATH_CAM_Y  = 0.004; // camera Y float amplitude
    const BASE_CAM_Y    = CAMERA_Y;

    // -- Head look (state machine) --------------------------------------------
    // sequence: center → look-left → center → look-right
    const HEAD_SEQ      = [0, -0.42, -0.12, 0.42, 0.12] as const;
    const HEAD_SPEED    = 1.8;
    const HEAD_HOLD_MIN = 2.2;
    const HEAD_HOLD_MAX = 5.5;
    const NECK_FOLLOW   = 0.35; // neck follows head by this fraction

    let headCurY    = 0;
    let headCurX    = 0;
    let headTargY   = 0;
    let headTargX   = 0;
    let headSeqIdx  = 0;
    let headTimer   = HEAD_HOLD_MIN + Math.random() * (HEAD_HOLD_MAX - HEAD_HOLD_MIN);

    // -- Gesture state machine ------------------------------------------------
    const GESTURE_IDLE_MIN  = 4.0;
    const GESTURE_IDLE_MAX  = 9.0;
    const GESTURES: Gesture[] = ["check_hand", "shoulder_stretch", "neck_roll", "weight_shift", "crouch"];

    let currentGesture: Gesture = "idle";
    let gesturePhase  = 0;
    let gestureSpeed  = 0.5; // phase units per second
    let gestureTimer  = GESTURE_IDLE_MIN + Math.random() * (GESTURE_IDLE_MAX - GESTURE_IDLE_MIN);

    // per-gesture smoothed values (all start at 0 = rest)
    let hipShift   = 0; // Z rotation on hips (weight shift)
    let crouchDrop = 0; // Y position drop on hips (crouch)

    // -- Render loop ----------------------------------------------------------
    let raf: number;
    let prevT = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t  = clock.getElapsedTime();
      const dt = Math.min(t - prevT, DT_CAP_SEC);
      prevT    = t;

      // ── Breathing ──────────────────────────────────────────────────────────
      const breathPhase  = t * BREATH_FREQ * Math.PI * 2;
      const breathVal    = Math.sin(breathPhase);
      const breathChestX = breathVal * BREATH_CHEST;
      const breathSpineX = breathVal * BREATH_SPINE;
      camera.position.y  = BASE_CAM_Y + breathVal * BREATH_CAM_Y;

      // ── Head look state machine ────────────────────────────────────────────
      headCurY += (headTargY - headCurY) * Math.min(HEAD_SPEED * dt, 1);
      headCurX += (headTargX - headCurX) * Math.min(HEAD_SPEED * dt, 1);

      if (Math.abs(headCurY - headTargY) < 0.006 && Math.abs(headCurX - headTargX) < 0.006) {
        headTimer -= dt;
        if (headTimer <= 0) {
          headSeqIdx = (headSeqIdx + 1) % HEAD_SEQ.length;
          headTargY  = HEAD_SEQ[headSeqIdx];
          // slight chin tilt while looking sideways
          headTargX  = Math.abs(headTargY) > 0.1 ? -0.04 + Math.random() * 0.06 : 0;
          headTimer  = HEAD_HOLD_MIN + Math.random() * (HEAD_HOLD_MAX - HEAD_HOLD_MIN);
        }
      }

      // ── Gesture state machine ──────────────────────────────────────────────
      if (currentGesture === "idle") {
        gestureTimer -= dt;
        if (gestureTimer <= 0) {
          const pick = GESTURES[Math.floor(Math.random() * GESTURES.length)];
          currentGesture = pick;
          gesturePhase   = 0;
          switch (pick) {
            case "check_hand":       gestureSpeed = 0.55; break;
            case "shoulder_stretch": gestureSpeed = 0.45; break;
            case "neck_roll":        gestureSpeed = 0.50; break;
            case "weight_shift":     gestureSpeed = 0.35; break;
            case "crouch":           gestureSpeed = 0.40; break;
          }
        }
      } else {
        gesturePhase += dt * gestureSpeed;
        if (gesturePhase >= 1) {
          currentGesture = "idle";
          gesturePhase   = 0;
          gestureTimer   = GESTURE_IDLE_MIN + Math.random() * (GESTURE_IDLE_MAX - GESTURE_IDLE_MIN);
        }
      }

      const gArc  = arc(gesturePhase);              // smooth 0→1→0
      const gUp   = smoothstep(gesturePhase * 2);   // smooth 0→1 for first half
      const gDown = 1 - smoothstep((gesturePhase - 0.5) * 2); // smooth 1→0 for second half
      void gUp; void gDown;

      // ── Apply all bone rotations ────────────────────────────────────────────

      // Base breathing on chest + spine
      applyRot(bones.chest, rest.chest, breathChestX, 0, 0);
      applyRot(bones.spine, rest.spine, breathSpineX, 0, 0);

      // Head + neck: look-around + gesture overrides
      let headAddX = 0;
      let headAddY = headCurY;

      // GESTURE: check_hand — raise right forearm, look down at hand
      if (currentGesture === "check_hand") {
        applyRot(bones.rightForearm, rest.rightForearm, -0.60 * gArc, 0, 0);
        applyRot(bones.rightHand,   rest.rightHand,     0.25 * gArc, 0, 0.15 * gArc);
        headAddX += -0.12 * gArc; // look slightly down
        headAddY = lerp(headCurY, 0.15, gArc); // glance toward raised hand
      } else {
        applyRot(bones.rightForearm, rest.rightForearm, 0, 0, 0);
        applyRot(bones.rightHand,    rest.rightHand,    0, 0, 0);
      }

      // GESTURE: shoulder_stretch — raise both upper arms + arch chest
      if (currentGesture === "shoulder_stretch") {
        applyRot(bones.leftUpperArm,  rest.leftUpperArm,  -0.15 * gArc, 0,  0.20 * gArc);
        applyRot(bones.rightUpperArm, rest.rightUpperArm, -0.15 * gArc, 0, -0.20 * gArc);
        applyRot(bones.chest,         rest.chest,          breathChestX - 0.08 * gArc, 0, 0);
        headAddX += 0.06 * gArc; // look slightly up while stretching
      } else {
        applyRot(bones.leftUpperArm,  rest.leftUpperArm,  0, 0, 0);
        applyRot(bones.rightUpperArm, rest.rightUpperArm, 0, 0, 0);
      }

      // GESTURE: neck_roll — slow head circle
      if (currentGesture === "neck_roll") {
        const angle = gesturePhase * Math.PI * 2;
        headAddX  += Math.sin(angle) * 0.18;
        headAddY   = Math.cos(angle) * 0.28;
        applyRot(bones.neck, rest.neck,
          Math.sin(angle) * 0.10,
          Math.cos(angle) * 0.14,
          Math.sin(angle) * 0.08
        );
      } else {
        if (currentGesture !== "check_hand") {
          applyRot(bones.neck, rest.neck, headCurX * NECK_FOLLOW, headCurY * NECK_FOLLOW, 0);
        }
      }

      // GESTURE: weight_shift — sway hips, upper body counter-sways
      const SHIFT_TARGET = currentGesture === "weight_shift" ? Math.sin(gesturePhase * Math.PI * 2) * 0.06 : 0;
      hipShift += (SHIFT_TARGET - hipShift) * Math.min(3 * dt, 1);
      applyRot(bones.hips,  rest.hips,  0, 0, hipShift);
      applyRot(bones.spine, rest.spine, breathSpineX, 0, -hipShift * 0.4);

      // GESTURE: crouch — lower hips + bend thighs
      const CROUCH_TARGET = currentGesture === "crouch" ? gArc * 0.12 : 0;
      crouchDrop += (CROUCH_TARGET - crouchDrop) * Math.min(3 * dt, 1);
      if (bones.hips && crouchDrop > 0.001) {
        bones.hips.position.y = rest.hips.rx * 0 + (bones.hips.position.y - bones.hips.position.y) * 0;
        // Move root group down slightly
        rootGroup.position.y = -crouchDrop;
      } else {
        rootGroup.position.y = 0;
      }
      if (currentGesture === "crouch") {
        applyRot(bones.leftThigh,  rest.leftThigh,  0.18 * gArc, 0, 0);
        applyRot(bones.rightThigh, rest.rightThigh, 0.18 * gArc, 0, 0);
      } else {
        applyRot(bones.leftThigh,  rest.leftThigh,  0, 0, 0);
        applyRot(bones.rightThigh, rest.rightThigh, 0, 0, 0);
      }

      // Apply head final
      applyRot(bones.head, rest.head, headCurX + headAddX, headAddY, headCurX * 0.1);
      if (currentGesture !== "neck_roll") {
        applyRot(bones.neck, rest.neck, headCurX * NECK_FOLLOW, headCurY * NECK_FOLLOW, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
    };
  }, [theme, modelPath, onLoaded]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
