import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import type { BattleConfig } from "../game/battleTypes";

interface Props { config: BattleConfig; onEnd: (won: boolean, kills: number) => void; }

const JOY_BASE_R  = 65;
const JOY_MAX_OFF = 48;
const JOY_THUMB_R = 27;
const CAM_SENS    = 0.006;
const AMMO_MAX    = 30;
const FIRE_RATE   = 0.10;

// ── Arm angles (computed so wrist meets weapon anchor) ─────────────────────────
// Weapon anchor: (0.12, 1.30, 0.48) in char.root local.
// Right shoulder pivot: (0.675, 2.0, 0).
// Target wrist (pistol grip):  (0.16, 1.32, 0.52).
//   Rz(-0.65) * Rx(-0.55) * (0,-1,0) → arm dir (-0.516, -0.678, 0.523)
//   wrist = shoulder + dir = (0.159, 1.322, 0.523)  ✓ matches anchor.
//
// Left shoulder pivot: (-0.675, 2.0, 0).
// Target wrist (foregrip ≈ 55 % along barrel):  (-0.18, 1.56, 0.75).
//   Rz(+0.85) * Rx(-0.85) * (0,-1,0) → arm dir (0.496, -0.436, 0.751)
//   wrist = shoulder + dir = (-0.179, 1.564, 0.751)  ✓ matches foregrip.
const ARM_R_X = -0.55;
const ARM_R_Z = -0.65;
const ARM_L_X = -0.85;
const ARM_L_Z =  0.85;

