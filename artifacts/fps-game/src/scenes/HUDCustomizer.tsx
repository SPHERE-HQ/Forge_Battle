import { useCallback, useRef, useState } from "react";
import type { HUDSettings, HUDElementPos } from "../game/hudSettings";
import { DEFAULT_HUD } from "../game/hudSettings";
import { FONT_PRIMARY, FONT_NARROW } from "../constants/game";

// ─── Element metadata ─────────────────────────────────────────────────────────
const ELEMENTS: { key: keyof HUDSettings; label: string; color: string; mobileOnly?: boolean }[] = [
  { key: "minimap",        label: "MINIMAP",     color: "#00ccff" },
  { key: "healthBar",      label: "HP BAR",      color: "#44ff88" },
  { key: "ammo",           label: "AMMO",        color: "#ffcc00" },
  { key: "scoreTimer",     label: "SKOR / TIMER",color: "#ffffff" },
  { key: "killFeed",       label: "KILL FEED",   color: "#ff9900" },
  { key: "fireButton",     label: "TOMBOL TEMBAK",color: "#ff4444", mobileOnly: true },
  { key: "interactButton", label: "TOMBOL E",    color: "#ff8800", mobileOnly: true },
];

interface Props {
  settings:  HUDSettings;
  isMobile:  boolean;
  onSave:    (s: HUDSettings) => void;
  onClose:   () => void;
}

