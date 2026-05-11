import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { BattleEngine } from "../game/BattleEngine";
import BattleHUD from "./BattleHUD";
import MobileControls from "./MobileControls";
import MAP_LAYOUT from "../game/mapLayout";
import { CHARACTERS } from "../constants/game";
import type { BattleConfig, BattleState, InputState } from "../game/battleTypes";

// ─── Three.js constants ───────────────────────────────────────────────────────
const CAM_FOV         = 60;
const CAM_NEAR        = 0.08;
const CAM_FAR         = 300;
const CAM_DIST        = 5.2;
const CAM_HEIGHT      = 2.4;
const CAM_SMOOTH      = 10;
const GROUND_SIZE     = 240;
const PIXEL_RATIO_CAP = 2;
const HUD_SYNC_HZ     = 0.033;
const BULLET_POOL_SZ  = 40;
const BOT_CAPSULE_H   = 1.8;
const BOT_CAPSULE_R   = 0.28;
const MACHINE_W       = 1.2;
const MACHINE_H       = 2.6;
const MOUSE_SENS      = 0.0025;

// ─── Colors ───────────────────────────────────────────────────────────────────
const CLR_BLUE_BOT  = 0x4488ff;
const CLR_RED_BOT   = 0xff4444;
const CLR_BLUE_MACH = 0x2255ff;
const CLR_RED_MACH  = 0xff2222;
const CLR_GROUND    = 0x4a7c59;
const CLR_SKY       = 0x7ec8e3;
const CLR_FOG       = 0x7ec8e3;
const CLR_SUN       = 0xfff5e0;
const CLR_AMBIENT   = 0x8899bb;
const CLR_FILL      = 0xaaccff;
const CLR_BULLET    = 0xffff88;

const CORE_BOX_CLR: Record<string, number> = {
  red:    0xff3333,
  yellow: 0xffcc00,
  green:  0x33cc66,
  blue:   0x3388ff,
  purple: 0xaa44ff,
  black:  0x555566,
};

// ─── Audio helper ─────────────────────────────────────────────────────────────
function playAudio(src: string, volume = 0.6) {
  try {
    const a = new Audio(src);
    a.volume = volume;
    a.play().catch(() => {});
  } catch { /* ignore */ }
}

interface Props {
  config: BattleConfig;
  onEnd:  (won: boolean) => void;
}

