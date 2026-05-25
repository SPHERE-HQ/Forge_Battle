import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import type { BattleConfig } from "../game/battleTypes";

interface Props { config: BattleConfig; onEnd: (won: boolean, kills: number) => void; }
type WeaponKind = "ar" | "pistol";

const WEAPON_SPECS: Record<WeaponKind, { ammo: number; rate: number; auto: boolean; label: string }> = {
  ar:     { ammo: 30, rate: 0.10, auto: true,  label: "AR" },
  pistol: { ammo: 15, rate: 0.35, auto: false, label: "PISTOL" },
};

// ─── Mobile constants ──────────────────────────────────────────────────────────
const JOY_BASE_R  = 65;
const JOY_MAX_OFF = 48;
const JOY_THUMB_R = 27;
const CAM_SENS    = 0.006;

// ─── Arm angles for proper 2-handed rifle hold ─────────────────────────────────
const ARM_R_IDLE = -1.15;  // right arm: ~66° from vertical (pistol grip)
const ARM_L_IDLE = -1.35;  // left arm:  ~77° from vertical (foregrip)
const ARM_R_Z    = -0.10;  // slight inward
const ARM_L_Z    =  0.22;  // more inward (left arm crosses toward center)

// ─── Box helper ────────────────────────────────────────────────────────────────
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

