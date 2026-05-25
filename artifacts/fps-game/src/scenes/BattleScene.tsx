import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import type { BattleConfig } from "../game/battleTypes";

interface Props { config: BattleConfig; onEnd: (won: boolean, kills: number) => void; }
type WeaponKind = "ar" | "pistol";

// ─── Weapon specs ──────────────────────────────────────────────────────────────
const WEAPON_SPECS: Record<WeaponKind, { ammo: number; rate: number; auto: boolean; label: string }> = {
  ar:     { ammo: 30, rate: 0.10, auto: true,  label: "AR" },
  pistol: { ammo: 15, rate: 0.35, auto: false, label: "PISTOL" },
};

// ─── Mobile constants ──────────────────────────────────────────────────────────
const JOY_BASE_R  = 65;
const JOY_MAX_OFF = 48;
const JOY_THUMB_R = 27;
const CAM_SENS    = 0.006;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function box(
  w: number, h: number, d: number, color: number,
  x: number, y: number, z: number, shadow = true,
): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color }),
  );
  m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true;
  return m;
}

// ─── Blocky character ──────────────────────────────────────────────────────────
interface BlockChar {
  root: THREE.Group;
  armLPiv: THREE.Group; armRPiv: THREE.Group;
  legLPiv: THREE.Group; legRPiv: THREE.Group;
}
function buildChar(skin = 0xffcc99, body = 0x1155cc, leg = 0x1a1a44): BlockChar {
  const root = new THREE.Group();
  root.add(box(0.80, 0.80, 0.80, skin, 0, 2.40, 0));
  root.add(box(0.16, 0.16, 0.02, 0x111111, -0.17, 2.46,  0.41, false));
  root.add(box(0.16, 0.16, 0.02, 0x111111,  0.17, 2.46,  0.41, false));
  root.add(box(0.22, 0.06, 0.02, 0x884422,  0.00, 2.22,  0.41, false));
  root.add(box(1.00, 1.00, 0.50, body, 0, 1.50, 0));
  const armLPiv = new THREE.Group(); armLPiv.position.set(-0.675, 2.00, 0);
  armLPiv.add(box(0.35, 1.00, 0.35, body, 0, -0.50, 0)); root.add(armLPiv);
  const armRPiv = new THREE.Group(); armRPiv.position.set( 0.675, 2.00, 0);
  armRPiv.add(box(0.35, 1.00, 0.35, body, 0, -0.50, 0)); root.add(armRPiv);
  const legLPiv = new THREE.Group(); legLPiv.position.set(-0.18, 1.00, 0);
  legLPiv.add(box(0.35, 1.00, 0.35, leg, 0, -0.50, 0)); root.add(legLPiv);
  const legRPiv = new THREE.Group(); legRPiv.position.set( 0.18, 1.00, 0);
  legRPiv.add(box(0.35, 1.00, 0.35, leg, 0, -0.50, 0)); root.add(legRPiv);
  return { root, armLPiv, armRPiv, legLPiv, legRPiv };
}

// ─── Blocky weapons ────────────────────────────────────────────────────────────
// Origin = pistol-grip / hold point; barrel points +Z
interface WeaponBuild { group: THREE.Group; muzzle: THREE.Vector3 }

function buildAR(): WeaponBuild {
  const g = new THREE.Group();
  const B = 0x282828, D = 0x141414, T = 0x6e5c38;
  g.add(box(0.16, 0.16, 1.20, B,  0.00,  0.10,  0.55)); // receiver
  g.add(box(0.06, 0.06, 0.62, D,  0.00,  0.13,  1.46)); // barrel
  g.add(box(0.13, 0.13, 0.50, B,  0.00,  0.10,  0.98)); // handguard
  g.add(box(0.09, 0.26, 0.09, D,  0.01, -0.18,  0.10)); // pistol grip
  g.add(box(0.09, 0.40, 0.06, D,  0.00, -0.28,  0.38)); // magazine
  g.add(box(0.11, 0.11, 0.38, B,  0.00,  0.08, -0.23)); // stock
  g.add(box(0.09, 0.06, 0.52, T,  0.00,  0.20,  0.44)); // carry handle
  return { group: g, muzzle: new THREE.Vector3(0, 0.13, 1.77) };
}

