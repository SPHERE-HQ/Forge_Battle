import { useState } from "react";
import { useSettings, type Theme, type BGMTrack } from "./context/SettingsContext";
import type { PlayerData } from "./types/player";

interface Props {
  player: PlayerData;
  onClose: () => void;
}

const FONT = "'Kenney Future', 'Arial Black', sans-serif";
const FONT_NARROW = "'Kenney Future Narrow', Arial, sans-serif";

export default function SettingsPanel({ player, onClose }: Props) {
  const { settings, setTheme, setBGMTrack, setBGMVolume } = useSettings();
  const [idCopied, setIdCopied] = useState(false);
  const isDark = settings.theme === "dark";

  // Theme-aware colors
  const T = isDark ? {
    panelBg: "linear-gradient(160deg, #1a0800 0%, #090400 100%)",
    border: "rgba(255,100,0,0.3)",
    borderTop: "#ff6600",
    heading: "rgba(255,180,80,0.5)",
    sectionTitle: "rgba(255,180,80,0.6)",
    divider: "rgba(255,100,0,0.2)",
    accent: "#ff6600",
    accentGlow: "rgba(255,80,0,0.3)",
    textPrimary: "#fff",
    textMuted: "rgba(255,200,100,0.5)",
    optionActiveBg: "rgba(255,80,0,0.2)",
    optionActiveBorder: "#ff6600",
    optionInactiveBg: "rgba(255,255,255,0.04)",
    optionInactiveBorder: "rgba(255,255,255,0.1)",
    optionActiveText: "#ffcc44",
    optionInactiveText: "rgba(255,255,255,0.35)",
    closeBg: "transparent",
    closeBorder: "rgba(255,100,0,0.2)",
    closeText: "rgba(255,180,80,0.7)",
    sliderAccent: "#ff6600",
    overlayBg: "rgba(0,0,0,0.78)",
    avatarBg: "linear-gradient(135deg, #ff6600, #cc2200)",
    avatarGlow: "rgba(255,80,0,0.5)",
    cornerBorder: "#ff6600",
  } : {
    panelBg: "linear-gradient(160deg, #0a1a3a 0%, #050510 100%)",
    border: "rgba(50,150,255,0.3)",
    borderTop: "#0088ff",
    heading: "rgba(100,200,255,0.5)",
    sectionTitle: "rgba(100,200,255,0.6)",
    divider: "rgba(50,150,255,0.2)",
    accent: "#0088ff",
    accentGlow: "rgba(0,100,255,0.3)",
    textPrimary: "#fff",
    textMuted: "rgba(150,220,255,0.5)",
    optionActiveBg: "rgba(0,100,255,0.2)",
    optionActiveBorder: "#0088ff",
    optionInactiveBg: "rgba(255,255,255,0.04)",
    optionInactiveBorder: "rgba(255,255,255,0.1)",
    optionActiveText: "#66ccff",
    optionInactiveText: "rgba(255,255,255,0.35)",
    closeBg: "transparent",
    closeBorder: "rgba(50,150,255,0.2)",
    closeText: "rgba(100,200,255,0.7)",
    sliderAccent: "#0088ff",
    overlayBg: "rgba(0,0,20,0.82)",
    avatarBg: "linear-gradient(135deg, #0088ff, #004499)",
    avatarGlow: "rgba(0,100,255,0.5)",
    cornerBorder: "#0088ff",
  };

  function copyId() {
    navigator.clipboard.writeText(player.playerId).catch(() => {});
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 1500);
  }

  function SectionLabel({ children }: { children: string }) {
    return (
      <div style={{
        fontSize: "clamp(8px, 1.8vw, 10px)",
        color: T.sectionTitle,
        letterSpacing: "0.35em",
        marginBottom: "clamp(8px, 2vw, 14px)",
        fontFamily: FONT_NARROW,
      }}>{children}</div>
    );
  }

  function OptionButton({ active, onClick, children }: {
    active: boolean; onClick: () => void; children: React.ReactNode;
  }) {
    return (
      <button
        onClick={onClick}
        style={{
          flex: 1,
          padding: "clamp(8px, 2vw, 12px) clamp(6px, 1.5vw, 10px)",
          background: active ? T.optionActiveBg : T.optionInactiveBg,
          border: `2px solid ${active ? T.optionActiveBorder : T.optionInactiveBorder}`,
          borderRadius: 2,
          color: active ? T.optionActiveText : T.optionInactiveText,
          fontSize: "clamp(9px, 2vw, 12px)",
          fontFamily: FONT,
          letterSpacing: "0.1em",
          cursor: "pointer",
          transition: "all 0.15s ease",
          boxShadow: active ? `0 0 16px ${T.accentGlow}` : "none",
        }}
      >{children}</button>
    );
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: T.overlayBg,
        display: "flex", alignItems: "center", justifyContent: "flex-end",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(360px, 92vw)",
          height: "100%",
          background: T.panelBg,
          borderLeft: `1px solid ${T.border}`,
          borderTop: `3px solid ${T.borderTop}`,
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxShadow: `-8px 0 40px ${T.accentGlow}`,
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
        // Allow scroll inside panel
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "clamp(14px, 3vw, 22px) clamp(16px, 4vw, 24px)",
          borderBottom: `1px solid ${T.divider}`,
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: "clamp(13px, 3vw, 17px)",
            color: T.textPrimary,
            letterSpacing: "0.2em",
            fontFamily: FONT,
          }}>PENGATURAN</div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: T.closeBg,
              border: `1px solid ${T.closeBorder}`,
              borderRadius: 2,
              color: T.closeText,
              fontSize: 18, cursor: "pointer",
              fontFamily: FONT,
            }}
          >✕</button>
        </div>

        {/* ── BODY ── */}
        <div style={{
          flex: 1,
          padding: "clamp(16px, 3.5vw, 28px) clamp(16px, 4vw, 24px)",
          display: "flex", flexDirection: "column",
          gap: "clamp(20px, 4vw, 32px)",
        }}>

          {/* PROFIL */}
          <div>
            <SectionLabel>PROFIL PEMAIN</SectionLabel>
            <div style={{
              display: "flex", alignItems: "center",
              gap: "clamp(10px, 2.5vw, 16px)",
              padding: "clamp(12px, 2.5vw, 18px)",
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${T.divider}`,
              borderRadius: 2,
            }}>
              {/* Avatar */}
              <div style={{
                width: "clamp(44px, 10vw, 60px)", height: "clamp(44px, 10vw, 60px)",
                borderRadius: "50%",
                background: T.avatarBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "clamp(20px, 4.5vw, 28px)", fontWeight: 900, color: "#fff",
                boxShadow: `0 0 20px ${T.avatarGlow}`,
                fontFamily: FONT, flexShrink: 0,
              }}>{player.nickname[0].toUpperCase()}</div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: "clamp(14px, 3.5vw, 20px)",
                  color: T.textPrimary,
                  letterSpacing: "0.06em",
                  fontFamily: FONT,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{player.nickname.toUpperCase()}</div>
                <button
                  onClick={copyId}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: 0, display: "flex", alignItems: "center", gap: 6,
                    marginTop: 4,
                  }}
                >
                  <span style={{
                    fontSize: "clamp(11px, 2.5vw, 15px)",
                    color: idCopied ? "#88ff88" : T.textMuted,
                    letterSpacing: "0.2em",
                    fontFamily: FONT_NARROW,
                    transition: "color 0.2s",
                  }}>ID: {player.playerId}</span>
                  <span style={{
                    fontSize: "clamp(8px, 1.8vw, 10px)",
                    color: idCopied ? "#88ff88" : "rgba(255,255,255,0.2)",
                    letterSpacing: "0.1em",
                    fontFamily: FONT_NARROW,
                    transition: "color 0.2s",
                  }}>{idCopied ? "✓ COPIED" : "COPY"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* TEMA */}
          <div>
            <SectionLabel>TEMA TAMPILAN</SectionLabel>
            <div style={{ display: "flex", gap: "clamp(8px, 2vw, 12px)" }}>
              {/* Dark option */}
              <button
                onClick={() => setTheme("dark")}
                style={{
                  flex: 1,
                  padding: "clamp(10px, 2.5vw, 16px) clamp(8px, 2vw, 12px)",
                  background: settings.theme === "dark"
                    ? "rgba(255,80,0,0.18)"
                    : "rgba(255,255,255,0.03)",
                  border: `2px solid ${settings.theme === "dark" ? "#ff6600" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 2, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 8, transition: "all 0.15s",
                  boxShadow: settings.theme === "dark" ? "0 0 16px rgba(255,80,0,0.2)" : "none",
                }}
              >
                {/* Dark preview swatch */}
                <div style={{
                  width: "100%", height: "clamp(36px, 8vw, 52px)",
                  borderRadius: 2,
                  background: "radial-gradient(ellipse at 40% 70%, #1a0500 0%, #000 80%)",
                  border: "1px solid rgba(255,80,0,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 4,
                }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff6600", boxShadow: "0 0 8px #ff4400" }} />
                  <div style={{ width: 20, height: 3, background: "#ff8800", borderRadius: 1 }} />
                </div>
                <div style={{
                  fontSize: "clamp(9px, 2vw, 11px)",
                  color: settings.theme === "dark" ? "#ffcc44" : "rgba(255,255,255,0.3)",
                  fontFamily: FONT, letterSpacing: "0.12em",
                  transition: "color 0.15s",
                }}>DARK FIRE</div>
              </button>

              {/* Light (Kenney) option */}
              <button
                onClick={() => setTheme("light")}
                style={{
                  flex: 1,
                  padding: "clamp(10px, 2.5vw, 16px) clamp(8px, 2vw, 12px)",
                  background: settings.theme === "light"
                    ? "rgba(0,100,255,0.18)"
                    : "rgba(255,255,255,0.03)",
                  border: `2px solid ${settings.theme === "light" ? "#0088ff" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 2, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 8, transition: "all 0.15s",
                  boxShadow: settings.theme === "light" ? "0 0 16px rgba(0,100,255,0.2)" : "none",
                }}
              >
                {/* Light/Kenney preview swatch */}
                <div style={{
                  width: "100%", height: "clamp(36px, 8vw, 52px)",
                  borderRadius: 2,
                  backgroundImage: "url('/assets/kenney/button_square_header_large_rectangle.png')",
                  backgroundSize: "cover", backgroundPosition: "center",
                  border: "1px solid rgba(50,150,255,0.5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }} />
                <div style={{
                  fontSize: "clamp(9px, 2vw, 11px)",
                  color: settings.theme === "light" ? "#66ccff" : "rgba(255,255,255,0.3)",
                  fontFamily: FONT, letterSpacing: "0.12em",
                  transition: "color 0.15s",
                }}>KENNEY</div>
              </button>
            </div>
          </div>

          {/* BGM */}
          <div>
            <SectionLabel>MUSIK MENU (BGM)</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 2vw, 12px)" }}>
              <div style={{ display: "flex", gap: "clamp(6px, 1.5vw, 10px)" }}>
                <OptionButton active={settings.bgmTrack === "off"} onClick={() => setBGMTrack("off")}>
                  OFF
                </OptionButton>
                <OptionButton active={settings.bgmTrack === "ambient"} onClick={() => setBGMTrack("ambient")}>
                  AMBIENT
                </OptionButton>
                <OptionButton active={settings.bgmTrack === "glass"} onClick={() => setBGMTrack("glass")}>
                  GLASS
                </OptionButton>
              </div>

              {/* Track label */}
              {settings.bgmTrack !== "off" && (
                <div style={{
                  fontSize: "clamp(8px, 1.8vw, 10px)",
                  color: T.textMuted,
                  letterSpacing: "0.15em",
                  fontFamily: FONT_NARROW,
                  paddingLeft: 2,
                }}>
                  {settings.bgmTrack === "ambient"
                    ? "◆ Deep Ambient Electronic"
                    : "◆ Glass Gardens Loop"}
                </div>
              )}

              {/* Volume */}
              {settings.bgmTrack !== "off" && (
                <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px, 2vw, 14px)", marginTop: 4 }}>
                  <div style={{
                    fontSize: "clamp(8px, 1.8vw, 10px)",
                    color: T.textMuted,
                    fontFamily: FONT_NARROW,
                    letterSpacing: "0.2em",
                    flexShrink: 0,
                  }}>VOL</div>
                  <input
                    type="range"
                    min={0} max={1} step={0.05}
                    value={settings.bgmVolume}
                    onChange={(e) => setBGMVolume(Number(e.target.value))}
                    style={{
                      flex: 1,
                      height: 4,
                      accentColor: T.sliderAccent,
                      cursor: "pointer",
                      touchAction: "auto",
                    }}
                  />
                  <div style={{
                    fontSize: "clamp(8px, 1.8vw, 10px)",
                    color: T.textMuted,
                    fontFamily: FONT_NARROW,
                    letterSpacing: "0.1em",
                    width: 28, textAlign: "right", flexShrink: 0,
                  }}>{Math.round(settings.bgmVolume * 100)}%</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── CLOSE BUTTON ── */}
        <div style={{
          padding: "clamp(12px, 3vw, 20px) clamp(16px, 4vw, 24px)",
          borderTop: `1px solid ${T.divider}`,
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              display: "block", width: "100%",
              padding: "clamp(10px, 2.5vw, 14px)",
              fontSize: "clamp(11px, 2.5vw, 14px)",
              letterSpacing: "0.2em",
              color: T.closeText,
              background: "transparent",
              border: `1px solid ${T.closeBorder}`,
              borderRadius: 2, cursor: "pointer",
              fontFamily: FONT_NARROW,
              transition: "all 0.2s",
            }}
          >TUTUP</button>
        </div>
      </div>
    </div>
  );
}