export default function BattleScene({ config, onEnd }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const engineRef  = useRef<BattleEngine | null>(null);
  const inputRef   = useRef<InputState>({
    moveX: 0, moveZ: 0, deltaYaw: 0, deltaPitch: 0,
    fire: false, interact: false, sprint: false,
  });
  const keysRef    = useRef(new Set<string>());
  const endedRef   = useRef(false);

  const [hudState, setHudState] = useState<BattleState | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => { setIsMobile("ontouchstart" in window); }, []);

  const handleMobileInput = useCallback((inp: Partial<InputState>) => {
    Object.assign(inputRef.current, inp);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, PIXEL_RATIO_CAP));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace  = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(CLR_SKY);
    scene.fog        = new THREE.Fog(CLR_FOG, 60, 200);

    const camera = new THREE.PerspectiveCamera(CAM_FOV, 1, CAM_NEAR, CAM_FAR);

    // ── Lights ────────────────────────────────────────────────────────────────
    const sun = new THREE.DirectionalLight(CLR_SUN, 2.2);
    sun.position.set(30, 50, 20);
    sun.castShadow              = true;
    sun.shadow.mapSize.width    = 2048;
    sun.shadow.mapSize.height   = 2048;
    sun.shadow.camera.near      = 1;
    sun.shadow.camera.far       = 160;
    sun.shadow.camera.left      = -80;
    sun.shadow.camera.right     = 80;
    sun.shadow.camera.top       = 80;
    sun.shadow.camera.bottom    = -80;
    scene.add(sun);
    scene.add(new THREE.AmbientLight(CLR_AMBIENT, 0.85));
    const fill = new THREE.DirectionalLight(CLR_FILL, 0.45);
    fill.position.set(-20, 10, -15);
    scene.add(fill);

    // ── Ground ────────────────────────────────────────────────────────────────
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE, 1, 1),
      new THREE.MeshLambertMaterial({ color: CLR_GROUND }),
    );
    ground.rotation.x    = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ── Grid lines (subtle orientation) ───────────────────────────────────────
    const gridHelper = new THREE.GridHelper(GROUND_SIZE, 24, 0x000000, 0x000000);
    (gridHelper.material as THREE.LineBasicMaterial).opacity    = 0.06;
    (gridHelper.material as THREE.LineBasicMaterial).transparent = true;
    scene.add(gridHelper);

    // ── Engine ────────────────────────────────────────────────────────────────
    const engine = new BattleEngine(config);
    engineRef.current = engine;

    // ── Builder machines ──────────────────────────────────────────────────────
    function makeMachine(pos: { x: number; z: number }, color: number) {
      const g   = new THREE.Group();
      const geo = new THREE.BoxGeometry(MACHINE_W, MACHINE_H, MACHINE_W);
      const mat = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.35 });
      const m   = new THREE.Mesh(geo, mat);
      m.position.y = MACHINE_H / 2;
      m.castShadow = true;
      g.add(m);
      // Glow ring on top
      const ringGeo = new THREE.TorusGeometry(0.8, 0.06, 8, 20);
      const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 });
      const ring    = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = MACHINE_H + 0.15;
      g.add(ring);
      const light = new THREE.PointLight(color, 2.5, 10);
      light.position.set(0, MACHINE_H, 0);
      g.add(light);
      g.position.set(pos.x, 0, pos.z);
      return { g, ring, light };
    }
    const blueM = makeMachine(MAP_LAYOUT.blueMachinePos, CLR_BLUE_MACH);
    const redM  = makeMachine(MAP_LAYOUT.redMachinePos,  CLR_RED_MACH);
    scene.add(blueM.g);
    scene.add(redM.g);

    // ── Core boxes ────────────────────────────────────────────────────────────
    const coreBoxMeshes = new Map<string, THREE.Mesh>();
    for (const box of engine.state.coreBoxes) {
      const col  = CORE_BOX_CLR[box.color] ?? 0xffffff;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.45, 0.45),
        new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.5 }),
      );
      mesh.position.set(box.pos.x, box.pos.y, box.pos.z);
      mesh.castShadow = true;
      scene.add(mesh);
      coreBoxMeshes.set(box.id, mesh);
    }

    // ── Bot meshes ────────────────────────────────────────────────────────────
    const botMeshes = new Map<string, THREE.Group>();
    function makeBotMesh(team: "blue" | "red") {
      const color = team === "blue" ? CLR_BLUE_BOT : CLR_RED_BOT;
      const g     = new THREE.Group();
      const mat   = new THREE.MeshLambertMaterial({ color });
      // Body
      const body  = new THREE.Mesh(
        new THREE.CylinderGeometry(BOT_CAPSULE_R, BOT_CAPSULE_R, BOT_CAPSULE_H - BOT_CAPSULE_R * 2, 8),
        mat,
      );
      body.position.y = BOT_CAPSULE_H / 2;
      body.castShadow = true;
      g.add(body);
      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(BOT_CAPSULE_R, 8, 8), mat);
      head.position.y = BOT_CAPSULE_H;
      head.castShadow = true;
      g.add(head);
      // Team indicator cone
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.11, 0.3, 6),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }),
      );
      cone.position.y = BOT_CAPSULE_H + BOT_CAPSULE_R + 0.2;
      g.add(cone);
      return g;
    }
    for (const bot of engine.state.bots) {
      const m = makeBotMesh(bot.team);
      botMeshes.set(bot.id, m);
      scene.add(m);
    }

    // ── Player group ──────────────────────────────────────────────────────────
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);
    const playerChar = CHARACTERS.find(c => c.id === config.playerCharacterId);
    const loader     = new GLTFLoader();
    if (playerChar?.modelPath) {
      loader.load(playerChar.modelPath, (gltf) => {
        const model  = gltf.scene;
        const rawBox = new THREE.Box3().setFromObject(model);
        const h      = rawBox.getSize(new THREE.Vector3()).y;
        if (h > 0) model.scale.setScalar(1.8 / h);
        const box2 = new THREE.Box3().setFromObject(model);
        model.position.y = -box2.min.y;
        model.traverse(o => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
        playerGroup.add(model);
      });
    } else {
      const placeholder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 1.8, 8),
        new THREE.MeshLambertMaterial({ color: CLR_BLUE_BOT }),
      );
      placeholder.position.y = 0.9;
      playerGroup.add(placeholder);
    }

    // ── Bullet trail pool ─────────────────────────────────────────────────────
    const bulletLines: THREE.Line[] = [];
    for (let i = 0; i < BULLET_POOL_SZ; i++) {
      const pts = [new THREE.Vector3(), new THREE.Vector3()];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: CLR_BULLET, transparent: true, opacity: 0.8 });
      const ln  = new THREE.Line(geo, mat);
      ln.visible = false;
      scene.add(ln);
      bulletLines.push(ln);
    }

    // ── Load buildings ────────────────────────────────────────────────────────
    for (const b of MAP_LAYOUT.buildings) {
      loader.load(`/assets/environment/buildings/${b.glb}`, (gltf) => {
        const m = gltf.scene;
        m.scale.setScalar(b.scale);
        m.rotation.y = b.rotY;
        m.position.set(b.pos.x, 0, b.pos.z);
        m.traverse(o => {
          if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; }
        });
        scene.add(m);
      }, undefined, () => {});
    }

    // ── Load props ────────────────────────────────────────────────────────────
    for (const p of MAP_LAYOUT.props) {
      loader.load(`/assets/environment/props/${p.glb}`, (gltf) => {
        const m = gltf.scene;
        m.scale.setScalar(p.scale);
        m.rotation.y = p.rotY;
        m.position.set(p.pos.x, 0, p.pos.z);
        m.traverse(o => {
          if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; }
        });
        scene.add(m);
      }, undefined, () => {});
    }

    // ── Keyboard input ────────────────────────────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (e.code === "KeyE") inputRef.current.interact = true;
      if (e.code === "KeyR") {
        // Force reload via engine (future: expose method)
        // For now, fire with 0 ammo triggers auto-reload
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
      if (e.code === "KeyE") inputRef.current.interact = false;
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup",   onKeyUp);

    // ── Mouse (pointer lock) ──────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === canvas) {
        inputRef.current.deltaYaw   += -e.movementX * MOUSE_SENS;
        inputRef.current.deltaPitch +=  e.movementY * MOUSE_SENS;
      }
    };
    const onClick = () => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      } else {
        inputRef.current.fire = true;
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement === canvas && e.button === 0) {
        inputRef.current.fire = true;
      }
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) inputRef.current.fire = false;
    };
    document.addEventListener("mousemove",  onMouseMove);
    canvas.addEventListener("click",       onClick);
    canvas.addEventListener("mousedown",   onMouseDown);
    window.addEventListener("mouseup",    onMouseUp);
    canvas.addEventListener("contextmenu", e => e.preventDefault());

    // ── Resize ────────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(canvas);

    // ── Camera tracking vars ──────────────────────────────────────────────────
    let camX      = MAP_LAYOUT.playerSpawn.x - 5;
    let camZ      = MAP_LAYOUT.playerSpawn.z - 5;
    const lookAt  = new THREE.Vector3();
    let hudTimer  = 0;
    let bulletIdx = 0;
    let prevTime  = 0;
    const clock   = new THREE.Clock();

    // ── Audio tracking ────────────────────────────────────────────────────────
    let prevBluekills  = 0;
    let prevRedKills   = 0;
    let prevAmmo       = engine.state.playerAmmo;
    let prevPhase      = engine.state.phase;
    let footstepTimer  = 0;
    let footstepStep   = 0;

    // ── Render loop ───────────────────────────────────────────────────────────
    let raf: number;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t  = clock.getElapsedTime();
      const dt = Math.min(t - prevTime, 0.08);
      prevTime = t;

      // Build keyboard move input
      const inp = inputRef.current;
      inp.moveZ = 0; inp.moveX = 0;
      const keys = keysRef.current;
      if (keys.has("KeyW") || keys.has("ArrowUp"))    inp.moveZ =  1;
      if (keys.has("KeyS") || keys.has("ArrowDown"))  inp.moveZ = -1;
      if (keys.has("KeyA") || keys.has("ArrowLeft"))  inp.moveX = -1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) inp.moveX =  1;
      inp.sprint = keys.has("ShiftLeft") || keys.has("ShiftRight");
      if (!keys.has("Space") && !keys.has("KeyF") && document.pointerLockElement !== canvas) {
        // fire only set by mouse events in pointer-lock mode
      }

      engine.update(dt, inp);
      const state = engine.state;

      // Reset per-frame deltas
      inp.deltaYaw   = 0;
      inp.deltaPitch = 0;

      // ── Audio events ───────────────────────────────────────────────────────
      if (state.playerAmmo < prevAmmo && !state.isReloading) {
        const w = state.playerWeaponId;
        if (w.includes("pistol"))  playAudio("/assets/sfx/weapons/pistol_fire.mp3", 0.5);
        else if (w.includes("smg")) playAudio("/assets/sfx/weapons/smg_fire.mp3",   0.4);
        else if (w.includes("ar") || w === "ak74") playAudio("/assets/sfx/weapons/ar_fire.mp3", 0.5);
        else if (w.includes("shotgun")) playAudio("/assets/sfx/weapons/shotgun_fire.mp3", 0.6);
        else if (w.includes("sniper"))  playAudio("/assets/sfx/weapons/pistol_fire.mp3",  0.7);
        else if (w.includes("heavy"))   playAudio("/assets/sfx/weapons/heavy_fire.mp3",   0.7);
      }
      prevAmmo = state.playerAmmo;

      // Kill sounds
      if (state.blueKills > prevBluekills) playAudio("/assets/sfx/game/kill.mp3", 0.8);
      prevBluekills = state.blueKills;
      prevRedKills  = state.redKills;

      // Footsteps
      const isMoving = Math.abs(inp.moveX) > 0.05 || Math.abs(inp.moveZ) > 0.05;
      if (isMoving) {
        footstepTimer -= dt;
        if (footstepTimer <= 0) {
          footstepTimer = 0.42;
          footstepStep  = (footstepStep + 1) % 3;
          playAudio(`/assets/sfx/game/footstep${footstepStep + 1}.mp3`, 0.3);
        }
      } else {
        footstepTimer = 0;
      }

      // Win/lose sound (once)
      if (state.phase !== prevPhase && state.phase !== "playing" && !endedRef.current) {
        endedRef.current = true;
        setTimeout(() => {
          if (state.phase === "won") playAudio("/assets/sfx/game/win.mp3", 0.7);
          else                       playAudio("/assets/sfx/game/lose.mp3", 0.7);
        }, 500);
      }
      prevPhase = state.phase;

      // ── Player ─────────────────────────────────────────────────────────────
      playerGroup.position.set(state.playerPos.x, 0, state.playerPos.z);
      playerGroup.rotation.y = state.playerYaw;

      // ── Camera follow ──────────────────────────────────────────────────────
      const yaw     = state.cameraYaw;
      const pitch   = state.cameraPitch;
      const cosP    = Math.cos(pitch);
      const tgtX    = state.playerPos.x - Math.sin(yaw) * cosP * CAM_DIST;
      const tgtY    = CAM_HEIGHT + Math.sin(pitch) * CAM_DIST;
      const tgtZ    = state.playerPos.z - Math.cos(yaw) * cosP * CAM_DIST;
      const alpha   = Math.min(CAM_SMOOTH * dt, 1);
      camX         += (tgtX - camX) * alpha;
      camZ         += (tgtZ - camZ) * alpha;
      camera.position.set(camX, tgtY, camZ);
      lookAt.set(state.playerPos.x, 1.1, state.playerPos.z);
      camera.lookAt(lookAt);

      // ── Bots ───────────────────────────────────────────────────────────────
      for (const bot of state.bots) {
        const m = botMeshes.get(bot.id);
        if (!m) continue;
        const dead = bot.aiState === "dead";
        m.visible  = !dead;
        if (!dead) {
          m.position.set(bot.pos.x, 0, bot.pos.z);
          m.rotation.y = bot.yaw;
        }
      }

      // ── Core boxes ─────────────────────────────────────────────────────────
      for (const box of state.coreBoxes) {
        const m = coreBoxMeshes.get(box.id);
        if (!m) continue;
        m.visible = !box.collected;
        if (!box.collected) {
          m.rotation.y = t * 1.5;
          m.position.y = box.pos.y + Math.sin(t * 2 + box.pos.x) * 0.08;
        }
      }

      // ── Machine pulse ──────────────────────────────────────────────────────
      const pulse = (Math.sin(t * 2.8) + 1) * 0.5;
      blueM.light.intensity = 1.5 + pulse;
      redM.light.intensity  = 1.5 + pulse;
      blueM.ring.rotation.z = t * 0.8;
      redM.ring.rotation.z  = -t * 0.8;

      // ── Bullet trails ──────────────────────────────────────────────────────
      for (const ln of bulletLines) ln.visible = false;
      bulletIdx = 0;
      for (const bullet of state.bullets) {
        if (bulletIdx >= BULLET_POOL_SZ) break;
        const ln  = bulletLines[bulletIdx++];
        const geo = ln.geometry;
        const arr = geo.attributes.position?.array as Float32Array | undefined;
        if (!arr) continue;
        arr[0] = bullet.pos.x;
        arr[1] = bullet.pos.y;
        arr[2] = bullet.pos.z;
        arr[3] = bullet.pos.x + bullet.vel.x * 0.04;
        arr[4] = bullet.pos.y + bullet.vel.y * 0.04;
        arr[5] = bullet.pos.z + bullet.vel.z * 0.04;
        geo.attributes.position.needsUpdate = true;
        ln.visible = true;
      }

      // ── HUD sync ───────────────────────────────────────────────────────────
      hudTimer -= dt;
      if (hudTimer <= 0 || state.phase !== "playing") {
        hudTimer = HUD_SYNC_HZ;
        setHudState({
          ...state,
          bots:      [...state.bots.map(b => ({ ...b, pos: { ...b.pos } }))],
          bullets:   [...state.bullets],
          coreBoxes: [...state.coreBoxes],
          killFeed:  [...state.killFeed],
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("keydown",    onKeyDown);
      document.removeEventListener("keyup",      onKeyUp);
      document.removeEventListener("mousemove",  onMouseMove);
      canvas.removeEventListener("click",        onClick);
      canvas.removeEventListener("mousedown",    onMouseDown);
      window.removeEventListener("mouseup",     onMouseUp);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      renderer.dispose();
    };
  }, [config]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }}
      />

      {hudState && (
        <BattleHUD
          state={hudState}
          config={config}
          onEnd={onEnd}
          onMobileInput={handleMobileInput}
          isMobile={isMobile}
        />
      )}

      {isMobile && (
        <MobileControls onInput={handleMobileInput} />
      )}

      {/* Click-to-lock hint (desktop, before pointer lock) */}
      {!isMobile && !hudState && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 30,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <div style={{
            background: "rgba(0,0,0,0.65)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 6,
            padding: "16px 28px",
            color: "#fff",
            fontFamily: "'Orbitron', monospace",
            fontSize: "clamp(10px,1.6vw,14px)",
            letterSpacing: "0.2em",
          }}>KLIK UNTUK MULAI</div>
        </div>
      )}
    </div>
  );
}
