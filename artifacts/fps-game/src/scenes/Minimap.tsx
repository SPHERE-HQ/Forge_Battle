import { useEffect, useRef } from "react";
import type { BattleState } from "../game/battleTypes";
import MAP_LAYOUT from "../game/mapLayout";

// ─── Minimap constants ────────────────────────────────────────────────────────
const MAP_REAL_HALF  = 54;
const MAP_SIZE_PX    = 110;
const SCALE          = MAP_SIZE_PX / (MAP_REAL_HALF * 2);

const CLR_BG         = "rgba(5,10,20,0.88)";
const CLR_BORDER     = "rgba(0,200,255,0.35)";
const CLR_GRID       = "rgba(255,255,255,0.06)";
const CLR_BUILDING   = "rgba(100,120,150,0.55)";
const CLR_PLAYER     = "#44ccff";
const CLR_ALLY       = "#2288ff";
const CLR_ENEMY      = "#ff3333";
const CLR_MACHINE_B  = "#2255ff";
const CLR_MACHINE_R  = "#ff2222";

const CORE_BOX_CLR: Record<string, string> = {
  red:    "#ff3333", yellow: "#ffcc00", green: "#33cc66",
  blue:   "#3388ff", purple: "#aa44ff", black: "#888899",
};

function toCanvas(worldX: number, worldZ: number): [number, number] {
  return [
    (worldX + MAP_REAL_HALF) * SCALE,
    (worldZ + MAP_REAL_HALF) * SCALE,
  ];
}

interface Props { state: BattleState }

export default function Minimap({ state }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rawCtx = canvas.getContext("2d");
    if (!rawCtx) return;
    const c = rawCtx;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const px  = MAP_SIZE_PX * dpr;

    if (canvas.width !== px) {
      canvas.width  = px;
      canvas.height = px;
      c.scale(dpr, dpr);
    }

    c.clearRect(0, 0, MAP_SIZE_PX, MAP_SIZE_PX);

    // ── Background ──────────────────────────────────────────────────────────
    c.fillStyle = CLR_BG;
    c.fillRect(0, 0, MAP_SIZE_PX, MAP_SIZE_PX);

    // ── Grid ────────────────────────────────────────────────────────────────
    c.strokeStyle = CLR_GRID;
    c.lineWidth   = 0.5;
    for (let i = 0; i <= 8; i++) {
      const v = (MAP_SIZE_PX / 8) * i;
      c.beginPath(); c.moveTo(v, 0); c.lineTo(v, MAP_SIZE_PX); c.stroke();
      c.beginPath(); c.moveTo(0, v); c.lineTo(MAP_SIZE_PX, v); c.stroke();
    }

    // ── Buildings ────────────────────────────────────────────────────────────
    c.fillStyle = CLR_BUILDING;
    for (const b of MAP_LAYOUT.buildings) {
      const [bx, bz] = toCanvas(b.pos.x, b.pos.z);
      const hw = b.halfW * SCALE;
      const hd = b.halfD * SCALE;
      c.fillRect(bx - hw, bz - hd, hw * 2, hd * 2);
    }

    // ── Builder machines ─────────────────────────────────────────────────────
    function drawMachine(wx: number, wz: number, color: string) {
      const [mx, mz] = toCanvas(wx, wz);
      c.fillStyle   = color;
      c.globalAlpha = 0.85;
      c.beginPath();
      c.arc(mx, mz, 5, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
    }
    drawMachine(MAP_LAYOUT.blueMachinePos.x, MAP_LAYOUT.blueMachinePos.z, CLR_MACHINE_B);
    drawMachine(MAP_LAYOUT.redMachinePos.x,  MAP_LAYOUT.redMachinePos.z,  CLR_MACHINE_R);

    // ── Core boxes ───────────────────────────────────────────────────────────
    for (const box of state.coreBoxes) {
      if (box.collected) continue;
      const [bx, bz] = toCanvas(box.pos.x, box.pos.z);
      c.fillStyle  = CORE_BOX_CLR[box.color] ?? "#ffffff";
      c.globalAlpha = 0.85;
      c.beginPath();
      c.rect(bx - 2, bz - 2, 4, 4);
      c.fill();
      c.globalAlpha = 1;
    }

    // ── Bots ────────────────────────────────────────────────────────────────
    for (const bot of state.bots) {
      if (bot.aiState === "dead") continue;
      const [bx, bz] = toCanvas(bot.pos.x, bot.pos.z);
      c.fillStyle   = bot.team === "blue" ? CLR_ALLY : CLR_ENEMY;
      c.globalAlpha = 0.9;
      c.beginPath();
      c.arc(bx, bz, 3.5, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
    }

    // ── Player ───────────────────────────────────────────────────────────────
    const [ppx, ppz] = toCanvas(state.playerPos.x, state.playerPos.z);
    c.fillStyle   = CLR_PLAYER;
    c.globalAlpha = 1;
    c.beginPath();
    c.arc(ppx, ppz, 5, 0, Math.PI * 2);
    c.fill();
    // Direction arrow
    c.save();
    c.translate(ppx, ppz);
    c.rotate(state.cameraYaw);
    c.fillStyle = CLR_PLAYER;
    c.beginPath();
    c.moveTo(0, -9);
    c.lineTo(-3, -5);
    c.lineTo(3, -5);
    c.closePath();
    c.fill();
    c.restore();

    // ── Border ──────────────────────────────────────────────────────────────
    c.strokeStyle = CLR_BORDER;
    c.lineWidth   = 1;
    c.strokeRect(0, 0, MAP_SIZE_PX, MAP_SIZE_PX);

  }, [state]);

  return (
    <div style={{
      position:     "fixed",
      bottom:       "clamp(14px,2.5vh,22px)",
      left:         "50%",
      transform:    "translateX(-50%)",
      zIndex:       48,
      borderRadius: 4,
      overflow:     "hidden",
      boxShadow:    "0 0 12px rgba(0,200,255,0.2)",
      border:       `1px solid ${CLR_BORDER}`,
    }}>
      <canvas
        ref={canvasRef}
        style={{ width: MAP_SIZE_PX, height: MAP_SIZE_PX, display: "block" }}
      />
    </div>
  );
}
