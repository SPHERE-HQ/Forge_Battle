import { useState, useRef, useEffect } from "react";
import { savePlayer, PlayerData } from "./types/player";

interface Props {
  onSubmit: (player: PlayerData) => void;
}

export default function NicknameForm({ onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => inputRef.current?.focus(), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [visible]);

  function validate(v: string): string {
    if (v.length < 3) return "Minimum 3 karakter";
    if (v.length > 16) return "Maksimum 16 karakter";
    if (!/^[A-Za-z0-9_\-]+$/.test(v)) return "Hanya huruf, angka, _ dan -";
    return "";
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.slice(0, 16);
    setValue(v);
    if (error) setError(validate(v));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(value.trim());
    if (err) { setError(err); return; }
    const player = savePlayer(value.trim());
    onSubmit(player);
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse at 50% 60%, #1a0800 0%, #000 70%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Kenney Future', 'Arial Black', sans-serif",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.5s ease",
    }}>
      {/* Ambient fire glow top */}
      <div style={{
        position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "80vw", height: "35vh",
        background: "radial-gradient(ellipse at 50% 100%, #ff430044 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Scanlines overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
      }} />

      {/* Main card */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
        width: "min(520px, 90vw)",
        padding: "clamp(24px, 5vw, 48px) clamp(20px, 5vw, 48px)",
        background: "linear-gradient(160deg, rgba(30,10,0,0.95) 0%, rgba(10,5,0,0.98) 100%)",
        border: "1px solid rgba(255,120,0,0.25)",
        borderTop: "2px solid rgba(255,120,0,0.5)",
        boxShadow: "0 0 60px rgba(255,80,0,0.15), inset 0 1px 0 rgba(255,150,50,0.1)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: "opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s",
      }}>
        {/* Corner decorators */}
        <div style={{ position: "absolute", top: 8, left: 8, width: 16, height: 16, borderTop: "2px solid #ff6600", borderLeft: "2px solid #ff6600" }} />
        <div style={{ position: "absolute", top: 8, right: 8, width: 16, height: 16, borderTop: "2px solid #ff6600", borderRight: "2px solid #ff6600" }} />
        <div style={{ position: "absolute", bottom: 8, left: 8, width: 16, height: 16, borderBottom: "2px solid #ff6600", borderLeft: "2px solid #ff6600" }} />
        <div style={{ position: "absolute", bottom: 8, right: 8, width: 16, height: 16, borderBottom: "2px solid #ff6600", borderRight: "2px solid #ff6600" }} />

        {/* Logo */}
        <div style={{ marginBottom: "clamp(4px, 2vw, 12px)", textAlign: "center" }}>
          <div style={{
            fontSize: "clamp(11px, 2.5vw, 14px)",
            color: "#ff9944",
            letterSpacing: "0.4em",
            opacity: 0.8,
            marginBottom: 4,
          }}>SPHERE HQ PRESENTS</div>
          <div style={{
            fontSize: "clamp(26px, 6vw, 42px)",
            fontWeight: 900,
            color: "#ff8800",
            letterSpacing: "0.08em",
            lineHeight: 1,
            textShadow: "0 0 24px #ff4400, 0 0 60px #ff220055",
            fontFamily: "'Kenney Future', Impact, 'Arial Black', sans-serif",
          }}>FORGE ARENA</div>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", margin: "clamp(12px, 2.5vw, 20px) 0" }}>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(255,120,0,0.4))" }} />
          <div style={{ width: 5, height: 5, background: "#ff6600", transform: "rotate(45deg)" }} />
          <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, rgba(255,120,0,0.4))" }} />
        </div>

        {/* Heading */}
        <div style={{
          fontSize: "clamp(13px, 3vw, 17px)",
          color: "#ccaaff",
          letterSpacing: "0.25em",
          marginBottom: "clamp(16px, 3.5vw, 28px)",
          textAlign: "center",
          opacity: 0.9,
          fontFamily: "'Kenney Future Narrow', 'Arial', sans-serif",
        }}>MASUKKAN CODENAME KAMU</div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: "100%" }} autoComplete="off">
          <div style={{ position: "relative", marginBottom: "clamp(14px, 3vw, 22px)" }}>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleChange}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(e as unknown as React.FormEvent); }}
              placeholder="CODENAME..."
              maxLength={16}
              autoComplete="off"
              spellCheck={false}
              style={{
                width: "100%",
                padding: "clamp(12px, 2.5vw, 16px) clamp(14px, 3vw, 20px)",
                fontSize: "clamp(16px, 4vw, 22px)",
                fontFamily: "'Kenney Future', Impact, 'Arial Black', sans-serif",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "#fff",
                background: "rgba(255,100,0,0.06)",
                border: `2px solid ${error ? "#ff4444" : "rgba(255,100,0,0.35)"}`,
                borderRadius: 2,
                outline: "none",
                caretColor: "#ff8800",
                textAlign: "center",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxShadow: error
                  ? "0 0 16px rgba(255,50,50,0.2)"
                  : "0 0 0px transparent",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#ff6600";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(255,100,0,0.25)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error ? "#ff4444" : "rgba(255,100,0,0.35)";
                e.currentTarget.style.boxShadow = "0 0 0px transparent";
              }}
            />
            {/* Char counter */}
            <div style={{
              position: "absolute", right: 10, bottom: -20,
              fontSize: "clamp(9px, 2vw, 11px)",
              color: value.length >= 14 ? "#ff8844" : "rgba(255,255,255,0.3)",
              fontFamily: "'Kenney Future Narrow', monospace",
              letterSpacing: "0.1em",
            }}>{value.length}/16</div>
          </div>

          {/* Error message */}
          <div style={{
            minHeight: "clamp(16px, 3vw, 20px)",
            marginBottom: "clamp(10px, 2.5vw, 16px)",
            textAlign: "center",
            fontSize: "clamp(10px, 2.5vw, 13px)",
            color: "#ff5555",
            fontFamily: "'Kenney Future Narrow', sans-serif",
            letterSpacing: "0.1em",
            opacity: error ? 1 : 0,
            transition: "opacity 0.2s",
          }}>{error || " "}</div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={value.trim().length < 3}
            style={{
              display: "block", width: "100%",
              padding: "clamp(12px, 3vw, 18px)",
              fontSize: "clamp(14px, 3.5vw, 19px)",
              fontFamily: "'Kenney Future', Impact, 'Arial Black', sans-serif",
              fontWeight: 900,
              letterSpacing: "0.18em",
              color: value.trim().length >= 3 ? "#fff" : "rgba(255,255,255,0.35)",
              background: value.trim().length >= 3
                ? "linear-gradient(135deg, #cc4400 0%, #ff7700 50%, #cc4400 100%)"
                : "rgba(80,40,0,0.4)",
              border: `2px solid ${value.trim().length >= 3 ? "#ff6600" : "rgba(255,100,0,0.2)"}`,
              borderRadius: 2,
              cursor: value.trim().length >= 3 ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              boxShadow: value.trim().length >= 3
                ? "0 0 24px rgba(255,100,0,0.35), inset 0 1px 0 rgba(255,200,100,0.2)"
                : "none",
              textShadow: value.trim().length >= 3 ? "0 0 12px #ff6600" : "none",
              backgroundSize: "200% 100%",
            }}
            onMouseEnter={(e) => {
              if (value.trim().length >= 3) {
                e.currentTarget.style.boxShadow = "0 0 36px rgba(255,120,0,0.55), inset 0 1px 0 rgba(255,200,100,0.3)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = value.trim().length >= 3
                ? "0 0 24px rgba(255,100,0,0.35), inset 0 1px 0 rgba(255,200,100,0.2)"
                : "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            onTouchStart={(e) => {
              if (value.trim().length >= 3) {
                e.currentTarget.style.transform = "scale(0.98)";
              }
            }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            MASUK KE ARENA
          </button>
        </form>

        {/* Note */}
        <div style={{
          marginTop: "clamp(14px, 3vw, 22px)",
          fontSize: "clamp(9px, 2vw, 11px)",
          color: "rgba(255,200,100,0.4)",
          textAlign: "center",
          fontFamily: "'Kenney Future Narrow', sans-serif",
          letterSpacing: "0.15em",
          lineHeight: 1.6,
        }}>
          CODENAME TERSIMPAN DI PERANGKAT INI<br />
          3–16 KARAKTER · HURUF, ANGKA, _ DAN -
        </div>
      </div>
    </div>
  );
}
