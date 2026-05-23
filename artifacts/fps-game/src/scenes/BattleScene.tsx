import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import type { BattleConfig } from "../game/battleTypes";

interface Props {
  config: BattleConfig;
  onEnd: (won: boolean, kills: number) => void;
}

// ─── Joystick constants ───────────────────────────────────────────────────────
const JOY_BASE_R  = 65;   // base circle radius (px)
const JOY_THUMB_R = 27;   // thumb circle radius (px)
const JOY_MAX_OFF = 48;   // max thumb displacement (px)
const CAM_SENS    = 0.006; // camera swipe sensitivity (rad/px)

// ─── Helper: colored Box mesh ─────────────────────────────────────────────────
function makeBox(
  w: number, h: number, d: number,
  color: number,
  x: number, y: number, z: number,
  castShadow = true,
): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color }),
  );
  m.position.set(x, y, z);
  m.castShadow = castShadow;
  m.receiveShadow = true;
  return m;
}

// ─── Blocky humanoid (Roblox / Minecraft style) ───────────────────────────────
interface BlockChar {
  root: THREE.Group;
  armLPiv: THREE.Group; armRPiv: THREE.Group;
  legLPiv: THREE.Group; legRPiv: THREE.Group;
}
function buildBlockChar(
  skinColor = 0xffcc99,
  bodyColor = 0x1155cc,
  legColor  = 0x1a1a44,
): BlockChar {
  const root = new THREE.Group();
  root.add(makeBox(0.80, 0.80, 0.80, skinColor, 0, 2.40, 0));
  root.add(makeBox(0.16, 0.16, 0.02, 0x111111, -0.17, 2.46,  0.41, false));
  root.add(makeBox(0.16, 0.16, 0.02, 0x111111,  0.17, 2.46,  0.41, false));
  root.add(makeBox(0.22, 0.06, 0.02, 0x884422,  0.00, 2.22,  0.41, false));
  root.add(makeBox(1.00, 1.00, 0.50, bodyColor, 0, 1.50, 0));

  const armLPiv = new THREE.Group(); armLPiv.position.set(-0.675, 2.00, 0);
  armLPiv.add(makeBox(0.35, 1.00, 0.35, bodyColor, 0, -0.50, 0)); root.add(armLPiv);
  const armRPiv = new THREE.Group(); armRPiv.position.set( 0.675, 2.00, 0);
  armRPiv.add(makeBox(0.35, 1.00, 0.35, bodyColor, 0, -0.50, 0)); root.add(armRPiv);
  const legLPiv = new THREE.Group(); legLPiv.position.set(-0.18, 1.00, 0);
  legLPiv.add(makeBox(0.35, 1.00, 0.35, legColor, 0, -0.50, 0)); root.add(legLPiv);
  const legRPiv = new THREE.Group(); legRPiv.position.set( 0.18, 1.00, 0);
  legRPiv.add(makeBox(0.35, 1.00, 0.35, legColor, 0, -0.50, 0)); root.add(legRPiv);

  return { root, armLPiv, armRPiv, legLPiv, legRPiv };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function BattleScene({ onEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mobile input refs (shared with Three.js loop – no re-render needed)
  const joyState = useRef({ x: 0, y: 0 });        // normalized -1..1
  const camDelta = useRef({ yaw: 0, pitch: 0 });   // accumulated touch delta

  // Joystick visual (needs re-render for thumb position)
  const [joyVis, setJoyVis] = useState({ x: 0, y: 0 });

  const handleExit = useCallback(() => onEnd(false, 0), [onEnd]);

  // ── Joystick touch handlers ───────────────────────────────────────────────
  const joyId   = useRef(-1);
  const joyCentre = useRef({ x: 0, y: 0 });

  const onJoyStart = useCallback((e: React.TouchEvent) => {
    if (joyId.current !== -1) return;
    const t = e.changedTouches[0];
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    joyId.current = t.identifier;
    joyCentre.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, []);

  const onJoyMove = useCallback((e: React.TouchEvent) => {
    const t = Array.from(e.changedTouches).find(c => c.identifier === joyId.current);
    if (!t) return;
    let dx = t.clientX - joyCentre.current.x;
    let dy = t.clientY - joyCentre.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > JOY_MAX_OFF) { dx = dx / dist * JOY_MAX_OFF; dy = dy / dist * JOY_MAX_OFF; }
    setJoyVis({ x: dx, y: dy });
    joyState.current = { x: dx / JOY_MAX_OFF, y: dy / JOY_MAX_OFF };
  }, []);

  const onJoyEnd = useCallback((e: React.TouchEvent) => {
    if (!Array.from(e.changedTouches).find(c => c.identifier === joyId.current)) return;
    joyId.current = -1;
    setJoyVis({ x: 0, y: 0 });
    joyState.current = { x: 0, y: 0 };
  }, []);

  // ── Camera swipe handlers ─────────────────────────────────────────────────
  const camId   = useRef(-1);
  const camLast = useRef({ x: 0, y: 0 });

  const onCamStart = useCallback((e: React.TouchEvent) => {
    if (camId.current !== -1) return;
    const t = e.changedTouches[0];
    camId.current = t.identifier;
    camLast.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onCamMove = useCallback((e: React.TouchEvent) => {
    const t = Array.from(e.changedTouches).find(c => c.identifier === camId.current);
    if (!t) return;
    camDelta.current.yaw   -= (t.clientX - camLast.current.x) * CAM_SENS;
    camDelta.current.pitch -= (t.clientY - camLast.current.y) * CAM_SENS;
    camLast.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onCamEnd = useCallback((e: React.TouchEvent) => {
    if (Array.from(e.changedTouches).find(c => c.identifier === camId.current))
      camId.current = -1;
  }, []);

  // ── Three.js scene ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace  = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog        = new THREE.FogExp2(0x87ceeb, 0.007);

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 600);

    const sun = new THREE.DirectionalLight(0xfff4d0, 2.2);
    sun.position.set(50, 90, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 300;
    const sc = 120;
    sun.shadow.camera.left = -sc; sun.shadow.camera.right  =  sc;
    sun.shadow.camera.top  =  sc; sun.shadow.camera.bottom = -sc;
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x8899bb, 0.9));
    const fill = new THREE.DirectionalLight(0xaaccff, 0.4);
    fill.position.set(-30, 20, -30); scene.add(fill);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshLambertMaterial({ color: 0x5a9c3a }),
    );
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(600, 60, 0x000000, 0x000000);
    (grid.material as THREE.LineBasicMaterial).opacity     = 0.05;
    (grid.material as THREE.LineBasicMaterial).transparent = true;
    scene.add(grid);

    const char = buildBlockChar();
    scene.add(char.root);

    // ── State ────────────────────────────────────────────────────────────────
    const pos   = new THREE.Vector3(0, 0, 0);
    const camV  = new THREE.Vector3();
    let yaw     = 0;
    let pitch   = -0.38;
    let walkPhase = 0;
    let locked  = false;

    const SPEED      = 8.0;
    const SPRINT_MUL = 1.65;
    const CAM_DIST   = 5.5;
    // CAM_LOOK_Y raised above head so crosshair sits above character
    const CAM_LOOK_Y = 3.5;
    const CAM_LERP   = 0.16;
    const PITCH_MIN  = -1.15;
    const PITCH_MAX  =  0.25;
    const MOUSE_SENS = 0.003;

    // ── Keyboard input ───────────────────────────────────────────────────────
    const keys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      if (["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))
        e.preventDefault();
      keys.add(e.code);
      if (e.code === "Escape") { if (locked) document.exitPointerLock(); handleExit(); }
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup",   onKeyUp);

    // Pointer lock (desktop)
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

    // ── Resize ───────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    });
    ro.observe(canvas);
    {
      const w = canvas.clientWidth  || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    camV.set(0, CAM_LOOK_Y - Math.sin(pitch) * CAM_DIST, -CAM_DIST * Math.cos(pitch));

    // ── Render loop ──────────────────────────────────────────────────────────
    const clock  = new THREE.Clock();
    const tmpCam = new THREE.Vector3();
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);

      // Consume touch camera delta
      yaw   += camDelta.current.yaw;
      pitch += camDelta.current.pitch;
      camDelta.current.yaw = 0; camDelta.current.pitch = 0;
      pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch));

      // ── Movement (keyboard + joystick) ───────────────────────────────────
      let fwd = 0, rgt = 0;
      if (keys.has("KeyW") || keys.has("ArrowUp"))    fwd =  1;
      if (keys.has("KeyS") || keys.has("ArrowDown"))  fwd = -1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) rgt =  1;
      if (keys.has("KeyA") || keys.has("ArrowLeft"))  rgt = -1;

      // Joystick takes over if active
      const jx = joyState.current.x, jy = joyState.current.y;
      if (jx * jx + jy * jy > 0.01) { fwd = -jy; rgt = jx; }

      const sprint   = keys.has("ShiftLeft") || keys.has("ShiftRight");
      const len      = Math.sqrt(fwd * fwd + rgt * rgt);
      const isMoving = len > 0.05;
      const sinY = Math.sin(yaw), cosY = Math.cos(yaw);

      if (isMoving) {
        // Analog speed (partial joystick = slower)
        const spd = SPEED * (sprint ? SPRINT_MUL : 1.0) * Math.min(1, len);
        const nx  = (sinY * fwd + cosY * rgt) / len;
        const nz  = (cosY * fwd - sinY * rgt) / len;
        pos.x += nx * spd * dt;
        pos.z += nz * spd * dt;
        char.root.rotation.y = Math.atan2(nx, nz);
        walkPhase += dt * (sprint ? 12 : 8) * Math.min(1, len);
      } else {
        char.root.rotation.y = yaw;
        walkPhase = 0;
      }

      char.root.position.set(pos.x, 0, pos.z);

      // ── Walk animation ───────────────────────────────────────────────────
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
        char.armLPiv.rotation.z = 0; char.armRPiv.rotation.z = 0;
      }

      // ── TPS Camera ───────────────────────────────────────────────────────
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      tmpCam.set(
        pos.x - sinY * CAM_DIST * cp,
        CAM_LOOK_Y - sp * CAM_DIST,
        pos.z - cosY * CAM_DIST * cp,
      );
      camV.lerp(tmpCam, CAM_LERP);
      camera.position.copy(camV);
      camera.lookAt(pos.x, CAM_LOOK_Y, pos.z);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup",   onKeyUp);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      canvas.removeEventListener("click", onCanvasClick);
      if (locked) document.exitPointerLock();
      renderer.dispose();
    };
  }, [handleExit, joyState, camDelta]);

  const joyAtCenter = joyVis.x === 0 && joyVis.y === 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

      {/* ── Crosshair (screen center = above character head) ── */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none", width: 24, height: 24,
      }}>
        <div style={{
          position: "absolute", top: "50%", left: 0, right: 0,
          height: 2, marginTop: -1,
          background: "rgba(255,255,255,0.9)",
          boxShadow: "0 0 4px rgba(0,0,0,0.9)",
        }} />
        <div style={{
          position: "absolute", left: "50%", top: 0, bottom: 0,
          width: 2, marginLeft: -1,
          background: "rgba(255,255,255,0.9)",
          boxShadow: "0 0 4px rgba(0,0,0,0.9)",
        }} />
      </div>

      {/* ── Left: Virtual Joystick ── */}
      <div
        style={{
          position: "absolute",
          bottom: 48, left: 48,
          width:  JOY_BASE_R * 2,
          height: JOY_BASE_R * 2,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.10)",
          border: "2px solid rgba(255,255,255,0.30)",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onTouchStart={onJoyStart}
        onTouchMove={onJoyMove}
        onTouchEnd={onJoyEnd}
        onTouchCancel={onJoyEnd}
      >
        {/* Thumb */}
        <div style={{
          position: "absolute",
          top:  "50%", left: "50%",
          transform: `translate(calc(-50% + ${joyVis.x}px), calc(-50% + ${joyVis.y}px))`,
          width:  JOY_THUMB_R * 2, height: JOY_THUMB_R * 2,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.50)",
          border: "2px solid rgba(255,255,255,0.70)",
          transition: joyAtCenter ? "transform 0.14s ease-out" : "none",
          pointerEvents: "none",
        }} />
      </div>

      {/* ── Right: Camera swipe area (invisible) ── */}
      <div
        style={{
          position: "absolute",
          top: 0, right: 0,
          width: "55%", height: "100%",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onTouchStart={onCamStart}
        onTouchMove={onCamMove}
        onTouchEnd={onCamEnd}
        onTouchCancel={onCamEnd}
      />
    </div>
  );
}