function buildPistol(): WeaponBuild {
  const g = new THREE.Group();
  const B = 0x282828, D = 0x141414;
  g.add(box(0.11, 0.13, 0.44, B,  0.00,  0.04,  0.22)); // slide
  g.add(box(0.06, 0.06, 0.24, D,  0.00,  0.06,  0.52)); // barrel
  g.add(box(0.09, 0.28, 0.08, D,  0.01, -0.16,  0.04)); // grip
  g.add(box(0.08, 0.20, 0.05, D,  0.00, -0.13,  0.05)); // magazine
  return { group: g, muzzle: new THREE.Vector3(0, 0.06, 0.64) };
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function BattleScene({ onEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mobile input (no re-render needed)
  const joyState = useRef({ x: 0, y: 0 });
  const camDelta = useRef({ yaw: 0, pitch: 0 });
  const fireHeld = useRef(false);

  // HUD state
  const [joyVis, setJoyVis]     = useState({ x: 0, y: 0 });
  const [ammo, setAmmo]         = useState(WEAPON_SPECS.ar.ammo);
  const [ammoMax]               = useState(WEAPON_SPECS.ar.ammo);
  const [reloading, setReloading] = useState(false);

  // Refs shared with game loop
  const ammoRef     = useRef(WEAPON_SPECS.ar.ammo);
  const reloadRef   = useRef(false);

  const handleExit = useCallback(() => onEnd(false, 0), [onEnd]);

  // ── Joystick handlers ───────────────────────────────────────────────────────
  const joyId  = useRef(-1);
  const joyCtr = useRef({ x: 0, y: 0 });

  const onJoyStart = useCallback((e: React.TouchEvent) => {
    if (joyId.current !== -1) return;
    const t = e.changedTouches[0];
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    joyId.current = t.identifier;
    joyCtr.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, []);

  const onJoyMove = useCallback((e: React.TouchEvent) => {
    const t = Array.from(e.changedTouches).find(c => c.identifier === joyId.current);
    if (!t) return;
    let dx = t.clientX - joyCtr.current.x;
    let dy = t.clientY - joyCtr.current.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > JOY_MAX_OFF) { dx = dx / d * JOY_MAX_OFF; dy = dy / d * JOY_MAX_OFF; }
    setJoyVis({ x: dx, y: dy });
    joyState.current = { x: dx / JOY_MAX_OFF, y: dy / JOY_MAX_OFF };
  }, []);

  const onJoyEnd = useCallback((e: React.TouchEvent) => {
    if (!Array.from(e.changedTouches).find(c => c.identifier === joyId.current)) return;
    joyId.current = -1; setJoyVis({ x: 0, y: 0 }); joyState.current = { x: 0, y: 0 };
  }, []);

  // ── Camera swipe handlers ───────────────────────────────────────────────────
  const camId   = useRef(-1);
  const camLast = useRef({ x: 0, y: 0 });

  const onCamStart = useCallback((e: React.TouchEvent) => {
    if (camId.current !== -1) return;
    const t = e.changedTouches[0];
    camId.current = t.identifier; camLast.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onCamMove = useCallback((e: React.TouchEvent) => {
    const t = Array.from(e.changedTouches).find(c => c.identifier === camId.current);
    if (!t) return;
    camDelta.current.yaw   -= (t.clientX - camLast.current.x) * CAM_SENS;
    camDelta.current.pitch -= (t.clientY - camLast.current.y) * CAM_SENS;
    camLast.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onCamEnd = useCallback((e: React.TouchEvent) => {
    if (Array.from(e.changedTouches).find(c => c.identifier === camId.current)) camId.current = -1;
  }, []);

  // ── Fire button handlers ────────────────────────────────────────────────────
  const fireId = useRef(-1);
  const onFireStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (fireId.current !== -1) return;
    fireId.current = e.changedTouches[0].identifier;
    fireHeld.current = true;
  }, []);
  const onFireEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (!Array.from(e.changedTouches).find(c => c.identifier === fireId.current)) return;
    fireId.current = -1; fireHeld.current = false;
  }, []);

  // ── Reload handler ──────────────────────────────────────────────────────────
  const onReload = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (reloadRef.current || ammoRef.current >= WEAPON_SPECS.ar.ammo) return;
    reloadRef.current = true; setReloading(true);
  }, []);

  // ── Three.js scene ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;

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
    sun.position.set(50, 90, 40); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = 120;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 300;
    sun.shadow.camera.left = -sc; sun.shadow.camera.right  =  sc;
    sun.shadow.camera.top  =  sc; sun.shadow.camera.bottom = -sc;
    scene.add(sun, new THREE.AmbientLight(0x8899bb, 0.9));
    const fill = new THREE.DirectionalLight(0xaaccff, 0.4);
    fill.position.set(-30, 20, -30); scene.add(fill);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshLambertMaterial({ color: 0x5a9c3a }),
    );
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(600, 60, 0x000000, 0x000000);
    (grid.material as THREE.LineBasicMaterial).opacity = 0.05;
    (grid.material as THREE.LineBasicMaterial).transparent = true;
    scene.add(grid);

    // Character
    const char = buildChar();
    scene.add(char.root);

    // Weapon on right hand
    const { group: weaponGrp, muzzle: muzzleLocal } = buildAR();
    const handR = new THREE.Group();
    handR.position.set(0, -1.0, 0);      // wrist = bottom of arm
    weaponGrp.position.set(0.06, 0.05, 0.08);
    handR.add(weaponGrp);
    char.armRPiv.add(handR);

    // Muzzle flash light
    const flashLight = new THREE.PointLight(0xff8800, 0, 6);
    scene.add(flashLight);

    // Bullet pool
    const bulletGeo = new THREE.SphereGeometry(0.04, 4, 4);
    const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffee44 });
    type Bullet = { mesh: THREE.Mesh; vel: THREE.Vector3; life: number };
    const bullets: Bullet[] = [];

    // ── State ──────────────────────────────────────────────────────────────────
    const pos  = new THREE.Vector3(0, 0, 0);
    const camV = new THREE.Vector3();
    let yaw = 0, pitch = -0.38, walkPhase = 0, locked = false;

    const SPEED = 8.0, SPRINT_MUL = 1.65;
    const CAM_DIST = 5.5, CAM_LOOK_Y = 3.5;
    const CAM_LERP = 0.16;
    const PITCH_MIN = -1.15, PITCH_MAX = 0.25;
    const MOUSE_SENS = 0.003;

    // Weapon anim state
    const sAnim = { t: 0, active: false };           // shoot recoil
    const rAnim = { t: 0, active: false, done: false }; // reload
    let fireCd = 0;

    ammoRef.current = WEAPON_SPECS.ar.ammo;

    // ── Keyboard ──────────────────────────────────────────────────────────────
    const keys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      if (["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) e.preventDefault();
      keys.add(e.code);
      if (e.code === "Escape") { if (locked) document.exitPointerLock(); handleExit(); }
      if (e.code === "KeyR") { if (!reloadRef.current && ammoRef.current < WEAPON_SPECS.ar.ammo) { reloadRef.current = true; setReloading(true); } }
      if (e.code === "KeyF") fireHeld.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.code);
      if (e.code === "KeyF") fireHeld.current = false;
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup",   onKeyUp);

    // Pointer-lock (desktop)
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
      camera.aspect = w / h; camera.updateProjectionMatrix();
    });
    ro.observe(canvas);
    {
      const w = canvas.clientWidth  || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    camV.set(0, CAM_LOOK_Y - Math.sin(pitch) * CAM_DIST, -CAM_DIST * Math.cos(pitch));

    // ── Render loop ──────────────────────────────────────────────────────────
    const clock  = new THREE.Clock();
    const tmpCam = new THREE.Vector3();
    const muzzleW = new THREE.Vector3();
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);

      // Touch camera
      yaw   += camDelta.current.yaw;
      pitch += camDelta.current.pitch;
      camDelta.current.yaw = 0; camDelta.current.pitch = 0;
      pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch));

      // ── Movement ────────────────────────────────────────────────────────────
      let fwd = 0, rgt = 0;
      if (keys.has("KeyW") || keys.has("ArrowUp"))    fwd =  1;
      if (keys.has("KeyS") || keys.has("ArrowDown"))  fwd = -1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) rgt =  1;
      if (keys.has("KeyA") || keys.has("ArrowLeft"))  rgt = -1;

      // Joystick (FIX: negate X so right-stick → move right)
      const jx = joyState.current.x, jy = joyState.current.y;
      if (jx * jx + jy * jy > 0.01) { fwd = -jy; rgt = -jx; }

      const sprint = keys.has("ShiftLeft") || keys.has("ShiftRight");
      const len    = Math.sqrt(fwd * fwd + rgt * rgt);
      const isMoving = len > 0.05;
      const sinY = Math.sin(yaw), cosY = Math.cos(yaw);

      if (isMoving) {
        const spd = SPEED * (sprint ? SPRINT_MUL : 1.0) * Math.min(1, len);
        const nx  = (sinY * fwd + cosY * rgt) / len;
        const nz  = (cosY * fwd - sinY * rgt) / len;
        pos.x += nx * spd * dt; pos.z += nz * spd * dt;
        char.root.rotation.y = Math.atan2(nx, nz);
        walkPhase += dt * (sprint ? 12 : 8) * Math.min(1, len);
      } else {
        char.root.rotation.y = yaw; walkPhase = 0;
      }
      char.root.position.set(pos.x, 0, pos.z);

      // ── Firing ──────────────────────────────────────────────────────────────
      fireCd = Math.max(0, fireCd - dt);
      const canFire = fireHeld.current && !reloadRef.current && fireCd <= 0 && ammoRef.current > 0;

      if (canFire) {
        const spec = WEAPON_SPECS.ar;
        ammoRef.current--;
        setAmmo(ammoRef.current);
        fireCd = spec.rate;
        if (!spec.auto) fireHeld.current = false;

        // Bullet spawn at muzzle world position
        muzzleW.copy(muzzleLocal);
        weaponGrp.localToWorld(muzzleW);
        const bMesh = new THREE.Mesh(bulletGeo, bulletMat);
        bMesh.position.copy(muzzleW);
        // Shoot in yaw+slight pitch direction
        const bVel = new THREE.Vector3(
          -sinY * Math.cos(pitch * 0.3),
          Math.sin(-pitch * 0.3),
          -cosY * Math.cos(pitch * 0.3),
        ).multiplyScalar(120);
        scene.add(bMesh);
        bullets.push({ mesh: bMesh, vel: bVel, life: 1.2 });

        // Muzzle flash
        flashLight.position.copy(muzzleW);
        flashLight.intensity = 6;

        // Shoot recoil anim
        sAnim.active = true; sAnim.t = 0;

        // Auto-reload
        if (ammoRef.current === 0) { reloadRef.current = true; setReloading(true); }
      }

      // Decay muzzle flash
      if (flashLight.intensity > 0) flashLight.intensity = Math.max(0, flashLight.intensity - dt * 40);

      // ── Reload anim trigger ────────────────────────────────────────────────
      if (reloadRef.current && !rAnim.active) {
        rAnim.active = true; rAnim.t = 0; rAnim.done = false;
      }

      // ── Update anims ────────────────────────────────────────────────────────
      if (sAnim.active) {
        sAnim.t = Math.min(1, sAnim.t + dt / 0.18);
        if (sAnim.t >= 1) { sAnim.active = false; sAnim.t = 0; }
      }
      if (rAnim.active) {
        rAnim.t = Math.min(1, rAnim.t + dt / 1.5);
        if (!rAnim.done && rAnim.t > 0.45) {
          ammoRef.current = WEAPON_SPECS.ar.ammo;
          setAmmo(ammoRef.current);
          rAnim.done = true;
        }
        if (rAnim.t >= 1) {
          rAnim.active = false; rAnim.t = 0;
          reloadRef.current = false; setReloading(false);
        }
      }

      // ── Update bullets ─────────────────────────────────────────────────────
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.life -= dt;
        b.mesh.position.addScaledVector(b.vel, dt);
        if (b.life <= 0 || b.mesh.position.y < -1) {
          scene.remove(b.mesh);
          bullets.splice(i, 1);
        }
      }

      // ── Arm animation ───────────────────────────────────────────────────────
      // Arm base angles for AR 2-handed grip
      const ARM_R_IDLE = -0.38;   // right arm forward (pistol grip)
      const ARM_L_IDLE = -0.72;   // left arm forward (foregrip)
      const ARM_R_Z    = -0.06;   // slight inward
      const ARM_L_Z    =  0.06;

      // Shoot recoil on right arm
      let recoil = 0;
      if (sAnim.active) {
        const st = sAnim.t;
        recoil = st < 0.2 ? (st / 0.2) * 0.28 : (1 - (st - 0.2) / 0.8) * 0.28;
      }

      // Reload drop
      let reloadDrop = 0;
      if (rAnim.active) {
        const rt = rAnim.t;
        if      (rt < 0.3) reloadDrop = rt / 0.3 * 1.1;
        else if (rt < 0.7) reloadDrop = 1.1;
        else               reloadDrop = (1 - (rt - 0.7) / 0.3) * 1.1;
      }

      char.armRPiv.rotation.z = ARM_R_Z;
      char.armLPiv.rotation.z = ARM_L_Z;

      if (rAnim.active) {
        // Reload: both arms drop
        char.armRPiv.rotation.x = ARM_R_IDLE + reloadDrop;
        char.armLPiv.rotation.x = ARM_L_IDLE + reloadDrop * 0.6;
        const rIdleSwing = Math.sin(clock.elapsedTime * 1.4) * 0.02;
        char.legLPiv.rotation.x = rIdleSwing;
        char.legRPiv.rotation.x = -rIdleSwing;
      } else if (isMoving) {
        const swing = Math.sin(walkPhase) * (sprint ? 0.50 : 0.38);
        char.armRPiv.rotation.x = ARM_R_IDLE + swing * 0.4 + recoil;
        char.armLPiv.rotation.x = ARM_L_IDLE - swing * 0.4;
        char.legLPiv.rotation.x = -swing;
        char.legRPiv.rotation.x =  swing;
      } else {
        const idleS = Math.sin(clock.elapsedTime * 1.4) * 0.03;
        char.armRPiv.rotation.x = ARM_R_IDLE + idleS * 0.3 + recoil;
        char.armLPiv.rotation.x = ARM_L_IDLE + idleS * 0.2;
        char.legLPiv.rotation.x =  idleS * 0.15;
        char.legRPiv.rotation.x = -idleS * 0.15;
      }

      // ── TPS Camera ──────────────────────────────────────────────────────────
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
      bulletGeo.dispose(); bulletMat.dispose();
      renderer.dispose();
    };
  }, [handleExit, joyState, camDelta, fireHeld, ammoRef, reloadRef]);

  const joyAtCenter = joyVis.x === 0 && joyVis.y === 0;
  const ammoLow = ammo <= Math.floor(ammoMax * 0.25);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

      {/* ── Crosshair ─────────────────────────────────────────────────────── */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none", width: 24, height: 24 }}>
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, marginTop: -1, background: "rgba(255,255,255,0.9)", boxShadow: "0 0 4px #000c" }} />
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, marginLeft: -1, background: "rgba(255,255,255,0.9)", boxShadow: "0 0 4px #000c" }} />
      </div>

      {/* ── Left: Virtual Joystick ────────────────────────────────────────── */}
      <div
        style={{ position: "absolute", bottom: 48, left: 48, width: JOY_BASE_R * 2, height: JOY_BASE_R * 2, borderRadius: "50%", background: "rgba(255,255,255,0.10)", border: "2px solid rgba(255,255,255,0.30)", touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
        onTouchStart={onJoyStart} onTouchMove={onJoyMove} onTouchEnd={onJoyEnd} onTouchCancel={onJoyEnd}
      >
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(calc(-50% + ${joyVis.x}px), calc(-50% + ${joyVis.y}px))`, width: JOY_THUMB_R * 2, height: JOY_THUMB_R * 2, borderRadius: "50%", background: "rgba(255,255,255,0.50)", border: "2px solid rgba(255,255,255,0.70)", transition: joyAtCenter ? "transform 0.14s ease-out" : "none", pointerEvents: "none" }} />
      </div>

      {/* ── Right: Camera swipe area ──────────────────────────────────────── */}
      <div
        style={{ position: "absolute", top: 0, right: 0, width: "55%", height: "60%", touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
        onTouchStart={onCamStart} onTouchMove={onCamMove} onTouchEnd={onCamEnd} onTouchCancel={onCamEnd}
      />

      {/* ── Ammo display ──────────────────────────────────────────────────── */}
      <div style={{ position: "absolute", bottom: 195, right: 52, pointerEvents: "none", textAlign: "right" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 2, marginBottom: 2 }}>AR</div>
        <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "monospace", color: ammoLow ? "#ff4444" : "#fff", textShadow: "0 2px 8px #000a", lineHeight: 1 }}>
          {String(ammo).padStart(2, "0")}
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginLeft: 3 }}>/{ammoMax}</span>
        </div>
        {reloading && (
          <div style={{ fontSize: 11, fontWeight: 700, color: "#ffbb00", letterSpacing: 1, marginTop: 2 }}>RELOADING…</div>
        )}
      </div>

      {/* ── Reload button ─────────────────────────────────────────────────── */}
      <div
        onTouchStart={onReload} onTouchEnd={e => e.stopPropagation()}
        style={{
          position: "absolute", bottom: 135, right: 62,
          width: 64, height: 64, borderRadius: "50%",
          background: reloading ? "rgba(255,187,0,0.30)" : "rgba(255,255,255,0.18)",
          border: `2px solid ${reloading ? "rgba(255,187,0,0.7)" : "rgba(255,255,255,0.45)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          touchAction: "none", userSelect: "none", WebkitUserSelect: "none",
          opacity: reloading ? 0.5 : 1,
        }}
      >
        <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>RELOAD</span>
      </div>

      {/* ── Fire button ───────────────────────────────────────────────────── */}
      <div
        onTouchStart={onFireStart} onTouchEnd={onFireEnd} onTouchCancel={onFireEnd}
        style={{
          position: "absolute", bottom: 48, right: 48,
          width: 90, height: 90, borderRadius: "50%",
          background: "rgba(255,60,60,0.30)",
          border: "3px solid rgba(255,80,80,0.70)",
          display: "flex", alignItems: "center", justifyContent: "center",
          touchAction: "none", userSelect: "none", WebkitUserSelect: "none",
          boxShadow: "0 0 18px rgba(255,60,60,0.25)",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>FIRE</span>
      </div>
    </div>
  );
}
