import { useState, useEffect } from "react";
import { PlayerData } from "./types/player";
import { useSettings } from "./context/SettingsContext";
import { useBGM } from "./hooks/useBGM";
import SettingsPanel from "./SettingsPanel";

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
  { id: "offline", label: "OFFLINE", sub: "VS BOT",        icon: "⚔",  active: true  },
  { id: "online",  label: "ONLINE",  sub: "GLOBAL",        icon: "🌐", active: false, tag: "SOON" },
  { id: "lan",     label: "LAN",     sub: "LOCAL NETWORK", icon: "📡", active: false, tag: "SOON" },
];

export default function MainMenu({ player, onSelectMode }: Props) {
  const { settings } = useSettings();
  const [visible, setVisible]           = useState(false);
  const [hovered, setHovered]           = useState<string | null>(null);
  const [pressed, setPressed]           = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useBGM(settings.bgmTrack, settings.bgmVolume);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const isLight = settings.theme === "light";

  // ── Theme tokens ─────────────────────────────────────────────────
  const T = isLight ? {
    bg:           "radial-gradient(ellipse at 30% 40%, #0c1e45 0%, #050510 70%)",
    scanlines:    "rgba(0,50,255,0.04)",
    fireGlow:     "radial-gradient(ellipse at 50% 100%, rgba(0,80,255,0.10) 0%, transparent 70%)",
    topBarBg:     "rgba(5,10,30,0.85)",
    topBarBorder: "rgba(50,150,255,0.18)",
    titleSub:     "rgba(100,200,255,0.55)",
    titleMain:    "#00aaff",
    titleGlow:    "0 0 22px #0055ff",
    playerBtnBg:  "rgba(0,80,255,0.08)",
    playerBtnBorder: "rgba(50,150,255,0.3)",
    playerBtnHoverBg: "rgba(0,80,255,0.18)",
    playerBtnHoverBorder: "rgba(80,180,255,0.55)",
    avatarBg:     "linear-gradient(135deg, #0088ff, #004499)",
    avatarGlow:   "rgba(0,100,255,0.45)",
    nickColor:    "#e0f0ff",
    idColor:      "rgba(100,200,255,0.55)",
    sectionSub:   "rgba(100,200,255,0.45)",
    sectionMain:  "#fff",
    sectionGlow:  "rgba(0,100,255,0.25)",
    // card active
    cardActiveBg:         "transparent",
    cardActiveBgHover:    "rgba(0,80,255,0.12)",
    cardActiveBgPressed:  "rgba(0,80,255,0.25)",
    cardActiveBorder:     "rgba(50,150,255,0.45)",
    cardActiveBorderHover:"rgba(80,200,255,0.8)",
    cardActiveBorderTop:  "#0088ff",
    cardActiveBorderTopHover: "#44aaff",
    cardActiveImage:      "none",
    cardActiveShadow:     "0 0 36px rgba(0,100,255,0.28), inset 0 1px 0 rgba(100,200,255,0.12)",
    cardActiveBaseShadow: "0 0 16px rgba(0,80,255,0.10)",
    cardActiveLabelColor: "#fff",
    cardActiveLabelColorHover: "#66ddff",
    cardActiveLabelGlow:  "0 0 18px #0088ff",
    cardActiveSubColor:   "rgba(150,220,255,0.75)",
    cardIndicatorColor:   "#0088ff",
    cardIndicatorColorHover: "#44aaff",
    // card locked
    cardLockedBg:         "rgba(255,255,255,0.02)",
    cardLockedBorder:     "rgba(255,255,255,0.07)",
    cardLockedBorderTop:  "rgba(255,255,255,0.08)",
    cardLockedLabelColor: "rgba(255,255,255,0.2)",
    cardLockedSubColor:   "rgba(255,255,255,0.12)",
    versionColor:         "rgba(80,180,255,0.22)",
    soonBadgeBg:          "rgba(50,100,200,0.75)",
  } : {
    bg:           "radial-gradient(ellipse at 30% 70%, #1a0500 0%, #000 65%)",
    scanlines:    "rgba(0,0,0,0.06)",
    fireGlow:     "radial-gradient(ellipse at 50% 100%, rgba(255,80,0,0.12) 0%, transparent 70%)",
    topBarBg:     "rgba(0,0,0,0.6)",
    topBarBorder: "rgba(255,100,0,0.15)",
    titleSub:     "rgba(255,150,50,0.6)",
    titleMain:    "#ff8800",
    titleGlow:    "0 0 20px #ff4400",
    playerBtnBg:  "rgba(255,100,0,0.08)",
    playerBtnBorder: "rgba(255,100,0,0.25)",
    playerBtnHoverBg: "rgba(255,100,0,0.15)",
    playerBtnHoverBorder: "rgba(255,150,0,0.5)",
    avatarBg:     "linear-gradient(135deg, #ff6600, #cc2200)",
    avatarGlow:   "rgba(255,80,0,0.4)",
    nickColor:    "#fff",
    idColor:      "rgba(255,180,80,0.6)",
    sectionSub:   "rgba(255,180,80,0.5)",
    sectionMain:  "#fff",
    sectionGlow:  "rgba(255,120,0,0.4)",
    // card active
    cardActiveBg:         "rgba(255,60,0,0.07)",
    cardActiveBgHover:    "rgba(255,80,0,0.15)",
    cardActiveBgPressed:  "rgba(255,80,0,0.25)",
    cardActiveBorder:     "rgba(255,100,0,0.4)",
    cardActiveBorderHover:"#ff8800",
    cardActiveBorderTop:  "#ff6600",
    cardActiveBorderTopHover: "#ffaa00",
    cardActiveImage:      "none",
    cardActiveShadow:     "0 0 40px rgba(255,100,0,0.3), inset 0 1px 0 rgba(255,180,50,0.15)",
    cardActiveBaseShadow: "0 0 20px rgba(255,80,0,0.1)",
    cardActiveLabelColor: "#ffaa22",
    cardActiveLabelColorHover: "#ffcc44",
    cardActiveLabelGlow:  "0 0 20px #ff8800",
    cardActiveSubColor:   "rgba(255,180,80,0.7)",
    cardIndicatorColor:   "#ff6600",
    cardIndicatorColorHover: "#ffaa22",
    // card locked
    cardLockedBg:         "rgba(255,255,255,0.03)",
    cardLockedBorder:     "rgba(255,255,255,0.08)",
    cardLockedBorderTop:  "rgba(255,255,255,0.10)",
    cardLockedLabelColor: "rgba(255,255,255,0.25)",
    cardLockedSubColor:   "rgba(255,255,255,0.15)",
    versionColor:         "rgba(255,150,50,0.25)",
    soonBadgeBg:          "rgba(120,120,120,0.85)",
  };

  function handleSelect(mode: ModeCard) {
    if (!mode.active) return;
    onSelectMode?.(mode.id);
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: T.bg,
      fontFamily: "'Kenney Future', 'Arial Black', sans-serif",
      display: "flex", flexDirection: "column",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.5s ease",
      overflow: "hidden",
    }}>
      {/* Scanlines */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${T.scanlines} 3px, ${T.scanlines} 6px)`,
      }} />
      {/* Bottom ambient glow */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "40vh",
        pointerEvents: "none", background: T.fireGlow,
      }} />

      {/* ── TOP BAR ── */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "clamp(10px, 2.5vw, 18px) clamp(14px, 3.5vw, 28px)",
        borderBottom: `1px solid ${T.topBarBorder}`,
        background: T.topBarBg,
        backdropFilter: "blur(4px)",
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <div style={{
            fontSize: "clamp(7px, 1.5vw, 10px)",
            color: T.titleSub,
            letterSpacing: "0.3em",
            marginBottom: 2,
            fontFamily: "'Kenney Future Narrow', Arial, sans-serif",
          }}>SPHERE HQ</div>
          <div style={{
            fontSize: "clamp(16px, 4vw, 26px)",
            color: T.titleMain,
            letterSpacing: "0.06em",
            textShadow: T.titleGlow,
          }}>FORGE ARENA</div>
        </div>

        {/* Player button → opens Settings */}
        <button
          onClick={() => setShowSettings(true)}
          style={{
            display: "flex", alignItems: "center", gap: "clamp(6px, 1.5vw, 12px)",
            padding: "clamp(6px, 1.5vw, 10px) clamp(10px, 2.5vw, 18px)",
            background: T.playerBtnBg,
            border: `1px solid ${T.playerBtnBorder}`,
            borderRadius: 2, cursor: "pointer",
            transition: "background 0.2s, border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = T.playerBtnHoverBg;
            e.currentTarget.style.borderColor = T.playerBtnHoverBorder;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = T.playerBtnBg;
            e.currentTarget.style.borderColor = T.playerBtnBorder;
          }}
        >
          <div style={{
            width: "clamp(28px, 6vw, 40px)", height: "clamp(28px, 6vw, 40px)",
            borderRadius: "50%",
            background: T.avatarBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "clamp(13px, 2.8vw, 18px)", fontWeight: 900,
            color: "#fff", flexShrink: 0,
            boxShadow: `0 0 12px ${T.avatarGlow}`,
          }}>
            {player.nickname[0].toUpperCase()}
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{
              fontSize: "clamp(11px, 2.5vw, 15px)",
              color: T.nickColor,
              letterSpacing: "0.06em",
            }}>{player.nickname.toUpperCase()}</div>
            <div style={{
              fontSize: "clamp(9px, 1.8vw, 11px)",
              color: T.idColor,
              letterSpacing: "0.15em",
              fontFamily: "'Kenney Future Narrow', Arial, sans-serif",
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
            color: T.sectionSub,
            letterSpacing: "0.4em",
            marginBottom: 4,
            fontFamily: "'Kenney Future Narrow', Arial, sans-serif",
          }}>PILIH MODE</div>
          <div style={{
            fontSize: "clamp(22px, 5.5vw, 38px)",
            color: T.sectionMain,
            letterSpacing: "0.1em",
            textShadow: `0 0 30px ${T.sectionGlow}`,
          }}>SELECT MODE</div>
        </div>

        {/* Mode cards */}
        <div style={{
          display: "flex", flexDirection: "row",
          gap: "clamp(10px, 2.5vw, 22px)",
          width: "100%", maxWidth: 760,
          justifyContent: "center",
        }}>
          {MODES.map((mode) => {
            const isHovered = hovered === mode.id;
            const isPressed = pressed === mode.id;

            const cardBg = !mode.active
              ? T.cardLockedBg
              : isPressed
                ? T.cardActiveBgPressed
                : isHovered
                  ? T.cardActiveBgHover
                  : T.cardActiveBg;

            const cardBorder = !mode.active
              ? `2px solid ${T.cardLockedBorder}`
              : `2px solid ${isHovered ? T.cardActiveBorderHover : T.cardActiveBorder}`;

            const cardBorderTop = !mode.active
              ? `3px solid ${T.cardLockedBorderTop}`
              : `3px solid ${isHovered ? T.cardActiveBorderTopHover : T.cardActiveBorderTop}`;

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
                  flex: 1, minWidth: 0, maxWidth: 220,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  padding: "clamp(14px, 3.5vw, 28px) clamp(10px, 2vw, 18px)",
                  position: "relative",
                  cursor: mode.active ? "pointer" : "not-allowed",
                  border: cardBorder,
                  borderTop: cardBorderTop,
                  background: cardBg,
                  backgroundImage: mode.active ? T.cardActiveImage : "none",
                  backgroundSize: "100% 100%",
                  boxShadow: mode.active
                    ? isHovered ? T.cardActiveShadow : T.cardActiveBaseShadow
                    : "none",
                  transform: isPressed ? "scale(0.97)" : isHovered ? "translateY(-2px)" : "none",
                  transition: "all 0.18s ease",
                  borderRadius: 2,
                  gap: "clamp(4px, 1.5vw, 10px)",
                  minHeight: "clamp(100px, 22vw, 170px)",
                }}
              >
                {/* SOON badge */}
                {mode.tag && (
                  <div style={{
                    position: "absolute", top: -1, right: -1,
                    background: T.soonBadgeBg,
                    color: "#fff",
                    fontSize: "clamp(7px, 1.5vw, 9px)",
                    letterSpacing: "0.2em",
                    padding: "2px 8px",
                    fontFamily: "'Kenney Future Narrow', Arial, sans-serif",
                    zIndex: 2,
                  }}>SOON</div>
                )}

                {/* Icon */}
                <div style={{
                  fontSize: "clamp(24px, 6vw, 42px)", lineHeight: 1,
                  filter: mode.active ? "none" : "grayscale(1) opacity(0.35)",
                }}>{mode.icon}</div>

                {/* Mode name */}
                <div style={{
                  fontSize: "clamp(14px, 3.8vw, 24px)",
                  fontWeight: 900, letterSpacing: "0.1em",
                  color: mode.active
                    ? isHovered ? T.cardActiveLabelColorHover : T.cardActiveLabelColor
                    : T.cardLockedLabelColor,
                  textShadow: mode.active && isHovered ? T.cardActiveLabelGlow : "none",
                  lineHeight: 1,
                }}>{mode.label}</div>

                {/* Sub label */}
                <div style={{
                  fontSize: "clamp(8px, 1.8vw, 11px)", letterSpacing: "0.25em",
                  color: mode.active ? T.cardActiveSubColor : T.cardLockedSubColor,
                  fontFamily: "'Kenney Future Narrow', Arial, sans-serif",
                }}>{mode.sub}</div>

                {/* Active indicator bar */}
                {mode.active && (
                  <div style={{
                    position: "absolute", bottom: 6,
                    display: "flex", gap: 3, alignItems: "center",
                  }}>
                    <div style={{
                      width: "clamp(16px, 4vw, 28px)", height: 2,
                      background: isHovered ? T.cardIndicatorColorHover : T.cardIndicatorColor,
                      transition: "background 0.2s",
                    }} />
                    <div style={{
                      width: 4, height: 4,
                      background: isHovered ? T.cardIndicatorColorHover : T.cardIndicatorColor,
                      transform: "rotate(45deg)", transition: "background 0.2s",
                    }} />
                    <div style={{
                      width: "clamp(16px, 4vw, 28px)", height: 2,
                      background: isHovered ? T.cardIndicatorColorHover : T.cardIndicatorColor,
                      transition: "background 0.2s",
                    }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Version tag */}
        <div style={{
          fontSize: "clamp(8px, 1.5vw, 10px)",
          color: T.versionColor,
          letterSpacing: "0.3em",
          fontFamily: "'Kenney Future Narrow', Arial, sans-serif",
          marginTop: "clamp(4px, 1.5vh, 12px)",
        }}>FORGE ARENA v0.1 · ALPHA</div>
      </div>

      {/* ── SETTINGS PANEL ── */}
      {showSettings && (
        <SettingsPanel player={player} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
