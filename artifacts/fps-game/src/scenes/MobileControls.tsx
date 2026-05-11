import { useEffect, useRef, useCallback } from "react";
import type { InputState } from "../game/battleTypes";

// ─── Joystick constants ───────────────────────────────────────────────────────
const STICK_OUTER_R  = 55;
const STICK_INNER_R  = 24;
const STICK_OPACITY  = 0.55;
const DEAD_ZONE      = 0.12;
const LOOK_SENS      = 0.004;

interface Props {
  onInput: (inp: Partial<InputState>) => void;
}

export default function MobileControls({ onInput }: Props) {
  const canvasRef     = useRef<HTMLCanvasElement>(null);

  // Left stick state
  const leftActive    = useRef(false);
  const leftOrigin    = useRef({ x: 0, y: 0 });
  const leftCurrent   = useRef({ x: 0, y: 0 });
  const leftTouchId   = useRef(-1);

  // Right area (look) state
  const rightActive   = useRef(false);
  const rightLast     = useRef({ x: 0, y: 0 });
  const rightTouchId  = useRef(-1);

  const LEFT_THRESHOLD_X  = typeof window !== "undefined" ? window.innerWidth * 0.45 : 400;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (leftActive.current) {
      const ox = leftOrigin.current.x;
      const oy = leftOrigin.current.y;
      const cx = leftCurrent.current.x;
      const cy = leftCurrent.current.y;

      // Outer ring
      ctx.beginPath();
      ctx.arc(ox, oy, STICK_OUTER_R, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${STICK_OPACITY})`;
      ctx.lineWidth   = 2;
      ctx.stroke();
      ctx.fillStyle   = `rgba(255,255,255,${STICK_OPACITY * 0.15})`;
      ctx.fill();

      // Inner knob
      ctx.beginPath();
      ctx.arc(cx, cy, STICK_INNER_R, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${STICK_OPACITY + 0.15})`;
      ctx.fill();
    }
  }, []);

  // Push move input from stick position
  const pushMoveInput = useCallback(() => {
    if (!leftActive.current) {
      onInput({ moveX: 0, moveZ: 0 });
      return;
    }
    const dx = leftCurrent.current.x - leftOrigin.current.x;
    const dy = leftCurrent.current.y - leftOrigin.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < DEAD_ZONE * STICK_OUTER_R) {
      onInput({ moveX: 0, moveZ: 0 });
      return;
    }
    const norm = Math.min(dist / STICK_OUTER_R, 1);
    const nx = (dx / dist) * norm;
    const ny = (dy / dist) * norm;
    onInput({ moveX: nx, moveZ: -ny });
  }, [onInput]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      for (const touch of Array.from(e.changedTouches)) {
        if (touch.clientX < LEFT_THRESHOLD_X && leftTouchId.current === -1) {
          leftActive.current    = true;
          leftTouchId.current   = touch.identifier;
          leftOrigin.current    = { x: touch.clientX, y: touch.clientY };
          leftCurrent.current   = { x: touch.clientX, y: touch.clientY };
        } else if (touch.clientX >= LEFT_THRESHOLD_X && rightTouchId.current === -1) {
          rightActive.current   = true;
          rightTouchId.current  = touch.identifier;
          rightLast.current     = { x: touch.clientX, y: touch.clientY };
        }
      }
      draw();
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      for (const touch of Array.from(e.changedTouches)) {
        if (touch.identifier === leftTouchId.current) {
          const dx     = touch.clientX - leftOrigin.current.x;
          const dy     = touch.clientY - leftOrigin.current.y;
          const dist   = Math.sqrt(dx * dx + dy * dy);
          const capped = Math.min(dist, STICK_OUTER_R);
          const ax     = dist > 0 ? (dx / dist) * capped : 0;
          const ay     = dist > 0 ? (dy / dist) * capped : 0;
          leftCurrent.current = {
            x: leftOrigin.current.x + ax,
            y: leftOrigin.current.y + ay,
          };
          pushMoveInput();
          draw();
        } else if (touch.identifier === rightTouchId.current) {
          const ddx = touch.clientX - rightLast.current.x;
          const ddy = touch.clientY - rightLast.current.y;
          rightLast.current = { x: touch.clientX, y: touch.clientY };
          onInput({
            deltaYaw:   -ddx * LOOK_SENS,
            deltaPitch:  ddy * LOOK_SENS,
          });
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (const touch of Array.from(e.changedTouches)) {
        if (touch.identifier === leftTouchId.current) {
          leftActive.current   = false;
          leftTouchId.current  = -1;
          onInput({ moveX: 0, moveZ: 0 });
          draw();
        } else if (touch.identifier === rightTouchId.current) {
          rightActive.current  = false;
          rightTouchId.current = -1;
        }
      }
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove",  onTouchMove,  { passive: false });
    canvas.addEventListener("touchend",   onTouchEnd,   { passive: false });
    canvas.addEventListener("touchcancel",onTouchEnd,   { passive: false });

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove",  onTouchMove);
      canvas.removeEventListener("touchend",   onTouchEnd);
      canvas.removeEventListener("touchcancel",onTouchEnd);
    };
  }, [draw, onInput, pushMoveInput, LEFT_THRESHOLD_X]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      "fixed",
        inset:         0,
        zIndex:        45,
        pointerEvents: "auto",
        touchAction:   "none",
      }}
    />
  );
}