export default function HUDCustomizer({ settings, isMobile, onSave, onClose }: Props) {
  const [cur, setCur] = useState<HUDSettings>({ ...settings,
    minimap:        { ...settings.minimap        },
    healthBar:      { ...settings.healthBar      },
    ammo:           { ...settings.ammo           },
    scoreTimer:     { ...settings.scoreTimer     },
    killFeed:       { ...settings.killFeed       },
    fireButton:     { ...settings.fireButton     },
    interactButton: { ...settings.interactButton },
  });

  const dragging   = useRef<keyof HUDSettings | null>(null);
  const dragOffset = useRef({ dx: 0, dy: 0 });

  // ── Drag handlers ────────────────────────────────────────────────────────────
  const onPointerDown = useCallback((key: keyof HUDSettings, e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = key;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffset.current = {
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
    };
    e.stopPropagation();
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const key   = dragging.current;
    const newX  = Math.min(95, Math.max(0, ((e.clientX - dragOffset.current.dx) / window.innerWidth)  * 100));
    const newY  = Math.min(92, Math.max(0, ((e.clientY - dragOffset.current.dy) / window.innerHeight) * 100));
    setCur(prev => ({
      ...prev,
      [key]: { ...prev[key], x: newX, y: newY },
    }));
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  const setScale = useCallback((key: keyof HUDSettings, scale: number) => {
    setCur(prev => ({ ...prev, [key]: { ...prev[key], scale } }));
  }, []);

  const handleReset = () => setCur({
    minimap:        { ...DEFAULT_HUD.minimap        },
    healthBar:      { ...DEFAULT_HUD.healthBar      },
    ammo:           { ...DEFAULT_HUD.ammo           },
    scoreTimer:     { ...DEFAULT_HUD.scoreTimer     },
    killFeed:       { ...DEFAULT_HUD.killFeed       },
    fireButton:     { ...DEFAULT_HUD.fireButton     },
    interactButton: { ...DEFAULT_HUD.interactButton },
  });

  const visibleElements = ELEMENTS.filter(el => !el.mobileOnly || isMobile);

  return (
    <div
      style={{
        position:     "fixed", inset: 0, zIndex: 200,
        background:   "rgba(0,0,0,0.72)",
        touchAction:  "none",
        userSelect:   "none",
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <div style={{
        position:   "fixed", top: "clamp(8px,1.5vh,14px)", left: "50%",
        transform:  "translateX(-50%)", zIndex: 201,
        background: "rgba(0,20,40,0.9)", border: "1px solid rgba(0,200,255,0.4)",
        borderRadius: 5, padding: "6px 20px",
        fontFamily: FONT_NARROW, fontSize: "clamp(10px,1.5vw,13px)",
        color: "#00ccff", letterSpacing: "0.25em",
        pointerEvents: "none",
      }}>
        ATUR POSISI HUD — SERET UNTUK PINDAH
      </div>

      {/* ── Draggable element boxes ────────────────────────────────────────── */}
      {visibleElements.map(({ key, label, color }) => {
        const pos = cur[key];
        return (
          <DragBox
            key={key}
            label={label}
            color={color}
            pos={pos}
            onPointerDown={(e) => onPointerDown(key, e)}
            onScaleChange={(v) => setScale(key, v)}
          />
        );
      })}

      {/* ── Bottom controls ───────────────────────────────────────────────── */}
      <div style={{
        position:   "fixed", bottom: "clamp(14px,2.5vh,22px)", left: "50%",
        transform:  "translateX(-50%)",
        display:    "flex", gap: "clamp(8px,2vw,16px)",
        zIndex:     202,
      }}>
        <HUDBtn color="#888" onClick={handleReset}>RESET</HUDBtn>
        <HUDBtn color="#555" onClick={onClose}>BATAL</HUDBtn>
        <HUDBtn color="#00ccff" onClick={() => { onSave(cur); onClose(); }}>SIMPAN</HUDBtn>
      </div>
    </div>
  );
}

// ─── Draggable box ────────────────────────────────────────────────────────────
function DragBox({
  label, color, pos, onPointerDown, onScaleChange,
}: {
  label:          string;
  color:          string;
  pos:            HUDElementPos;
  onPointerDown:  (e: React.PointerEvent<HTMLDivElement>) => void;
  onScaleChange:  (v: number) => void;
}) {
  const SCALE_OPTIONS = [0.75, 1.0, 1.25, 1.5];
  const curScale = Math.round(pos.scale * 100) / 100;

  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position:    "fixed",
        left:        `${pos.x}vw`,
        top:         `${pos.y}vh`,
        zIndex:      201,
        cursor:      "grab",
        touchAction: "none",
        userSelect:  "none",
      }}
    >
      {/* Label chip */}
      <div style={{
        background:   `${color}22`,
        border:       `1.5px solid ${color}99`,
        borderRadius: 4,
        padding:      "clamp(4px,1vw,8px) clamp(8px,1.5vw,14px)",
        minWidth:     "clamp(80px,14vw,130px)",
      }}>
        <div style={{
          fontFamily:    FONT_NARROW,
          fontSize:      "clamp(9px,1.3vw,11px)",
          color:         color,
          letterSpacing: "0.18em",
          marginBottom:  4,
          textAlign:     "center",
        }}>{label}</div>

        {/* Scale buttons */}
        <div style={{ display: "flex", gap: 3, justifyContent: "center" }}
          onPointerDown={e => e.stopPropagation()}>
          {SCALE_OPTIONS.map(v => (
            <button
              key={v}
              onClick={() => onScaleChange(v)}
              style={{
                padding:      "2px 6px",
                borderRadius: 3,
                border:       `1px solid ${Math.abs(curScale - v) < 0.01 ? color : color + "44"}`,
                background:   Math.abs(curScale - v) < 0.01 ? `${color}33` : "transparent",
                color:        Math.abs(curScale - v) < 0.01 ? color : color + "88",
                fontFamily:   FONT_NARROW,
                fontSize:     "clamp(8px,1.1vw,10px)",
                cursor:       "pointer",
              }}
            >
              {v === 0.75 ? "S" : v === 1.0 ? "M" : v === 1.25 ? "L" : "XL"}
            </button>
          ))}
        </div>
      </div>

      {/* Drag handle hint */}
      <div style={{
        textAlign:     "center",
        fontFamily:    FONT_NARROW,
        fontSize:      "clamp(6px,0.9vw,8px)",
        color:         color + "66",
        letterSpacing: "0.12em",
        marginTop:     2,
        pointerEvents: "none",
      }}>✥ SERET</div>
    </div>
  );
}

// ─── Button helper ────────────────────────────────────────────────────────────
function HUDBtn({ color, onClick, children }: {
  color:    string;
  onClick:  () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:      "clamp(8px,1.5vh,12px) clamp(18px,3vw,28px)",
        background:   `${color}22`,
        border:       `1.5px solid ${color}88`,
        borderRadius: 4,
        color:        color,
        fontFamily:   FONT_PRIMARY,
        fontSize:     "clamp(10px,1.5vw,13px)",
        letterSpacing:"0.2em",
        cursor:       "pointer",
      }}
    >
      {children}
    </button>
  );
}
