import { useState, useEffect } from "react";
import { PlayerData } from "./types/player";

interface Props {
  player: PlayerData;
  onSelectMode?: (mode: "offline" | "online" | "lan") => void;
}

interface ModeCard {
  id: "offline" | "online" | "lan";
  label: string;
  sub: string;
  icon: string;
  active: boolean;
  tag?: string;
}

const MODES: ModeCard[] = [
  {
    id: "offline",
    label: "OFFLINE",
    sub: "VS BOT",
    icon: "⚔",
    active: true,
  },
  {
    id: "online",
    label: "ONLINE",
    sub: "GLOBAL",
    icon: "🌐",
    active: false,
    tag: "SOON",
  },
  {
    id: "lan",
    label: "LAN",
    sub: "LOCAL NETWORK",
    icon: "📡",
    active: false,
    tag: "SOON",
  },
];

export default function MainMenu({ player, onSelectMode }: Props) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pressed, setPressed] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  function handleSelect(mode: ModeCard) {
    if (!mode.active) return;
    onSelectMode?.(mode.id);
  }

  function copyId() {
    navigator.clipboard.writeText(player.playerId).catch(() => {});
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 1500);
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse at 30% 70%, #1a0500 0%, #000 65%)",
      fontFamily: "'Kenney Future', 'Arial Black', sans-serif",
      display: "flex", flexDirection: "column",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.5s ease",
      overflow: "hidden",
    }}>
      {/* Scanlines */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 6px)",
      }} />
      {/* Bottom fire glow */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "40vh", pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 100%, rgba(255,80,0,0.12) 0%, transparent 70%)",
      }} />

      {/* ── TOP BAR ── */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "clamp(10px, 2.5vw, 18px) clamp(14px, 3.5vw, 28px)",
        borderBottom: "1px solid rgba(255,100,0,0.15)",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <div style={{
            fontSize: "clamp(7px, 1.5vw, 10px)",
            color: "rgba(255,150,50,0.6)",
            letterSpacing: "0.3em",
            marginBottom: 2,
          }}>SPHERE HQ</div>
          <div style={{
            fontSize: "clamp(16px, 4vw, 26px)",
            color: "#ff8800",
            letterSpacing: "0.06em",
            textShadow: "0 0 20px #ff4400",
            fontFamily: "'Kenney Future', Impact, sans-serif",
          }}>FORGE ARENA</div>
        </div>

        {/* Player button */}
        <button
          onClick={() => setShowProfile(true)}
          style={{
            display: "flex", alignItems: "center", gap: "clamp(6px, 1.5vw, 12px)",
            padding: "clamp(6px, 1.5vw, 10px) clamp(10px, 2.5vw, 18px)",
            background: "rgba(255,100,0,0.08)",
            border: "1px solid rgba(255,100,0,0.25)",
            borderRadius: 2, cursor: "pointer",
            transition: "background 0.2s, border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,100,0,0.15)";
            e.currentTarget.style.borderColor = "rgba(255,150,0,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,100,0,0.08)";
            e.currentTarget.style.borderColor = "rgba(255,100,0,0.25)";
          }}
        >
          {/* Avatar circle */}
          <div style={{
            width: "clamp(28px, 6vw, 40px)", height: "clamp(28px, 6vw, 40px)",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ff6600, #cc2200)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "clamp(13px, 2.8vw, 18px)", fontWeight: 900,
            color: "#fff", flexShrink: 0,
            boxShadow: "0 0 12px rgba(255,80,0,0.4)",
            fontFamily: "'Kenney Future', sans-serif",
          }}>
            {player.nickname[0].toUpperCase()}
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{
              fontSize: "clamp(11px, 2.5vw, 15px)",
              color: "#fff",
              letterSpacing: "0.06em",
              fontFamily: "'Kenney Future', sans-serif",
            }}>{player.nickname.toUpperCase()}</div>
            <div style={{
              fontSize: "clamp(9px, 1.8vw, 11px)",
              color: "rgba(255,180,80,0.6)",
              letterSpacing: "0.15em",
              fontFamily: "'Kenney Future Narrow', sans-serif",
            }}>ID: {player.playerId}</div>
          </div>
        </button>
      </div>

      {/* ── CENTER CONTENT ── */}
      <div style={{
        flex: 1, position: "relative", zIndex: 5,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "clamp(12px, 3vw, 32px) clamp(14px, 4vw, 40px)",
        gap: "clamp(10px, 3vh, 28px)",
      }}>
        {/* Section heading */}
        <div style={{ textAlign: "center", marginBottom: "clamp(4px, 1.5vh, 12px)" }}>
          <div style={{
            fontSize: "clamp(10px, 2vw, 13px)",
            color: "rgba(255,180,80,0.5)",
            letterSpacing: "0.4em",
            marginBottom: 4,
            fontFamily: "'Kenney Future Narrow', sans-serif",
          }}>PILIH MODE</div>
          <div style={{
            fontSize: "clamp(22px, 5.5vw, 38px)",
            color: "#fff",
            letterSpacing: "0.1em",
            textShadow: "0 0 30px rgba(255,120,0,0.4)",
          }}>SELECT MODE</div>
        </div>

        {/* Mode cards */}
        <div style={{
          display: "flex",
          flexDirection: "row",
          gap: "clamp(10px, 2.5vw, 22px)",
          width: "100%",
          maxWidth: 760,
          justifyContent: "center",
        }}>
          {MODES.map((mode) => {
            const isHovered = hovered === mode.id;
            const isPressed = pressed === mode.id;
            return (
              <button
                key={mode.id}
                disabled={!mode.active}
                onClick={() => handleSelect(mode)}
                onMouseEnter={() => mode.active && setHovered(mode.id)}
                onMouseLeave={() => { setHovered(null); setPressed(null); }}
                onMouseDown={() => mode.active && setPressed(mode.id)}
                onMouseUp={() => setPressed(null)}
                onTouchStart={() => mode.active && setPressed(mode.id)}
                onTouchEnd={() => { setPressed(null); if (mode.active) handleSelect(mode); }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  maxWidth: 220,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  padding: "clamp(14px, 3.5vw, 28px) clamp(10px, 2vw, 18px)",
                  position: "relative",
                  cursor: mode.active ? "pointer" : "not-allowed",
                  border: mode.active
                    ? `2px solid ${isHovered ? "#ff8800" : "rgba(255,100,0,0.4)"}`
                    : "2px solid rgba(255,255,255,0.08)",
                  borderTop: mode.active
                    ? `3px solid ${isHovered ? "#ffaa00" : "#ff6600"}`
                    : "3px solid rgba(255,255,255,0.1)",
                  background: mode.active
                    ? isPressed
                      ? "rgba(255,80,0,0.25)"
                      : isHovered
                        ? "rgba(255,80,0,0.15)"
                        : "rgba(255,60,0,0.07)"
                    : "rgba(255,255,255,0.03)",
                  boxShadow: mode.active && isHovered
                    ? "0 0 40px rgba(255,100,0,0.3), inset 0 1px 0 rgba(255,180,50,0.15)"
                    : mode.active
                      ? "0 0 20px rgba(255,80,0,0.1)"
                      : "none",
                  transform: isPressed ? "scale(0.97)" : isHovered ? "translateY(-2px)" : "none",
                  transition: "all 0.18s ease",
                  borderRadius: 2,
                  gap: "clamp(4px, 1.5vw, 10px)",
                  minHeight: "clamp(100px, 22vw, 170px)",
                }}
              >
                {/* Coming soon badge */}
                {mode.tag && (
                  <div style={{
                    position: "absolute", top: -1, right: -1,
                    background: "rgba(120,120,120,0.85)",
                    color: "#fff",
                    fontSize: "clamp(7px, 1.5vw, 9px)",
                    letterSpacing: "0.2em",
                    padding: "2px 8px",
                    fontFamily: "'Kenney Future Narrow', sans-serif",
                    zIndex: 2,
                  }}>SOON</div>
                )}

                {/* Icon */}
                <div style={{
                  fontSize: "clamp(24px, 6vw, 42px)",
                  lineHeight: 1,
                  filter: mode.active ? "none" : "grayscale(1) opacity(0.4)",
                }}>{mode.icon}</div>

                {/* Mode name */}
                <div style={{
                  fontSize: "clamp(14px, 3.8vw, 24px)",
                  fontWeight: 900,
                  letterSpacing: "0.1em",
                  color: mode.active ? (isHovered ? "#ffcc44" : "#ffaa22") : "rgba(255,255,255,0.25)",
                  textShadow: mode.active && isHovered ? "0 0 20px #ff8800" : "none",
                  fontFamily: "'Kenney Future', Impact, sans-serif",
                  lineHeight: 1,
                }}>{mode.label}</div>

                {/* Sub label */}
                <div style={{
                  fontSize: "clamp(8px, 1.8vw, 11px)",
                  letterSpacing: "0.25em",
                  color: mode.active ? "rgba(255,180,80,0.7)" : "rgba(255,255,255,0.15)",
                  fontFamily: "'Kenney Future Narrow', sans-serif",
                }}>{mode.sub}</div>

                {/* Active indicator */}
                {mode.active && (
                  <div style={{
                    position: "absolute", bottom: 6,
                    display: "flex", gap: 3, alignItems: "center",
                  }}>
                    <div style={{ width: "clamp(16px, 4vw, 28px)", height: 2, background: isHovered ? "#ffaa22" : "#ff6600", transition: "background 0.2s" }} />
                    <div style={{ width: 4, height: 4, background: isHovered ? "#ffcc44" : "#ff8800", transform: "rotate(45deg)", transition: "background 0.2s" }} />
                    <div style={{ width: "clamp(16px, 4vw, 28px)", height: 2, background: isHovered ? "#ffaa22" : "#ff6600", transition: "background 0.2s" }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Version tag */}
        <div style={{
          fontSize: "clamp(8px, 1.5vw, 10px)",
          color: "rgba(255,150,50,0.25)",
          letterSpacing: "0.3em",
          fontFamily: "'Kenney Future Narrow', sans-serif",
          marginTop: "clamp(4px, 1.5vh, 12px)",
        }}>FORGE ARENA v0.1 · ALPHA</div>
      </div>

      {/* ── PROFILE MODAL ── */}
      {showProfile && (
        <div
          onClick={() => setShowProfile(false)}
          style={{
            position: "absolute", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(420px, 90vw)",
              padding: "clamp(24px, 5vw, 40px)",
              background: "linear-gradient(160deg, #1a0800 0%, #0a0500 100%)",
              border: "1px solid rgba(255,120,0,0.3)",
              borderTop: "3px solid #ff6600",
              boxShadow: "0 0 60px rgba(255,80,0,0.2)",
              position: "relative",
            }}
          >
            {/* Corner decorators */}
            <div style={{ position: "absolute", top: 8, left: 8, width: 12, height: 12, borderTop: "2px solid #ff6600", borderLeft: "2px solid #ff6600" }} />
            <div style={{ position: "absolute", top: 8, right: 8, width: 12, height: 12, borderTop: "2px solid #ff6600", borderRight: "2px solid #ff6600" }} />
            <div style={{ position: "absolute", bottom: 8, left: 8, width: 12, height: 12, borderBottom: "2px solid #ff6600", borderLeft: "2px solid #ff6600" }} />
            <div style={{ position: "absolute", bottom: 8, right: 8, width: 12, height: 12, borderBottom: "2px solid #ff6600", borderRight: "2px solid #ff6600" }} />

            {/* Profile heading */}
            <div style={{
              fontSize: "clamp(10px, 2.5vw, 13px)",
              color: "rgba(255,180,80,0.5)",
              letterSpacing: "0.4em",
              marginBottom: "clamp(16px, 3.5vw, 28px)",
              fontFamily: "'Kenney Future Narrow', sans-serif",
              textAlign: "center",
            }}>PROFIL PEMAIN</div>

            {/* Avatar */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: "clamp(20px, 4vw, 32px)" }}>
              <div style={{
                width: "clamp(64px, 16vw, 90px)", height: "clamp(64px, 16vw, 90px)",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ff6600, #cc2200)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "clamp(28px, 7vw, 40px)", fontWeight: 900, color: "#fff",
                boxShadow: "0 0 30px rgba(255,80,0,0.5)",
                fontFamily: "'Kenney Future', sans-serif",
              }}>{player.nickname[0].toUpperCase()}</div>

              {/* Nickname */}
              <div style={{
                fontSize: "clamp(20px, 5vw, 32px)",
                color: "#ffaa22",
                letterSpacing: "0.08em",
                textShadow: "0 0 20px #ff6600",
                fontFamily: "'Kenney Future', Impact, sans-serif",
                textAlign: "center",
              }}>{player.nickname.toUpperCase()}</div>
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "clamp(16px, 3vw, 24px)" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,100,0,0.3)" }} />
              <div style={{ width: 4, height: 4, background: "#ff6600", transform: "rotate(45deg)" }} />
              <div style={{ flex: 1, height: 1, background: "rgba(255,100,0,0.3)" }} />
            </div>

            {/* Player ID */}
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: "clamp(9px, 2vw, 11px)",
                color: "rgba(255,180,80,0.5)",
                letterSpacing: "0.35em",
                marginBottom: 8,
                fontFamily: "'Kenney Future Narrow', sans-serif",
              }}>PLAYER ID</div>
              <button
                onClick={copyId}
                title="Tap untuk copy"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 22px",
                  background: "rgba(255,100,0,0.08)",
                  border: "1px solid rgba(255,100,0,0.3)",
                  borderRadius: 2, cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <span style={{
                  fontSize: "clamp(22px, 6vw, 36px)",
                  color: idCopied ? "#88ff88" : "#fff",
                  letterSpacing: "0.3em",
                  fontFamily: "'Kenney Future', monospace",
                  textShadow: idCopied ? "0 0 20px #44ff44" : "0 0 10px rgba(255,255,255,0.3)",
                  transition: "color 0.2s, text-shadow 0.2s",
                }}>{player.playerId}</span>
              </button>
              <div style={{
                fontSize: "clamp(8px, 1.8vw, 10px)",
                color: idCopied ? "#88ff88" : "rgba(255,255,255,0.2)",
                letterSpacing: "0.2em",
                marginTop: 8,
                fontFamily: "'Kenney Future Narrow', sans-serif",
                transition: "color 0.2s",
              }}>{idCopied ? "TERSALIN!" : "TAP UNTUK COPY"}</div>
            </div>

            {/* Close */}
            <button
              onClick={() => setShowProfile(false)}
              style={{
                display: "block", width: "100%", marginTop: "clamp(20px, 4vw, 32px)",
                padding: "clamp(10px, 2.5vw, 14px)",
                fontSize: "clamp(11px, 2.5vw, 14px)",
                letterSpacing: "0.2em",
                color: "rgba(255,180,80,0.7)",
                background: "transparent",
                border: "1px solid rgba(255,100,0,0.2)",
                borderRadius: 2, cursor: "pointer",
                fontFamily: "'Kenney Future Narrow', sans-serif",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,150,0,0.5)";
                e.currentTarget.style.color = "#ffaa44";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,100,0,0.2)";
                e.currentTarget.style.color = "rgba(255,180,80,0.7)";
              }}
            >TUTUP</button>
          </div>
        </div>
      )}
    </div>
  );
}