// ─── Blocky character ──────────────────────────────────────────────────────────
interface BlockChar {
  root: THREE.Group;
  armLPiv: THREE.Group; armRPiv: THREE.Group;
  legLPiv: THREE.Group; legRPiv: THREE.Group;
}
function buildChar(): BlockChar {
  const root = new THREE.Group();
  root.add(bx(0.80, 0.80, 0.80, 0xffcc99, 0, 2.40, 0));
  root.add(bx(0.16, 0.16, 0.02, 0x111111, -0.17, 2.46,  0.41, false));
  root.add(bx(0.16, 0.16, 0.02, 0x111111,  0.17, 2.46,  0.41, false));
  root.add(bx(0.22, 0.06, 0.02, 0x884422,  0.00, 2.22,  0.41, false));
  root.add(bx(1.00, 1.00, 0.50, 0x1155cc, 0, 1.50, 0));
  const armLPiv = new THREE.Group(); armLPiv.position.set(-0.675, 2.00, 0);
  armLPiv.add(bx(0.35, 1.00, 0.35, 0x1155cc, 0, -0.50, 0)); root.add(armLPiv);
  const armRPiv = new THREE.Group(); armRPiv.position.set( 0.675, 2.00, 0);
  armRPiv.add(bx(0.35, 1.00, 0.35, 0x1155cc, 0, -0.50, 0)); root.add(armRPiv);
  const legLPiv = new THREE.Group(); legLPiv.position.set(-0.18, 1.00, 0);
  legLPiv.add(bx(0.35, 1.00, 0.35, 0x1a1a44, 0, -0.50, 0)); root.add(legLPiv);
  const legRPiv = new THREE.Group(); legRPiv.position.set( 0.18, 1.00, 0);
  legRPiv.add(bx(0.35, 1.00, 0.35, 0x1a1a44, 0, -0.50, 0)); root.add(legRPiv);
  return { root, armLPiv, armRPiv, legLPiv, legRPiv };
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function BattleScene({ onEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const joyState = useRef({ x: 0, y: 0 });
  const camDelta = useRef({ yaw: 0, pitch: 0 });
  const fireHeld = useRef(false);
  const [joyVis, setJoyVis]         = useState({ x: 0, y: 0 });
  const [ammo, setAmmo]             = useState(WEAPON_SPECS.ar.ammo);
  const [reloading, setReloading]   = useState(false);
  const ammoRef   = useRef(WEAPON_SPECS.ar.ammo);
  const reloadRef = useRef(false);

  const handleExit = useCallback(() => onEnd(false, 0), [onEnd]);

  // ── Joystick ─────────────────────────────────────────────────────────────────
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

  // ── Camera swipe ─────────────────────────────────────────────────────────────
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

  // ── Fire ─────────────────────────────────────────────────────────────────────
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
    if (reloadRef.current || ammoRef.current >= WEAPON_SPECS.ar.ammo) return;
    reloadRef.current = true; setReloading(true);
  }, []);

  // ── Three.js scene ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let disposed = false;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

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
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const grid = new THREE.GridHelper(600, 60, 0x000000, 0x000000);
    (grid.material as THREE.LineBasicMaterial).opacity = 0.05;
    (grid.material as THREE.LineBasicMaterial).transparent = true;
    scene.add(grid);

    // ── Character ──────────────────────────────────────────────────────────────
    const char = buildChar();
    scene.add(char.root);

    // ── Weapon mount ──────────────────────────────────────────────────────────
    // handR sits at wrist (bottom of right arm)
    const handR = new THREE.Group();
    handR.position.set(0, -1.0, 0);
    char.armRPiv.add(handR);

    // weaponPivot: rotation.x = -ARM_R_IDLE cancels arm angle → barrel points forward
    const weaponPivot = new THREE.Group();
    weaponPivot.rotation.x = -ARM_R_IDLE;   // = +1.15  → barrel → char forward (+Z)
    weaponPivot.position.set(-0.02, 0.04, 0.06);
    handR.add(weaponPivot);

    // Muzzle local (inside weaponPivot), updated after GLB loads
    const muzzleVec = new THREE.Vector3(0, 0, 0.85);

    // Muzzle flash
    const flashLight = new THREE.PointLight(0xff8800, 0, 5);
    scene.add(flashLight);

    // ── Load AR GLB ───────────────────────────────────────────────────────────
    import("three/examples/jsm/loaders/GLTFLoader.js").then(({ GLTFLoader }) => {
      if (disposed) return;
      const loader = new GLTFLoader();
      loader.load(
        "/weapons/ar.glb",
        (gltf) => {
          if (disposed) return;
          const model = gltf.scene;

          // Auto-scale: longest axis → 1.2 world units
          const bbox = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3(); bbox.getSize(size);
          const longest = Math.max(size.x, size.y, size.z);
          const scaleFactor = 1.2 / longest;
          model.scale.setScalar(scaleFactor);

          // Detect barrel axis (longest dimension) and orient barrel → +Z
          if (size.x >= size.y && size.x >= size.z) {
            // barrel along X → rotate so X points to +Z
            model.rotation.y = -Math.PI / 2;
          } else if (size.y >= size.x && size.y >= size.z) {
            // barrel along Y → rotate so Y points to +Z
            model.rotation.x = -Math.PI / 2;
          }
          // else barrel already along Z, no extra rotation

          // Center on bounding box
          bbox.setFromObject(model);
          const center = new THREE.Vector3(); bbox.getCenter(center);
          model.position.sub(center);

          // Shift so rear/grip is at origin, barrel extends in +Z
          const bb2 = new THREE.Box3().setFromObject(model);
          // Move model so its back end sits at z=-0.05 (slightly behind pivot)
          model.position.z -= bb2.min.z + 0.05;

          // Shadows
          model.traverse(c => {
            if (c instanceof THREE.Mesh) { c.castShadow = true; c.receiveShadow = false; }
          });

          weaponPivot.add(model);

          // Update muzzle: front Z of scaled model
          const bb3 = new THREE.Box3().setFromObject(weaponPivot);
          muzzleVec.set(0, bb3.max.y * 0.3, bb3.max.z);
        },
        undefined,
        () => {
          if (disposed) return;
          // Fallback: simple procedural rifle
          const fb = new THREE.Group();
          const B = 0x282828, D = 0x141414;
          fb.add(bx(0.14, 0.14, 1.10, B, 0, 0.08,  0.52));
          fb.add(bx(0.06, 0.06, 0.55, D, 0, 0.10,  1.32));
          fb.add(bx(0.12, 0.12, 0.42, B, 0, 0.08,  0.90));
          fb.add(bx(0.08, 0.34, 0.06, D, 0, -0.22, 0.35));
          fb.add(bx(0.08, 0.24, 0.08, D, 0, -0.14, 0.04));
          fb.add(bx(0.10, 0.10, 0.30, B, 0, 0.06, -0.17));
          weaponPivot.add(fb);
          muzzleVec.set(0, 0.10, 1.60);
        }
      );
    });

    // ── Bullet traces ─────────────────────────────────────────────────────────
    type Tracer = { line: THREE.Line; mat: THREE.LineBasicMaterial; life: number };
    const tracers: Tracer[] = [];
    const raycaster = new THREE.Raycaster();
    const screenCenter = new THREE.Vector2(0, 0);

    // ── State ─────────────────────────────────────────────────────────────────
    const pos  = new THREE.Vector3(0, 0, 0);
    const camV = new THREE.Vector3();
    let yaw = 0, pitch = -0.38, walkPhase = 0, locked = false;

    const SPEED = 8.0, SPRINT_MUL = 1.65;
    const CAM_DIST = 5.5, CAM_LOOK_Y = 3.5, CAM_LERP = 0.16;
    const PITCH_MIN = -1.15, PITCH_MAX = 0.25, MOUSE_SENS = 0.003;

    const sAnim = { t: 0, active: false };
    const rAnim = { t: 0, active: false, done: false };
    let fireCd = 0;
    ammoRef.current = WEAPON_SPECS.ar.ammo;

    // ── Keyboard ──────────────────────────────────────────────────────────────
    const keys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      if (["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) e.preventDefault();
      keys.add(e.code);
      if (e.code === "Escape") { if (locked) document.exitPointerLock(); handleExit(); }
      if (e.code === "KeyR" && !reloadRef.current && ammoRef.current < WEAPON_SPECS.ar.ammo) {
        reloadRef.current = true; setReloading(true);
      }
      if (e.code === "KeyF") fireHeld.current = true;
    };
    const onKeyUp   = (e: KeyboardEvent) => { keys.delete(e.code); if (e.code === "KeyF") fireHeld.current = false; };
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
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    });
    ro.observe(canvas);
    {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    camV.set(0, CAM_LOOK_Y - Math.sin(pitch) * CAM_DIST, -CAM_DIST * Math.cos(pitch));

    // ── Render loop ───────────────────────────────────────────────────────────
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

      // ── Firing ────────────────────────────────────────────────────────────
      fireCd = Math.max(0, fireCd - dt);
      if (fireHeld.current && !reloadRef.current && fireCd <= 0 && ammoRef.current > 0) {
        ammoRef.current--;
        setAmmo(ammoRef.current);
        fireCd = WEAPON_SPECS.ar.rate;
        if (!WEAPON_SPECS.ar.auto) fireHeld.current = false;

        // ── RAYCAST from camera through screen center (crosshair) ────────────
        raycaster.setFromCamera(screenCenter, camera);
        const aimDir = raycaster.ray.direction.clone();
        const aimOrigin = raycaster.ray.origin.clone();
        // Hit point at max range (no collision detection yet, bots added later)
        const hitPoint = aimOrigin.clone().addScaledVector(aimDir, 200);

        // Muzzle world position
        muzzleW.copy(muzzleVec);
        weaponPivot.localToWorld(muzzleW);

        // ── Bullet trace: thin line from muzzle → hit point ──────────────────
        const tPoints = [muzzleW.clone(), hitPoint];
        const tGeo = new THREE.BufferGeometry().setFromPoints(tPoints);
        const tMat = new THREE.LineBasicMaterial({ color: 0xffee44, transparent: true, opacity: 1.0 });
        const tLine = new THREE.Line(tGeo, tMat);
        scene.add(tLine);
        tracers.push({ line: tLine, mat: tMat, life: 0.10 });

        // Muzzle flash
        flashLight.position.copy(muzzleW); flashLight.intensity = 6;

        // Shoot recoil
        sAnim.active = true; sAnim.t = 0;

        // Auto-reload on empty
        if (ammoRef.current === 0) { reloadRef.current = true; setReloading(true); }
      }

      // Decay flash
      if (flashLight.intensity > 0) flashLight.intensity = Math.max(0, flashLight.intensity - dt * 40);

      // ── Reload ──────────────────────────────────────────────────────────────
      if (reloadRef.current && !rAnim.active) { rAnim.active = true; rAnim.t = 0; rAnim.done = false; }
      if (rAnim.active) {
        rAnim.t = Math.min(1, rAnim.t + dt / 1.5);
        if (!rAnim.done && rAnim.t > 0.45) {
          ammoRef.current = WEAPON_SPECS.ar.ammo; setAmmo(ammoRef.current); rAnim.done = true;
        }
        if (rAnim.t >= 1) { rAnim.active = false; rAnim.t = 0; reloadRef.current = false; setReloading(false); }
      }

      // Update anims
      if (sAnim.active) { sAnim.t = Math.min(1, sAnim.t + dt / 0.18); if (sAnim.t >= 1) { sAnim.active = false; sAnim.t = 0; } }

      // Fade & remove tracers
      for (let i = tracers.length - 1; i >= 0; i--) {
        const t = tracers[i];
        t.life -= dt;
        t.mat.opacity = Math.max(0, t.life / 0.10);
        if (t.life <= 0) { scene.remove(t.line); t.line.geometry.dispose(); t.mat.dispose(); tracers.splice(i, 1); }
      }

      // ── Arm / weapon animation ───────────────────────────────────────────────
      // Shoot recoil: quick kick of right arm backward (+x) then return
      let recoil = 0;
      if (sAnim.active) {
        const st = sAnim.t;
        recoil = st < 0.2 ? (st / 0.2) * 0.22 : (1 - (st - 0.2) / 0.8) * 0.22;
      }
      // Reload drop
      let rdrop = 0;
      if (rAnim.active) {
        const rt = rAnim.t;
        rdrop = rt < 0.3 ? rt / 0.3 * 1.0 : rt < 0.7 ? 1.0 : (1 - (rt - 0.7) / 0.3) * 1.0;
      }

      char.armRPiv.rotation.z = ARM_R_Z;
      char.armLPiv.rotation.z = ARM_L_Z;

      if (rAnim.active) {
        char.armRPiv.rotation.x = ARM_R_IDLE + rdrop;
        char.armLPiv.rotation.x = ARM_L_IDLE + rdrop * 0.6;
        const rs = Math.sin(clock.elapsedTime * 1.4) * 0.02;
        char.legLPiv.rotation.x = rs; char.legRPiv.rotation.x = -rs;
      } else if (isMoving) {
        const sw = Math.sin(walkPhase) * (sprint ? 0.48 : 0.36);
        char.armRPiv.rotation.x = ARM_R_IDLE + sw * 0.35 + recoil;
        char.armLPiv.rotation.x = ARM_L_IDLE - sw * 0.35;
        char.legLPiv.rotation.x = -sw; char.legRPiv.rotation.x = sw;
      } else {
        const id = Math.sin(clock.elapsedTime * 1.4) * 0.03;
        char.armRPiv.rotation.x = ARM_R_IDLE + id * 0.25 + recoil;
        char.armLPiv.rotation.x = ARM_L_IDLE + id * 0.20;
        char.legLPiv.rotation.x = id * 0.12; char.legRPiv.rotation.x = -id * 0.12;
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
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup",   onKeyUp);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      canvas.removeEventListener("click", onCanvasClick);
      if (locked) document.exitPointerLock();
      tracers.forEach(t => { t.line.geometry.dispose(); t.mat.dispose(); });
      renderer.dispose();
    };
  }, [handleExit, joyState, camDelta, fireHeld, ammoRef, reloadRef]);

  const joyAtCenter = joyVis.x === 0 && joyVis.y === 0;
  const ammoLow = ammo <= Math.floor(WEAPON_SPECS.ar.ammo * 0.25);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

      {/* Crosshair */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none", width: 24, height: 24 }}>
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, marginTop: -1, background: "rgba(255,255,255,0.9)", boxShadow: "0 0 4px #000c" }} />
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, marginLeft: -1, background: "rgba(255,255,255,0.9)", boxShadow: "0 0 4px #000c" }} />
      </div>

      {/* Left joystick */}
      <div
        style={{ position: "absolute", bottom: 48, left: 48, width: JOY_BASE_R * 2, height: JOY_BASE_R * 2, borderRadius: "50%", background: "rgba(255,255,255,0.10)", border: "2px solid rgba(255,255,255,0.30)", touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
        onTouchStart={onJoyStart} onTouchMove={onJoyMove} onTouchEnd={onJoyEnd} onTouchCancel={onJoyEnd}
      >
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(calc(-50% + ${joyVis.x}px), calc(-50% + ${joyVis.y}px))`, width: JOY_THUMB_R * 2, height: JOY_THUMB_R * 2, borderRadius: "50%", background: "rgba(255,255,255,0.50)", border: "2px solid rgba(255,255,255,0.70)", transition: joyAtCenter ? "transform 0.14s ease-out" : "none", pointerEvents: "none" }} />
      </div>

      {/* Camera swipe area */}
      <div
        style={{ position: "absolute", top: 0, right: 0, width: "55%", height: "60%", touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
        onTouchStart={onCamStart} onTouchMove={onCamMove} onTouchEnd={onCamEnd} onTouchCancel={onCamEnd}
      />

      {/* Ammo display */}
      <div style={{ position: "absolute", bottom: 195, right: 52, pointerEvents: "none", textAlign: "right" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 2, marginBottom: 2 }}>AR</div>
        <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "monospace", color: ammoLow ? "#ff4444" : "#fff", textShadow: "0 2px 8px #000a", lineHeight: 1 }}>
          {String(ammo).padStart(2, "0")}
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginLeft: 3 }}>/{WEAPON_SPECS.ar.ammo}</span>
        </div>
        {reloading && <div style={{ fontSize: 11, fontWeight: 700, color: "#ffbb00", letterSpacing: 1, marginTop: 2 }}>RELOADING…</div>}
      </div>

      {/* Reload button */}
      <div
        onTouchStart={onReload} onTouchEnd={e => e.stopPropagation()}
        style={{ position: "absolute", bottom: 135, right: 62, width: 64, height: 64, borderRadius: "50%", background: reloading ? "rgba(255,187,0,0.30)" : "rgba(255,255,255,0.18)", border: `2px solid ${reloading ? "rgba(255,187,0,0.7)" : "rgba(255,255,255,0.45)"}`, display: "flex", alignItems: "center", justifyContent: "center", touchAction: "none", userSelect: "none", WebkitUserSelect: "none", opacity: reloading ? 0.5 : 1 }}
      >
        <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>RELOAD</span>
      </div>

      {/* Fire button */}
      <div
        onTouchStart={onFireStart} onTouchEnd={onFireEnd} onTouchCancel={onFireEnd}
        style={{ position: "absolute", bottom: 48, right: 48, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,60,60,0.30)", border: "3px solid rgba(255,80,80,0.70)", display: "flex", alignItems: "center", justifyContent: "center", touchAction: "none", userSelect: "none", WebkitUserSelect: "none", boxShadow: "0 0 18px rgba(255,60,60,0.25)" }}
      >
        <span style={{ fontSize: 11, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>FIRE</span>
      </div>
    </div>
  );
}
