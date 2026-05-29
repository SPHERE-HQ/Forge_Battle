import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import type { BattleConfig } from "../game/battleTypes";

interface Props { config: BattleConfig; onEnd: (won: boolean, kills: number) => void; }

const JOY_BASE_R  = 65;
const JOY_MAX_OFF = 48;
const JOY_THUMB_R = 27;
const CAM_SENS    = 0.006;
const AR_AMMO     = 30;
const AR_RATE     = 0.10;

// ── Box mesh helper ────────────────────────────────────────────────────────────
function bx(
  w: number, h: number, d: number, color: number,
  x: number, y: number, z: number,
): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color }),
  );
  m.position.set(x, y, z);
  m.castShadow  = true;
  m.receiveShadow = true;
  return m;
}

// ── Jointed character ─────────────────────────────────────────────────────────
interface BlockChar {
  root:      THREE.Group;
  armLPiv:   THREE.Group; elbowLPiv: THREE.Group;
  armRPiv:   THREE.Group; elbowRPiv: THREE.Group;
  legLPiv:   THREE.Group; kneeLPiv:  THREE.Group;
  legRPiv:   THREE.Group; kneeRPiv:  THREE.Group;
}

function buildChar(skin = 0xffcc99, body = 0x1a5dc8, leg = 0x1a1a44): BlockChar {
  const root = new THREE.Group();

  root.add(bx(0.80, 0.80, 0.80, skin,     0,    2.40,  0));
  root.add(bx(0.16, 0.14, 0.03, 0x111111, -0.17, 2.46, 0.41));
  root.add(bx(0.16, 0.14, 0.03, 0x111111,  0.17, 2.46, 0.41));
  root.add(bx(0.22, 0.06, 0.03, 0x884422,  0,    2.22, 0.41));
  root.add(bx(1.00, 1.00, 0.50, body,      0,    1.50, 0));

  const armLPiv = new THREE.Group();
  armLPiv.position.set(-0.675, 2.00, 0);
  armLPiv.add(bx(0.35, 0.50, 0.35, body, 0, -0.25, 0));
  const elbowLPiv = new THREE.Group();
  elbowLPiv.position.set(0, -0.50, 0);
  elbowLPiv.add(bx(0.32, 0.50, 0.32, skin, 0, -0.25, 0));
  armLPiv.add(elbowLPiv);
  root.add(armLPiv);

  const armRPiv = new THREE.Group();
  armRPiv.position.set(0.675, 2.00, 0);
  armRPiv.add(bx(0.35, 0.50, 0.35, body, 0, -0.25, 0));
  const elbowRPiv = new THREE.Group();
  elbowRPiv.position.set(0, -0.50, 0);
  elbowRPiv.add(bx(0.32, 0.50, 0.32, skin, 0, -0.25, 0));
  armRPiv.add(elbowRPiv);
  root.add(armRPiv);

  const legLPiv = new THREE.Group();
  legLPiv.position.set(-0.18, 1.00, 0);
  legLPiv.add(bx(0.38, 0.52, 0.38, leg, 0, -0.26, 0));
  const kneeLPiv = new THREE.Group();
  kneeLPiv.position.set(0, -0.52, 0);
  kneeLPiv.add(bx(0.35, 0.54, 0.35, leg, 0, -0.27, 0));
  kneeLPiv.add(bx(0.36, 0.12, 0.46, 0x111111, 0, -0.57, 0.04));
  legLPiv.add(kneeLPiv);
  root.add(legLPiv);

  const legRPiv = new THREE.Group();
  legRPiv.position.set(0.18, 1.00, 0);
  legRPiv.add(bx(0.38, 0.52, 0.38, leg, 0, -0.26, 0));
  const kneeRPiv = new THREE.Group();
  kneeRPiv.position.set(0, -0.52, 0);
  kneeRPiv.add(bx(0.35, 0.54, 0.35, leg, 0, -0.27, 0));
  kneeRPiv.add(bx(0.36, 0.12, 0.46, 0x111111, 0, -0.57, 0.04));
  legRPiv.add(kneeRPiv);
  root.add(legRPiv);

  return { root, armLPiv, elbowLPiv, armRPiv, elbowRPiv, legLPiv, kneeLPiv, legRPiv, kneeRPiv };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BattleScene({ onEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Keep latest callbacks in refs so the effect closure never goes stale ──
  const onEndRef    = useRef(onEnd);
  onEndRef.current  = onEnd;

  const joyState  = useRef({ x: 0, y: 0 });
  const camDelta  = useRef({ yaw: 0, pitch: 0 });
  const fireHeld  = useRef(false);

  const [joyVis,    setJoyVis]    = useState({ x: 0, y: 0 });
  const [ammo,      setAmmo]      = useState(AR_AMMO);
  const [reloading, setReloading] = useState(false);

  const ammoRef   = useRef(AR_AMMO);
  const reloadRef = useRef(false);

  // ── Joystick ──────────────────────────────────────────────────────────────
  const joyId  = useRef(-1);
  const joyCtr = useRef({ x: 0, y: 0 });
  const onJoyStart = useCallback((e: React.TouchEvent) => {
    if (joyId.current !== -1) return;
    const t = e.changedTouches[0];
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    joyId.current  = t.identifier;
    joyCtr.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, []);
  const onJoyMove = useCallback((e: React.TouchEvent) => {
    const t = Array.from(e.changedTouches).find(c => c.identifier === joyId.current);
    if (!t) return;
    let dx = t.clientX - joyCtr.current.x, dy = t.clientY - joyCtr.current.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > JOY_MAX_OFF) { dx = dx / d * JOY_MAX_OFF; dy = dy / d * JOY_MAX_OFF; }
    setJoyVis({ x: dx, y: dy });
    joyState.current = { x: dx / JOY_MAX_OFF, y: dy / JOY_MAX_OFF };
  }, []);
  const onJoyEnd = useCallback((e: React.TouchEvent) => {
    if (!Array.from(e.changedTouches).find(c => c.identifier === joyId.current)) return;
    joyId.current = -1; setJoyVis({ x: 0, y: 0 }); joyState.current = { x: 0, y: 0 };
  }, []);

  // ── Camera swipe ──────────────────────────────────────────────────────────
  const camId   = useRef(-1);
  const camLast = useRef({ x: 0, y: 0 });
  const onCamStart = useCallback((e: React.TouchEvent) => {
    if (camId.current !== -1) return;
    const t = e.changedTouches[0];
    camId.current   = t.identifier;
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
    if (Array.from(e.changedTouches).find(c => c.identifier === camId.current)) camId.current = -1;
  }, []);

  // ── Fire & Reload ─────────────────────────────────────────────────────────
  const fireId = useRef(-1);
  const onFireStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (fireId.current !== -1) return;
    fireId.current   = e.changedTouches[0].identifier;
    fireHeld.current = true;
  }, []);
  const onFireEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (!Array.from(e.changedTouches).find(c => c.identifier === fireId.current)) return;
    fireId.current = -1; fireHeld.current = false;
  }, []);
  const onReload = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (reloadRef.current || ammoRef.current >= AR_AMMO) return;
    reloadRef.current = true; setReloading(true);
  }, []);

  // ── Three.js scene — runs ONCE on mount ───────────────────────────────────
  // Callbacks (joyState, camDelta, fireHeld, ammoRef, reloadRef) are all refs
  // so they don't cause re-runs. onEnd is accessed through onEndRef.
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let disposed = false;

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

    // ── Scene ─────────────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog        = new THREE.FogExp2(0x87ceeb, 0.007);

    // ── Camera ────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 600);

    // ── Resize — must set size before first render ─────────────────────
    const applySize = () => {
      const w = canvas.clientWidth  || window.innerWidth  || 800;
      const h = canvas.clientHeight || window.innerHeight || 600;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    applySize();
    const ro = new ResizeObserver(applySize);
    ro.observe(canvas);
    window.addEventListener("resize", applySize);

    // ── Lights ────────────────────────────────────────────────────────────
    const sun = new THREE.DirectionalLight(0xfff4d0, 2.2);
    sun.position.set(50, 90, 40); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = 120;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 300;
    sun.shadow.camera.left = -sc; sun.shadow.camera.right =  sc;
    sun.shadow.camera.top  =  sc; sun.shadow.camera.bottom = -sc;
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x8899bb, 1.2));
    const fill = new THREE.DirectionalLight(0xaaccff, 0.5);
    fill.position.set(-30, 20, -30); scene.add(fill);

    // ── Ground ────────────────────────────────────────────────────────────
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshLambertMaterial({ color: 0x5a9c3a }),
    );
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    scene.add(ground);
    const grid = new THREE.GridHelper(600, 60, 0x000000, 0x000000);
    (grid.material as THREE.LineBasicMaterial).opacity    = 0.05;
    (grid.material as THREE.LineBasicMaterial).transparent = true;
    scene.add(grid);

    // ── Character ─────────────────────────────────────────────────────────
    const char = buildChar();
    scene.add(char.root);

    // ── Weapon mount (right wrist) ─────────────────────────────────────
    const handR = new THREE.Group();
    handR.position.set(0, -0.50, 0);
    char.elbowRPiv.add(handR);

    const handL = new THREE.Group();
    handL.position.set(0, -0.50, 0);
    char.elbowLPiv.add(handL);

    const flashLight = new THREE.PointLight(0xff8800, 0, 5);
    scene.add(flashLight);

    const muzzleLocal = new THREE.Vector3(0, 0, 1.50);

    import("three/examples/jsm/loaders/GLTFLoader.js").then(({ GLTFLoader }) => {
      if (disposed) return;
      new GLTFLoader().load(
        import.meta.env.BASE_URL + "weapons/ar.glb",
        (gltf) => {
          if (disposed) return;
          const model = gltf.scene;
          const bb = new THREE.Box3().setFromObject(model);
          const sz = new THREE.Vector3(); bb.getSize(sz);
          model.scale.setScalar(1.75 / Math.max(sz.x, sz.y, sz.z));

          // ── Rotation math ───────────────────────────────────────────────
          // GLB barrel is along the model's X axis; muzzle = -X end.
          // handR's local frame (= elbowRPiv): forearm direction is -Y → world +Z.
          // Goal: muzzle → handR -Y (forward), weapon top → handR +Z (up).
          //
          // Three.js Euler XYZ applies Rx·Ry·Rz, so transforms are applied Rz first:
          //   Rz(π/2) maps model -X → [0,-1,0]  (handR -Y = forward) ✓
          //   Ry(π/2) maps model +Y → [0,0,1]   (handR +Z = upward)  ✓
          //   combined: rotation.set(0, π/2, π/2)
          model.rotation.set(0, Math.PI / 2, Math.PI / 2);

          model.updateMatrixWorld(true);
          const bb2 = new THREE.Box3().setFromObject(model);
          const ctr = new THREE.Vector3(); bb2.getCenter(ctr);
          model.position.sub(ctr);           // center model at handR origin
          model.updateMatrixWorld(true);
          const bb3 = new THREE.Box3().setFromObject(model);

          // After rotation the barrel is along handR Y (-Y = muzzle, +Y = stock).
          const len = bb3.max.y - bb3.min.y;
          // Pistol grip is ~62% from muzzle (38% from stock) for AR-style rifle.
          // In centered space: grip Y = len*(0.62 - 0.5) = len*0.12
          // Shift model down so grip sits at handR origin (y=0).
          const gripFrac = 0.62;
          model.position.y -= len * (gripFrac - 0.5);
          handR.add(model);

          // Muzzle in handR local space (slightly inside tip to avoid clipping)
          const muzzleY = bb3.min.y - len * (gripFrac - 0.5) + len * 0.02;
          muzzleLocal.set(0, muzzleY, 0);
        },
      );
    });

    // ── Bullets ───────────────────────────────────────────────────────────
    const bulletGeo = new THREE.SphereGeometry(0.05, 4, 4);
    const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffee44 });
    type Bullet = { mesh: THREE.Mesh; vel: THREE.Vector3; life: number };
    const bullets: Bullet[] = [];

    // ── State ─────────────────────────────────────────────────────────────
    const pos = new THREE.Vector3();
    let yaw    = 0;
    let pitch  = -0.38;
    let walkPh = 0;
    let locked = false;
    let fireCd = 0;

    const SPEED      = 8.0;
    const SPRINT_MUL = 1.65;
    const CAM_DIST   = 5.5;
    const CAM_LOOK_Y = 3.5;
    const CAM_LERP   = 0.16;
    const PITCH_MIN  = -1.15;
    const PITCH_MAX  =  0.25;
    const MOUSE_S    =  0.003;

    // Initial camera position (behind & above character)
    const camV   = new THREE.Vector3(
      0,
      CAM_LOOK_Y - Math.sin(pitch) * CAM_DIST,
      -CAM_DIST  * Math.cos(pitch),
    );
    const tmpCam  = new THREE.Vector3();
    const muzzleW = new THREE.Vector3();

    const sAnim = { t: 0, active: false };
    const rAnim = { t: 0, active: false, done: false };

    // ── Keyboard ──────────────────────────────────────────────────────────
    const keys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      if (["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) e.preventDefault();
      keys.add(e.code);
      if (e.code === "Escape") { if (locked) document.exitPointerLock(); onEndRef.current(false, 0); }
      if (e.code === "KeyR" && !reloadRef.current && ammoRef.current < AR_AMMO) {
        reloadRef.current = true; setReloading(true);
      }
      if (e.code === "KeyF") fireHeld.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.code);
      if (e.code === "KeyF") fireHeld.current = false;
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup",   onKeyUp);

    const onCanvasClick = () => { if (!locked) canvas.requestPointerLock(); };
    canvas.addEventListener("click", onCanvasClick);
    const onMouseMove = (e: MouseEvent) => {
      if (!locked) return;
      yaw   -= e.movementX * MOUSE_S;
      pitch -= e.movementY * MOUSE_S;
      pitch  = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch));
    };
    document.addEventListener("mousemove", onMouseMove);
    const onLockChange = () => { locked = document.pointerLockElement === canvas; };
    document.addEventListener("pointerlockchange", onLockChange);

    // ── Animations state ──────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let raf = 0;

    // ── Render loop ───────────────────────────────────────────────────────
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (disposed) return;

      const dt = Math.min(clock.getDelta(), 0.05);
      const t  = clock.elapsedTime;

      yaw   += camDelta.current.yaw;
      pitch += camDelta.current.pitch;
      camDelta.current.yaw = camDelta.current.pitch = 0;
      pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch));

      // ── Movement ────────────────────────────────────────────────────────
      let fwd = 0, rgt = 0;
      if (keys.has("KeyW") || keys.has("ArrowUp"))    fwd =  1;
      if (keys.has("KeyS") || keys.has("ArrowDown"))  fwd = -1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) rgt =  1;
      if (keys.has("KeyA") || keys.has("ArrowLeft"))  rgt = -1;
      const jx = joyState.current.x, jy = joyState.current.y;
      if (jx * jx + jy * jy > 0.01) { fwd = -jy; rgt = -jx; }

      const sprint   = keys.has("ShiftLeft") || keys.has("ShiftRight");
      const len      = Math.sqrt(fwd * fwd + rgt * rgt);
      const isMoving = len > 0.05;
      const sinY = Math.sin(yaw), cosY = Math.cos(yaw);

      if (isMoving) {
        const spd = SPEED * (sprint ? SPRINT_MUL : 1.0) * Math.min(1, len);
        const nx  = (sinY * fwd + cosY * rgt) / len;
        const nz  = (cosY * fwd - sinY * rgt) / len;
        pos.x += nx * spd * dt; pos.z += nz * spd * dt;
        char.root.rotation.y = Math.atan2(nx, nz);
        walkPh += dt * (sprint ? 12 : 8) * Math.min(1, len);
      } else {
        char.root.rotation.y = yaw; walkPh = 0;
      }
      char.root.position.set(pos.x, 0, pos.z);

      // ── Fire ────────────────────────────────────────────────────────────
      fireCd = Math.max(0, fireCd - dt);
      if (fireHeld.current && !reloadRef.current && fireCd <= 0 && ammoRef.current > 0) {
        ammoRef.current--; setAmmo(ammoRef.current);
        fireCd = AR_RATE;

        muzzleW.copy(muzzleLocal); handR.localToWorld(muzzleW);
        const bm = new THREE.Mesh(bulletGeo, bulletMat);
        bm.position.copy(muzzleW); scene.add(bm);
        bullets.push({ mesh: bm, vel: new THREE.Vector3(-sinY, 0, -cosY).multiplyScalar(110), life: 1.5 });

        flashLight.position.copy(muzzleW); flashLight.intensity = 6;
        sAnim.active = true; sAnim.t = 0;

        if (ammoRef.current === 0) { reloadRef.current = true; setReloading(true); }
      }
      if (flashLight.intensity > 0) flashLight.intensity = Math.max(0, flashLight.intensity - dt * 40);

      // ── Reload ──────────────────────────────────────────────────────────
      if (reloadRef.current && !rAnim.active) { rAnim.active = true; rAnim.t = 0; rAnim.done = false; }
      if (rAnim.active) {
        rAnim.t = Math.min(1, rAnim.t + dt / 1.5);
        if (!rAnim.done && rAnim.t > 0.45) {
          ammoRef.current = AR_AMMO; setAmmo(AR_AMMO); rAnim.done = true;
        }
        if (rAnim.t >= 1) { rAnim.active = false; rAnim.t = 0; reloadRef.current = false; setReloading(false); }
      }
      if (sAnim.active) { sAnim.t = Math.min(1, sAnim.t + dt / 0.18); if (sAnim.t >= 1) { sAnim.active = false; sAnim.t = 0; } }

      // ── Bullets ─────────────────────────────────────────────────────────
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]; b.life -= dt;
        b.mesh.position.addScaledVector(b.vel, dt);
        if (b.life <= 0 || b.mesh.position.y < -2) { scene.remove(b.mesh); bullets.splice(i, 1); }
      }

      // ── Arm / weapon pose ───────────────────────────────────────────────
      // Arm angles for AR hold: barrel points forward (+Z in world).
      // Negative X = arm tilts forward (+Z); combined upper+elbow ≈ -1.4 rad
      // puts the forearm nearly horizontal and pointing forward.
      const R_UP_X = -0.50, R_UP_Z = -0.55;  // right upper arm: forward + inward
      const R_EL_X = -0.92, R_EL_Z =  0.20;  // right forearm:   more forward
      const L_UP_X = -0.82, L_UP_Z =  0.52;  // left upper arm:  further forward + inward
      const L_EL_X = -0.52, L_EL_Z = -0.10;  // left forearm:    extend toward foregrip

      let recoil = 0;
      if (sAnim.active) {
        const st = sAnim.t;
        recoil = (st < 0.2 ? st / 0.2 : 1 - (st - 0.2) / 0.8) * 0.20;
      }
      let rdrop = 0;
      if (rAnim.active) {
        const rt = rAnim.t;
        rdrop = (rt < 0.3 ? rt / 0.3 : rt < 0.7 ? 1 : 1 - (rt - 0.7) / 0.3) * 0.85;
      }

      if (isMoving) {
        const sw = Math.sin(walkPh) * (sprint ? 0.48 : 0.34);
        char.armRPiv.rotation.set(R_UP_X + sw * 0.22 + recoil, 0, R_UP_Z);
        char.elbowRPiv.rotation.set(R_EL_X + sw * 0.11 + rdrop * 0.5, 0, R_EL_Z);
        char.armLPiv.rotation.set(L_UP_X - sw * 0.22, 0, L_UP_Z);
        char.elbowLPiv.rotation.set(L_EL_X - sw * 0.10 + rdrop * 0.4, 0, L_EL_Z);
        char.legLPiv.rotation.set(-sw, 0, 0);
        char.kneeLPiv.rotation.set(Math.max(0, sw) * 0.55, 0, 0);
        char.legRPiv.rotation.set( sw, 0, 0);
        char.kneeRPiv.rotation.set(Math.max(0, -sw) * 0.55, 0, 0);
      } else {
        const id = Math.sin(t * 1.3) * 0.022;
        char.armRPiv.rotation.set(R_UP_X + id * 0.18 + recoil, 0, R_UP_Z);
        char.elbowRPiv.rotation.set(R_EL_X + id * 0.09 + rdrop * 0.5, 0, R_EL_Z);
        char.armLPiv.rotation.set(L_UP_X + id * 0.14, 0, L_UP_Z);
        char.elbowLPiv.rotation.set(L_EL_X + id * 0.07 + rdrop * 0.4, 0, L_EL_Z);
        char.legLPiv.rotation.set(id * 0.10, 0, 0);
        char.kneeLPiv.rotation.set(0, 0, 0);
        char.legRPiv.rotation.set(-id * 0.10, 0, 0);
        char.kneeRPiv.rotation.set(0, 0, 0);
      }

      // ── TPS Camera (same formula as original code) ──────────────────────
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

    // ── Cleanup — only dispose GPU resources, DO NOT forceContextLoss ─────
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", applySize);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup",   onKeyUp);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      canvas.removeEventListener("click", onCanvasClick);
      if (locked) document.exitPointerLock();
      bulletGeo.dispose(); bulletMat.dispose();
      renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONCE — all mutable state accessed through refs

  const joyAtCenter = joyVis.x === 0 && joyVis.y === 0;
  const ammoLow     = ammo <= Math.floor(AR_AMMO * 0.25);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#87ceeb", touchAction: "none" }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />

      {/* Crosshair */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
        <div style={{ width: 22, height: 2, background: "rgba(255,255,255,0.92)", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", boxShadow: "0 0 3px #000a" }} />
        <div style={{ width: 2, height: 22, background: "rgba(255,255,255,0.92)", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", boxShadow: "0 0 3px #000a" }} />
      </div>

      {/* Joystick */}
      <div
        style={{ position: "absolute", bottom: 48, left: 48, width: JOY_BASE_R * 2, height: JOY_BASE_R * 2, borderRadius: "50%", background: "rgba(255,255,255,0.10)", border: "2px solid rgba(255,255,255,0.30)", touchAction: "none", userSelect: "none" }}
        onTouchStart={onJoyStart} onTouchMove={onJoyMove} onTouchEnd={onJoyEnd} onTouchCancel={onJoyEnd}
      >
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(calc(-50% + ${joyVis.x}px), calc(-50% + ${joyVis.y}px))`, width: JOY_THUMB_R * 2, height: JOY_THUMB_R * 2, borderRadius: "50%", background: "rgba(255,255,255,0.50)", border: "2px solid rgba(255,255,255,0.70)", transition: joyAtCenter ? "transform 0.12s" : "none", pointerEvents: "none" }} />
      </div>

      {/* Camera swipe */}
      <div
        style={{ position: "absolute", top: 0, right: 0, width: "55%", height: "60%", touchAction: "none", userSelect: "none" }}
        onTouchStart={onCamStart} onTouchMove={onCamMove} onTouchEnd={onCamEnd} onTouchCancel={onCamEnd}
      />

      {/* Ammo */}
      <div style={{ position: "absolute", bottom: 185, right: 52, textAlign: "right", pointerEvents: "none" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 2 }}>AR</div>
        <div style={{ fontSize: 27, fontWeight: 800, fontFamily: "monospace", color: ammoLow ? "#ff4444" : "#fff", textShadow: "0 2px 8px #000a", lineHeight: 1 }}>
          {String(ammo).padStart(2, "0")}<span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginLeft: 3 }}>/{AR_AMMO}</span>
        </div>
        {reloading && <div style={{ fontSize: 10, fontWeight: 700, color: "#ffbb00", letterSpacing: 1 }}>RELOADING…</div>}
      </div>

      {/* Reload */}
      <div onTouchStart={onReload} onTouchEnd={e => e.stopPropagation()}
        style={{ position: "absolute", bottom: 128, right: 62, width: 62, height: 62, borderRadius: "50%", background: reloading ? "rgba(255,187,0,0.25)" : "rgba(255,255,255,0.15)", border: `2px solid ${reloading ? "rgba(255,187,0,0.6)" : "rgba(255,255,255,0.40)"}`, display: "flex", alignItems: "center", justifyContent: "center", touchAction: "none", userSelect: "none", opacity: reloading ? 0.5 : 1 }}>
        <span style={{ fontSize: 8, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>RELOAD</span>
      </div>

      {/* Fire */}
      <div onTouchStart={onFireStart} onTouchEnd={onFireEnd} onTouchCancel={onFireEnd}
        style={{ position: "absolute", bottom: 48, right: 48, width: 88, height: 88, borderRadius: "50%", background: "rgba(255,50,50,0.28)", border: "3px solid rgba(255,70,70,0.65)", display: "flex", alignItems: "center", justifyContent: "center", touchAction: "none", userSelect: "none", boxShadow: "0 0 16px rgba(255,50,50,0.2)" }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>FIRE</span>
      </div>
    </div>
  );
}
