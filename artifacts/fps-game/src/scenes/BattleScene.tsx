import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import type { BattleConfig } from "../game/battleTypes";

interface Props {
  config: BattleConfig;
  onEnd: (won: boolean, kills: number) => void;
}

// ─── Helper: colored Box mesh ─────────────────────────────────────────────────
function makeBox(
  w: number, h: number, d: number,
  color: number,
  x: number, y: number, z: number,
  castShadow = true,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color }),
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  return mesh;
}

// ─── Blocky humanoid (Roblox / Minecraft style) ───────────────────────────────
// Front face = local +Z  (eyes are placed at z = +0.41)
// Root placed at foot level (y = 0).
// Arms/legs use pivot Groups so rotation.x swings from the joint.
interface BlockChar {
  root:    THREE.Group;
  armLPiv: THREE.Group;
  armRPiv: THREE.Group;
  legLPiv: THREE.Group;
  legRPiv: THREE.Group;
}

function buildBlockChar(
  skinColor = 0xffcc99,
  bodyColor = 0x1155cc,
  legColor  = 0x1a1a44,
): BlockChar {
  const root = new THREE.Group();

  // Head
  root.add(makeBox(0.80, 0.80, 0.80, skinColor, 0, 2.40, 0));
  // Eyes on +Z face
  root.add(makeBox(0.16, 0.16, 0.02, 0x111111, -0.17, 2.46,  0.41, false));
  root.add(makeBox(0.16, 0.16, 0.02, 0x111111,  0.17, 2.46,  0.41, false));
  // Mouth
  root.add(makeBox(0.22, 0.06, 0.02, 0x884422,  0.00, 2.22,  0.41, false));

  // Body
  root.add(makeBox(1.00, 1.00, 0.50, bodyColor, 0, 1.50, 0));

  // Arms — pivot at shoulder so swing looks natural
  const armLPiv = new THREE.Group();
  armLPiv.position.set(-0.675, 2.00, 0);
  armLPiv.add(makeBox(0.35, 1.00, 0.35, bodyColor, 0, -0.50, 0));
  root.add(armLPiv);

  const armRPiv = new THREE.Group();
  armRPiv.position.set(0.675, 2.00, 0);
  armRPiv.add(makeBox(0.35, 1.00, 0.35, bodyColor, 0, -0.50, 0));
  root.add(armRPiv);

  // Legs — pivot at hip
  const legLPiv = new THREE.Group();
  legLPiv.position.set(-0.18, 1.00, 0);
  legLPiv.add(makeBox(0.35, 1.00, 0.35, legColor, 0, -0.50, 0));
  root.add(legLPiv);

  const legRPiv = new THREE.Group();
  legRPiv.position.set(0.18, 1.00, 0);
  legRPiv.add(makeBox(0.35, 1.00, 0.35, legColor, 0, -0.50, 0));
  root.add(legRPiv);

  return { root, armLPiv, armRPiv, legLPiv, legRPiv };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function BattleScene({ onEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleExit = useCallback(() => {
    onEnd(false, 0);
  }, [onEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace  = THREE.SRGBColorSpace;

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog        = new THREE.FogExp2(0x87ceeb, 0.007);

    // ── Camera ────────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 600);

    // ── Lighting ──────────────────────────────────────────────────────────────
    const sun = new THREE.DirectionalLight(0xfff4d0, 2.2);
    sun.position.set(50, 90, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near   = 1;
    sun.shadow.camera.far    = 300;
    const sc                 = 120;
    sun.shadow.camera.left   = -sc;
    sun.shadow.camera.right  =  sc;
    sun.shadow.camera.top    =  sc;
    sun.shadow.camera.bottom = -sc;
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x8899bb, 0.9));
    const fill = new THREE.DirectionalLight(0xaaccff, 0.4);
    fill.position.set(-30, 20, -30);
    scene.add(fill);

    // ── Ground — flat, empty, no obstacles ────────────────────────────────────
    const groundMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshLambertMaterial({ color: 0x5a9c3a }),
    );
    groundMesh.rotation.x   = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Subtle grid
    const grid = new THREE.GridHelper(600, 60, 0x000000, 0x000000);
    (grid.material as THREE.LineBasicMaterial).opacity     = 0.05;
    (grid.material as THREE.LineBasicMaterial).transparent = true;
    scene.add(grid);

    // ── Player character ──────────────────────────────────────────────────────
    const char = buildBlockChar();
    scene.add(char.root);

    // ── Player / camera state ─────────────────────────────────────────────────
    const pos   = new THREE.Vector3(0, 0, 0);
    const camV  = new THREE.Vector3();   // smoothed camera position
    let yaw     = 0;      // camera yaw   (rad)  — 0 = looks +Z
    let pitch   = -0.38;  // camera pitch (rad)  — negative → cam is above player
    let walkPhase = 0;
    let locked  = false;

    const SPEED      = 8.0;
    const SPRINT_MUL = 1.65;
    const CAM_DIST   = 5.5;
    const CAM_LOOK_Y = 1.5;    // look-at height (chest)
    const CAM_LERP   = 0.16;
    const PITCH_MIN  = -1.15;
    const PITCH_MAX  =  0.25;
    const MOUSE_SENS = 0.003;

    // ── Input ─────────────────────────────────────────────────────────────────
    const keys = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      const BLOCK = ["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"];
      if (BLOCK.includes(e.code)) e.preventDefault();
      keys.add(e.code);
      if (e.code === "Escape") {
        if (locked) document.exitPointerLock();
        handleExit();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup",   onKeyUp);

    const onCanvasClick = () => { if (!locked) canvas.requestPointerLock(); };
    canvas.addEventListener("click", onCanvasClick);

    const onMouseMove = (e: MouseEvent) => {
      if (!locked) return;
      yaw   -= e.movementX * MOUSE_SENS;
      pitch -= e.movementY * MOUSE_SENS;
      pitch  = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch));
    };
    document.addEventListener("mousemove", onMouseMove);

    const onLockChange = () => { locked = document.pointerLockElement === canvas; };
    document.addEventListener("pointerlockchange", onLockChange);

    // ── Resize ────────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(canvas);
    {
      const w = canvas.clientWidth  || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    // Initialise smooth-cam position to behind player
    camV.set(0, CAM_LOOK_Y - Math.sin(pitch) * CAM_DIST, -CAM_DIST * Math.cos(pitch));

    // ── Render loop ───────────────────────────────────────────────────────────
    const clock  = new THREE.Clock();
    const tmpCam = new THREE.Vector3();
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);

      // ── Movement ────────────────────────────────────────────────────────────
      // forward dir = (sin yaw, 0, cos yaw)  [yaw 0 → +Z axis]
      // right   dir = (cos yaw, 0, -sin yaw)
      let fwd = 0, rgt = 0;
      if (keys.has("KeyW") || keys.has("ArrowUp"))    fwd =  1;
      if (keys.has("KeyS") || keys.has("ArrowDown"))  fwd = -1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) rgt =  1;
      if (keys.has("KeyA") || keys.has("ArrowLeft"))  rgt = -1;

      const sprint   = keys.has("ShiftLeft") || keys.has("ShiftRight");
      const isMoving = fwd !== 0 || rgt !== 0;
      const spd      = SPEED * (sprint ? SPRINT_MUL : 1.0);

      const sinY = Math.sin(yaw), cosY = Math.cos(yaw);

      if (isMoving) {
        const len = Math.sqrt(fwd * fwd + rgt * rgt);
        // world-space movement direction
        const nx = (sinY * fwd + cosY * rgt) / len;
        const nz = (cosY * fwd - sinY * rgt) / len;
        pos.x += nx * spd * dt;
        pos.z += nz * spd * dt;

        // Character faces movement direction
        char.root.rotation.y = Math.atan2(nx, nz);
        walkPhase += dt * (sprint ? 12 : 8);
      } else {
        // Standing still → face camera forward
        char.root.rotation.y = yaw;
        walkPhase = 0;
      }

      char.root.position.set(pos.x, 0, pos.z);

      // ── Walk animation ──────────────────────────────────────────────────────
      const swing = isMoving ? Math.sin(walkPhase) * (sprint ? 0.65 : 0.50) : 0;
      char.armLPiv.rotation.x =  swing * 0.65;
      char.armRPiv.rotation.x = -swing * 0.65;
      char.legLPiv.rotation.x = -swing;
      char.legRPiv.rotation.x =  swing;

      if (!isMoving) {
        const idle = Math.sin(clock.elapsedTime * 1.4) * 0.03;
        char.armLPiv.rotation.z =  0.06 + idle;
        char.armRPiv.rotation.z = -0.06 - idle;
      } else {
        char.armLPiv.rotation.z = 0;
        char.armRPiv.rotation.z = 0;
      }

      // ── TPS Camera ──────────────────────────────────────────────────────────
      // Orbit around player at (yaw, pitch)
      // Camera position = player + offset in spherical coords
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      tmpCam.set(
        pos.x - sinY * CAM_DIST * cp,
        CAM_LOOK_Y - sp * CAM_DIST,   // negative pitch → cam above player
        pos.z - cosY * CAM_DIST * cp,
      );
      camV.lerp(tmpCam, CAM_LERP);
      camera.position.copy(camV);
      camera.lookAt(pos.x, CAM_LOOK_Y, pos.z);

      renderer.render(scene, camera);
    };

    animate();

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("keydown",           onKeyDown);
      document.removeEventListener("keyup",             onKeyUp);
      document.removeEventListener("mousemove",         onMouseMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      canvas.removeEventListener("click", onCanvasClick);
      if (locked) document.exitPointerLock();
      renderer.dispose();
    };
  }, [handleExit]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />

      {/* Crosshair */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none", width: 20, height: 20,
      }}>
        <div style={{
          position: "absolute", top: "50%", left: 0, right: 0,
          height: 2, marginTop: -1,
          background: "rgba(255,255,255,0.85)",
          boxShadow: "0 0 4px rgba(0,0,0,0.8)",
        }} />
        <div style={{
          position: "absolute", left: "50%", top: 0, bottom: 0,
          width: 2, marginLeft: -1,
          background: "rgba(255,255,255,0.85)",
          boxShadow: "0 0 4px rgba(0,0,0,0.8)",
        }} />
      </div>

      {/* Controls hint */}
      <div style={{
        position: "absolute", bottom: 20, left: "50%",
        transform: "translateX(-50%)",
        color: "rgba(255,255,255,0.8)",
        fontSize: 13, fontFamily: "monospace",
        background: "rgba(0,0,0,0.52)",
        padding: "6px 18px", borderRadius: 6,
        pointerEvents: "none", letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}>
        CLICK → kunci mouse &nbsp;|&nbsp; WASD = gerak &nbsp;|&nbsp; SHIFT = sprint &nbsp;|&nbsp; ESC = kembali
      </div>
    </div>
  );
}