function bx(
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

interface BlockChar {
  root: THREE.Group;
  armLPiv: THREE.Group; armRPiv: THREE.Group;
  legLPiv: THREE.Group; legRPiv: THREE.Group;
}
function buildChar(): BlockChar {
  const root = new THREE.Group();
  // head
  root.add(bx(0.80, 0.80, 0.80, 0xffcc99, 0, 2.40, 0));
  root.add(bx(0.16, 0.16, 0.02, 0x111111, -0.17, 2.46, 0.41, false));
  root.add(bx(0.16, 0.16, 0.02, 0x111111,  0.17, 2.46, 0.41, false));
  root.add(bx(0.22, 0.06, 0.02, 0x884422,  0.00, 2.22, 0.41, false));
  // body
  root.add(bx(1.00, 1.00, 0.50, 0x1155cc, 0, 1.50, 0));
  // arms
  const armLPiv = new THREE.Group(); armLPiv.position.set(-0.675, 2.00, 0);
  armLPiv.add(bx(0.35, 1.00, 0.35, 0x1155cc, 0, -0.50, 0)); root.add(armLPiv);
  const armRPiv = new THREE.Group(); armRPiv.position.set( 0.675, 2.00, 0);
  armRPiv.add(bx(0.35, 1.00, 0.35, 0x1155cc, 0, -0.50, 0)); root.add(armRPiv);
  // legs
  const legLPiv = new THREE.Group(); legLPiv.position.set(-0.18, 1.00, 0);
  legLPiv.add(bx(0.35, 1.00, 0.35, 0x1a1a44, 0, -0.50, 0)); root.add(legLPiv);
  const legRPiv = new THREE.Group(); legRPiv.position.set( 0.18, 1.00, 0);
  legRPiv.add(bx(0.35, 1.00, 0.35, 0x1a1a44, 0, -0.50, 0)); root.add(legRPiv);
  return { root, armLPiv, armRPiv, legLPiv, legRPiv };
}

export default function BattleScene({ onEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const joyState = useRef({ x: 0, y: 0 });
  const camDelta = useRef({ yaw: 0, pitch: 0 });
  const fireHeld = useRef(false);

  const [joyVis, setJoyVis]       = useState({ x: 0, y: 0 });
  const [ammo, setAmmo]           = useState(AMMO_MAX);
  const [reloading, setReloading] = useState(false);
  const ammoRef   = useRef(AMMO_MAX);
  const reloadRef = useRef(false);

  const handleExit = useCallback(() => onEnd(false, 0), [onEnd]);

  // ── Joystick ──────────────────────────────────────────────────────────────────
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

  // ── Camera swipe ──────────────────────────────────────────────────────────────
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

  // ── Fire ──────────────────────────────────────────────────────────────────────
  const fireId = useRef(-1);
  const onFireStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (fireId.current !== -1) return;
    fireId.current = e.changedTouches[0].identifier; fireHeld.current = true;
  }, []);
  const onFireEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (!Array.from(e.changedTouches).find(c => c.identifier === fireId.current)) return;
    fireId.current = -1; fireHeld.current = false;
  }, []);

  // ── Reload ────────────────────────────────────────────────────────────────────
  const onReload = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (reloadRef.current || ammoRef.current >= AMMO_MAX) return;
    reloadRef.current = true; setReloading(true);
  }, []);

  // ── Three.js ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let disposed = false;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.007);

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 600);

    const sun = new THREE.DirectionalLight(0xfff4d0, 2.2);
    sun.position.set(50, 90, 40); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = 120;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 300;
    sun.shadow.camera.left = -sc; sun.shadow.camera.right = sc;
    sun.shadow.camera.top = sc; sun.shadow.camera.bottom = -sc;
    scene.add(sun, new THREE.AmbientLight(0x8899bb, 0.9));
    const fill = new THREE.DirectionalLight(0xaaccff, 0.4);
    fill.position.set(-30, 20, -30); scene.add(fill);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshLambertMaterial({ color: 0x5a9c3a }),
    );
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const grid = new THREE.GridHelper(600, 60, 0x000000, 0x000000);
    (grid.material as THREE.LineBasicMaterial).opacity = 0.05;
    (grid.material as THREE.LineBasicMaterial).transparent = true;
    scene.add(grid);

    // ── Character ──────────────────────────────────────────────────────────────
    const char = buildChar();
    scene.add(char.root);

    // ── Weapon anchor — child of char.root, NOT of any arm ─────────────────────
    // Positioned so pistol grip aligns with computed right-wrist position.
    //   x=0.12  right of centre (between shoulders)
    //   y=1.30  matches right wrist height with ARM_R_X=-0.55, ARM_R_Z=-0.65
    //   z=0.48  forward of body (arm naturally extends this far)
    const weaponAnchor = new THREE.Group();
    weaponAnchor.position.set(0.12, 1.30, 0.48);
    char.root.add(weaponAnchor);

    // Muzzle tip local inside weaponAnchor (+Z = forward)
    // Will be updated after GLB loads; default assumes 2 unit barrel.
    const muzzleLocal = new THREE.Vector3(0, 0.04, 1.55);

    // Muzzle flash point-light
    const flashLight = new THREE.PointLight(0xff8800, 0, 5);
    scene.add(flashLight);

    // ── Load AR GLB ────────────────────────────────────────────────────────────
    import("three/examples/jsm/loaders/GLTFLoader.js").then(({ GLTFLoader }) => {
      if (disposed) return;
      const loader = new GLTFLoader();
      loader.load(
        "/weapons/ar.glb",
        (gltf) => {
          if (disposed) return;
          const model = gltf.scene;

          // ── Scale: target barrel (longest dim) = 2.2 world units ──────────
          // That gives a rifle roughly 80% of character height — looks big/correct.
          const bbox0 = new THREE.Box3().setFromObject(model);
          const size  = new THREE.Vector3(); bbox0.getSize(size);
          const longest = Math.max(size.x, size.y, size.z);
          const targetLen = 2.2;
          model.scale.setScalar(targetLen / longest);

          // ── Orient: rotate barrel → +Z (character forward) ────────────────
          if (size.x >= size.y && size.x >= size.z) {
            // barrel along X → rotate so +X → +Z
            model.rotation.y = -Math.PI / 2;
          } else if (size.y >= size.x && size.y >= size.z) {
            // barrel along Y → rotate so +Y → +Z
            model.rotation.x = -Math.PI / 2;
          }
          // else barrel already along Z

          // ── Centre on bounding box ─────────────────────────────────────────
          const bbox1 = new THREE.Box3().setFromObject(model);
          const centre = new THREE.Vector3(); bbox1.getCenter(centre);
          model.position.sub(centre);

          // ── Shift so pistol-grip end is near the anchor origin,
          //    barrel extends forward (+Z) ────────────────────────────────────
          const bbox2 = new THREE.Box3().setFromObject(model);
          // Put rear face at z = -0.10 (slightly behind anchor)
          model.position.z -= bbox2.min.z + 0.10;

          model.traverse(c => {
            if (c instanceof THREE.Mesh) { c.castShadow = true; c.receiveShadow = false; }
          });

          weaponAnchor.add(model);

          // Update muzzle to front of bounding box
          const bbox3 = new THREE.Box3().setFromObject(weaponAnchor);
          muzzleLocal.set(0, bbox3.max.y * 0.25, bbox3.max.z - 0.05);
        },
        undefined,
        () => {
          if (disposed) return;
          // Fallback procedural rifle (darker, chunkier — visible even if GLB fails)
          const G = new THREE.Group();
          const B = 0x1a1a1a, D = 0x0a0a0a, TAN = 0x6b4c2a;
          // receiver
          G.add(bx(0.20, 0.22, 1.20, B,   0,  0.04,  0.55));
          // barrel
          G.add(bx(0.08, 0.08, 0.90, D,   0,  0.10,  1.45));
          // handguard
          G.add(bx(0.18, 0.18, 0.52, 0x333333, 0, 0.05, 1.06));
          // magazine
          G.add(bx(0.12, 0.46, 0.10, TAN, 0, -0.26,  0.42));
          // pistol grip
          G.add(bx(0.12, 0.34, 0.12, TAN, 0, -0.18,  0.08));
          // stock
          G.add(bx(0.16, 0.18, 0.44, B,   0,  0.05, -0.22));
          // carry handle / scope rail
          G.add(bx(0.08, 0.12, 0.50, 0x444444, 0, 0.22, 0.55));
          weaponAnchor.add(G);
          muzzleLocal.set(0, 0.10, 1.90);
        },
      );
    });

    // ── Bullet traces ──────────────────────────────────────────────────────────
    type Tracer = { line: THREE.Line; mat: THREE.LineBasicMaterial; life: number };
    const tracers: Tracer[] = [];
    const raycaster  = new THREE.Raycaster();
    const screenCtr  = new THREE.Vector2(0, 0);
    const muzzleW    = new THREE.Vector3();

    // ── State ─────────────────────────────────────────────────────────────────
    const pos = new THREE.Vector3(0, 0, 0);
    const camV = new THREE.Vector3();
    let yaw = 0, pitch = -0.25, walkPhase = 0, locked = false;

    const SPEED     = 8.0;
    const SPRINT    = 1.65;
    const CAM_DIST  = 5.5;
    const CAM_Y     = 3.5;   // camera look-at height (crosshair above character head)
    const CAM_LERP  = 0.16;
    const PITCH_MIN = -1.10;
    const PITCH_MAX =  0.25;
    const MOUSE_S   =  0.003;

    ammoRef.current = AMMO_MAX;

    // Shoot animation
    const sAnim = { t: 0, active: false };
    // Reload animation
    const rAnim = { t: 0, active: false, done: false };
    let fireCd = 0;

    // ── Keyboard ──────────────────────────────────────────────────────────────
    const keys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      if (["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))
        e.preventDefault();
      keys.add(e.code);
      if (e.code === "Escape") { if (locked) document.exitPointerLock(); handleExit(); }
      if (e.code === "KeyR" && !reloadRef.current && ammoRef.current < AMMO_MAX) {
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

    const onClick = () => { if (!locked) canvas.requestPointerLock(); };
    canvas.addEventListener("click", onClick);
    const onMM = (e: MouseEvent) => {
      if (!locked) return;
      yaw   -= e.movementX * MOUSE_S;
      pitch -= e.movementY * MOUSE_S;
      pitch  = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch));
    };
    document.addEventListener("mousemove", onMM);
    const onLC = () => { locked = document.pointerLockElement === canvas; };
    document.addEventListener("pointerlockchange", onLC);

    // ── Resize ────────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(canvas);
    {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    camV.set(0, CAM_Y - Math.sin(pitch) * CAM_DIST, -CAM_DIST * Math.cos(pitch));

    // ── Render loop ───────────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    const tmpCam = new THREE.Vector3();
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t  = clock.elapsedTime;

      // Apply touch camera delta
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
      const jx = joyState.current.x, jy = joyState.current.y;
      if (jx * jx + jy * jy > 0.01) { fwd = -jy; rgt = -jx; }

      const sprint    = keys.has("ShiftLeft") || keys.has("ShiftRight");
      const len       = Math.sqrt(fwd * fwd + rgt * rgt);
      const isMoving  = len > 0.05;
      const sinY = Math.sin(yaw), cosY = Math.cos(yaw);

      if (isMoving) {
        const spd = SPEED * (sprint ? SPRINT : 1) * Math.min(1, len);
        const nx  = (sinY * fwd + cosY * rgt) / len;
        const nz  = (cosY * fwd - sinY * rgt) / len;
        pos.x += nx * spd * dt; pos.z += nz * spd * dt;
        // While firing: snap to aim direction; otherwise face movement direction
        if (fireHeld.current || reloadRef.current) {
          char.root.rotation.y = yaw;
        } else {
          char.root.rotation.y = Math.atan2(nx, nz);
        }
        walkPhase += dt * (sprint ? 12 : 8) * Math.min(1, len);
      } else {
        char.root.rotation.y = yaw;
        walkPhase = 0;
      }
      char.root.position.set(pos.x, 0, pos.z);

      // ── Fire ────────────────────────────────────────────────────────────────
      fireCd = Math.max(0, fireCd - dt);
      if (fireHeld.current && !reloadRef.current && fireCd <= 0 && ammoRef.current > 0) {
        ammoRef.current--;
        setAmmo(ammoRef.current);
        fireCd = FIRE_RATE;

        // Raycast from camera through screen centre (exact crosshair aim)
        raycaster.setFromCamera(screenCtr, camera);
        const aimDir = raycaster.ray.direction.clone();
        const hitPt  = raycaster.ray.origin.clone().addScaledVector(aimDir, 200);

        // Muzzle world position
        muzzleW.copy(muzzleLocal);
        weaponAnchor.localToWorld(muzzleW);

        // Bullet trace line
        const tGeo = new THREE.BufferGeometry().setFromPoints([muzzleW.clone(), hitPt]);
        const tMat = new THREE.LineBasicMaterial({ color: 0xffee44, transparent: true, opacity: 1 });
        const tLine = new THREE.Line(tGeo, tMat);
        scene.add(tLine);
        tracers.push({ line: tLine, mat: tMat, life: 0.10 });

        // Flash
        flashLight.position.copy(muzzleW); flashLight.intensity = 6;

        // Shoot anim
        sAnim.active = true; sAnim.t = 0;

        if (ammoRef.current === 0) { reloadRef.current = true; setReloading(true); }
      }

      // Decay flash
      if (flashLight.intensity > 0)
        flashLight.intensity = Math.max(0, flashLight.intensity - dt * 40);

      // ── Reload ──────────────────────────────────────────────────────────────
      if (reloadRef.current && !rAnim.active) {
        rAnim.active = true; rAnim.t = 0; rAnim.done = false;
      }
      if (rAnim.active) {
        rAnim.t = Math.min(1, rAnim.t + dt / 1.5);
        if (!rAnim.done && rAnim.t > 0.45) {
          ammoRef.current = AMMO_MAX; setAmmo(AMMO_MAX); rAnim.done = true;
        }
        if (rAnim.t >= 1) {
          rAnim.active = false; rAnim.t = 0;
          reloadRef.current = false; setReloading(false);
        }
      }

      // Shoot anim progress
      if (sAnim.active) {
        sAnim.t = Math.min(1, sAnim.t + dt / 0.18);
        if (sAnim.t >= 1) { sAnim.active = false; sAnim.t = 0; }
      }

      // Fade traces
      for (let i = tracers.length - 1; i >= 0; i--) {
        const tr = tracers[i];
        tr.life -= dt;
        tr.mat.opacity = Math.max(0, tr.life / 0.10);
        if (tr.life <= 0) {
          scene.remove(tr.line); tr.line.geometry.dispose(); tr.mat.dispose();
          tracers.splice(i, 1);
        }
      }

      // ── Weapon anchor animation (bob & recoil) ────────────────────────────
      const baseY   = 1.30;
      const baseZ   = 0.48;
      let   wBobY   = 0, wBobZ = 0, wRecoilZ = 0, wRecoilRX = 0;
      let   rdrop   = 0;

      if (sAnim.active) {
        const s = sAnim.t;
        const k = s < 0.25 ? s / 0.25 : 1 - (s - 0.25) / 0.75;
        wRecoilZ  = -k * 0.18;   // weapon kicks backward
        wRecoilRX =  k * 0.08;   // muzzle rises slightly
      }
      if (rAnim.active) {
        const s = rAnim.t;
        rdrop = s < 0.3 ? s / 0.3 : s < 0.7 ? 1 : 1 - (s - 0.7) / 0.3;
        wBobY = -rdrop * 0.30;   // weapon drops during reload
      } else if (isMoving) {
        wBobY = Math.sin(walkPhase) * (sprint ? 0.06 : 0.04);
        wBobZ = Math.sin(walkPhase * 0.5) * 0.015;
      } else {
        wBobY = Math.sin(t * 1.5) * 0.015;
      }

      weaponAnchor.position.set(0.18, baseY + wBobY, baseZ + wBobZ + wRecoilZ);
      weaponAnchor.rotation.x = wRecoilRX;

      // ── Arm animation ──────────────────────────────────────────────────────
      // Arms stay in rifle-hold pose; adjust slightly during walk/reload/shoot.
      let recoilRX = 0;
      if (sAnim.active) {
        const s = sAnim.t;
        recoilRX = (s < 0.25 ? s / 0.25 : 1 - (s - 0.25) / 0.75) * 0.10;
      }

      char.armRPiv.rotation.z = ARM_R_Z;
      char.armLPiv.rotation.z = ARM_L_Z;

      if (rAnim.active) {
        char.armRPiv.rotation.x = ARM_R_X + rdrop * 0.85;
        char.armLPiv.rotation.x = ARM_L_X + rdrop * 0.60;
        char.legLPiv.rotation.x = Math.sin(t * 1.4) * 0.02;
        char.legRPiv.rotation.x = -Math.sin(t * 1.4) * 0.02;
      } else if (isMoving) {
        const sw = Math.sin(walkPhase) * (sprint ? 0.42 : 0.30);
        char.armRPiv.rotation.x = ARM_R_X + sw * 0.30 + recoilRX;
        char.armLPiv.rotation.x = ARM_L_X - sw * 0.30;
        char.legLPiv.rotation.x = -sw; char.legRPiv.rotation.x = sw;
      } else {
        const id = Math.sin(t * 1.5) * 0.02;
        char.armRPiv.rotation.x = ARM_R_X + id * 0.20 + recoilRX;
        char.armLPiv.rotation.x = ARM_L_X + id * 0.15;
        char.legLPiv.rotation.x = id * 0.10; char.legRPiv.rotation.x = -id * 0.10;
      }

      // ── TPS camera ──────────────────────────────────────────────────────────
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      tmpCam.set(
        pos.x - sinY * CAM_DIST * cp,
        CAM_Y  - sp * CAM_DIST,
        pos.z  - cosY * CAM_DIST * cp,
      );
      camV.lerp(tmpCam, CAM_LERP);
      camera.position.copy(camV);
      camera.lookAt(pos.x, CAM_Y, pos.z);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup",   onKeyUp);
      document.removeEventListener("mousemove", onMM);
      document.removeEventListener("pointerlockchange", onLC);
      canvas.removeEventListener("click", onClick);
      if (locked) document.exitPointerLock();
      tracers.forEach(tr => { tr.line.geometry.dispose(); tr.mat.dispose(); });
      renderer.dispose();
    };
  }, [handleExit, joyState, camDelta, fireHeld, ammoRef, reloadRef]);

  const joyAtCenter = joyVis.x === 0 && joyVis.y === 0;
  const ammoLow = ammo <= Math.floor(AMMO_MAX * 0.25);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

      {/* Crosshair */}
      <div style={{ position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)", pointerEvents: "none", width: 26, height: 26 }}>
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0,
          height: 2, marginTop: -1,
          background: "rgba(255,255,255,0.92)", boxShadow: "0 0 4px #000c" }} />
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0,
          width: 2, marginLeft: -1,
          background: "rgba(255,255,255,0.92)", boxShadow: "0 0 4px #000c" }} />
      </div>

      {/* Joystick */}
      <div
        style={{ position: "absolute", bottom: 48, left: 48,
          width: JOY_BASE_R * 2, height: JOY_BASE_R * 2, borderRadius: "50%",
          background: "rgba(255,255,255,0.10)", border: "2px solid rgba(255,255,255,0.30)",
          touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
        onTouchStart={onJoyStart} onTouchMove={onJoyMove}
        onTouchEnd={onJoyEnd} onTouchCancel={onJoyEnd}
      >
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: `translate(calc(-50% + ${joyVis.x}px), calc(-50% + ${joyVis.y}px))`,
          width: JOY_THUMB_R * 2, height: JOY_THUMB_R * 2, borderRadius: "50%",
          background: "rgba(255,255,255,0.50)", border: "2px solid rgba(255,255,255,0.70)",
          transition: joyAtCenter ? "transform 0.14s ease-out" : "none",
          pointerEvents: "none",
        }} />
      </div>

      {/* Camera swipe area */}
      <div
        style={{ position: "absolute", top: 0, right: 0, width: "55%", height: "60%",
          touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
        onTouchStart={onCamStart} onTouchMove={onCamMove}
        onTouchEnd={onCamEnd} onTouchCancel={onCamEnd}
      />

      {/* Ammo */}
      <div style={{ position: "absolute", bottom: 200, right: 52,
        pointerEvents: "none", textAlign: "right" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)",
          letterSpacing: 2, marginBottom: 2 }}>AR</div>
        <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "monospace",
          color: ammoLow ? "#ff4444" : "#fff",
          textShadow: "0 2px 8px #000a", lineHeight: 1 }}>
          {String(ammo).padStart(2, "0")}
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginLeft: 3 }}>
            /{AMMO_MAX}
          </span>
        </div>
        {reloading && (
          <div style={{ fontSize: 11, fontWeight: 700, color: "#ffbb00",
            letterSpacing: 1, marginTop: 2 }}>RELOADING…</div>
        )}
      </div>

      {/* Reload */}
      <div
        onTouchStart={onReload} onTouchEnd={e => e.stopPropagation()}
        style={{ position: "absolute", bottom: 135, right: 62,
          width: 64, height: 64, borderRadius: "50%",
          background: reloading ? "rgba(255,187,0,0.25)" : "rgba(255,255,255,0.18)",
          border: `2px solid ${reloading ? "rgba(255,187,0,0.7)" : "rgba(255,255,255,0.45)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          touchAction: "none", userSelect: "none", WebkitUserSelect: "none",
          opacity: reloading ? 0.5 : 1 }}
      >
        <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>
          RELOAD
        </span>
      </div>

      {/* Fire */}
      <div
        onTouchStart={onFireStart} onTouchEnd={onFireEnd} onTouchCancel={onFireEnd}
        style={{ position: "absolute", bottom: 48, right: 48,
          width: 90, height: 90, borderRadius: "50%",
          background: "rgba(255,60,60,0.30)", border: "3px solid rgba(255,80,80,0.70)",
          display: "flex", alignItems: "center", justifyContent: "center",
          touchAction: "none", userSelect: "none", WebkitUserSelect: "none",
          boxShadow: "0 0 18px rgba(255,60,60,0.25)" }}
      >
        <span style={{ fontSize: 11, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>
          FIRE
        </span>
      </div>
    </div>
  );
}
