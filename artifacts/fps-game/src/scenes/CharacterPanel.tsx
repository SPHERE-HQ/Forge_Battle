import { useState, useCallback } from "react";
import Character3D from "./Character3D";
import {
  FONT_PRIMARY, FONT_NARROW,
  PANEL_SLIDE_MS,
  CHARACTERS, CHARACTER_BIOS,
  type CharacterId,
} from "../constants/game";
import { useSettings } from "../context/SettingsContext";

// ─── Layout constants ─────────────────────────────────────────────────────────
const PANEL_Z           = 40;
const SIDEBAR_W         = "clamp(140px, 22vw, 200px)";
const VIEWER_W          = "clamp(180px, 30vw, 280px)";
const ACCENT_BADGE_FS   = "clamp(7px, 1.1vw, 10px)";
const CHAR_NAME_FS      = "clamp(13px, 2vw, 18px)";
const CHAR_ROLE_FS      = "clamp(8px, 1.2vw, 11px)";
const STAT_LABEL_FS     = "clamp(7px, 1.0vw, 9px)";
const STAT_VALUE_FS     = "clamp(8px, 1.2vw, 10px)";
const BODY_TEXT_FS      = "clamp(8px, 1.2vw, 11px)";
const SKILL_ICON_FS     = "clamp(14px, 2.2vw, 20px)";
const SKILL_NAME_FS     = "clamp(8px, 1.2vw, 10px)";
const SKIN_CARD_W       = "clamp(70px, 11vw, 100px)";
const SKIN_CARD_H       = "clamp(80px, 13vh, 110px)";

// ─── Rarity color map ─────────────────────────────────────────────────────────
const RARITY_COLOR: Record<string, string> = {
  common:    "#aaaaaa",
  rare:      "#44aaff",
  epic:      "#cc44ff",
  legendary: "#ffaa00",
};

const RARITY_LABEL: Record<string, string> = {
  common:    "BIASA",
  rare:      "LANGKA",
  epic:      "EPIK",
  legendary: "LEGENDARIS",
};

type Tab = "info" | "skin";

interface Props {
  open:              boolean;
  onClose:           () => void;
  activeCharacterId: CharacterId;
}

function getTheme(isDark: boolean) {
  if (isDark) {
    return {
      overlay:   "rgba(0,0,0,0.72)",
      panelBg:   "#141628",
      sidebarBg: "rgba(20,22,40,0.97)",
      contentBg: "rgba(26,28,52,0.97)",
      border:    "rgba(255,140,0,0.30)",
      accent:    "#ff7700",
      dimText:   "rgba(255,255,255,0.55)",
      bodyText:  "#ffffff",
      cardBg:    "rgba(255,255,255,0.06)",
      cardHover: "rgba(255,255,255,0.11)",
      tabActive: "rgba(255,140,0,0.18)",
      tabBorder: "#ff7700",
      closeBg:   "rgba(255,255,255,0.08)",
      statTrack: "rgba(255,255,255,0.12)",
    };
  }
  return {
    overlay:   "rgba(0,0,0,0.65)",
    panelBg:   "#181e3c",
    sidebarBg: "rgba(22,28,60,0.97)",
    contentBg: "rgba(30,38,80,0.97)",
    border:    "rgba(80,180,255,0.35)",
    accent:    "#0088ff",
    dimText:   "rgba(200,225,255,0.60)",
    bodyText:  "#e8f4ff",
    cardBg:    "rgba(0,120,255,0.08)",
    cardHover: "rgba(0,120,255,0.14)",
    tabActive: "rgba(0,140,255,0.18)",
    tabBorder: "#0088ff",
    closeBg:   "rgba(255,255,255,0.06)",
    statTrack: "rgba(255,255,255,0.10)",
  };
}

export default function CharacterPanel({ open, onClose, activeCharacterId }: Props) {
  const { settings }     = useSettings();
  const isDark            = settings.theme === "dark";
  const tk                = getTheme(isDark);

  const [selectedId, setSelectedId]     = useState<CharacterId>(activeCharacterId);
  const [tab, setTab]                   = useState<Tab>("info");
  const [modelLoaded, setModelLoaded]   = useState(false);

  const selectedChar = CHARACTERS.find(c => c.id === selectedId) ?? CHARACTERS[0];
  const bio          = CHARACTER_BIOS[selectedId];

  const handleSelectChar = useCallback((id: CharacterId) => {
    setSelectedId(id);
    setModelLoaded(false);
  }, []);

  return (
    <div
      style={{
        position:   "fixed", inset: 0,
        zIndex:     PANEL_Z,
        background: tk.overlay,
        display:    "flex",
        alignItems: "stretch",
        opacity:    open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transition: `opacity ${PANEL_SLIDE_MS}ms ease`,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Panel container ── */}
      <div style={{
        display:    "flex",
        width:      "100%",
        height:     "100%",
        transform:  open ? "translateY(0)" : "translateY(40px)",
        transition: `transform ${PANEL_SLIDE_MS}ms cubic-bezier(0.22,1,0.36,1)`,
      }}>

        {/* ── Left: character list ────────────────────────────────────────── */}
        <div style={{
          width:          SIDEBAR_W, flexShrink: 0,
          background:     tk.sidebarBg,
          borderRight:    `1px solid ${tk.border}`,
          display:        "flex", flexDirection: "column",
          overflowY:      "auto",
        }}>
          {/* Header */}
          <div style={{
            padding:      "clamp(10px,2vh,18px) clamp(10px,1.5vw,16px) clamp(6px,1vh,10px)",
            borderBottom: `1px solid ${tk.border}`,
            flexShrink:   0,
          }}>
            <div style={{
              fontFamily:    FONT_NARROW,
              fontSize:      ACCENT_BADGE_FS,
              color:         tk.accent,
              letterSpacing: "0.2em",
            }}>KARAKTER</div>
          </div>

          {/* Character list */}
          <div style={{ padding: "clamp(6px,1.2vh,10px)", display: "flex", flexDirection: "column", gap: "clamp(4px,0.8vh,8px)" }}>
            {CHARACTERS.map(ch => {
              const isActive = ch.id === selectedId;
              return (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChar(ch.id)}
                  style={{
                    display:       "flex", alignItems: "center",
                    gap:           "clamp(6px,1vw,10px)",
                    padding:       "clamp(7px,1.3vh,12px) clamp(8px,1.2vw,12px)",
                    background:    isActive ? tk.tabActive : tk.cardBg,
                    border:        `1px solid ${isActive ? ch.accentColor : "transparent"}`,
                    borderRadius:  4,
                    cursor:        "pointer",
                    textAlign:     "left",
                    transition:    "background 0.14s, border-color 0.14s",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = tk.cardHover; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = tk.cardBg; }}
                >
                  <span style={{ fontSize: "clamp(16px,2.5vw,22px)", lineHeight: 1 }}>{ch.icon}</span>
                  <div>
                    <div style={{
                      fontFamily: FONT_PRIMARY, fontSize: "clamp(8px,1.2vw,11px)",
                      color:      isActive ? ch.accentColor : tk.bodyText,
                      letterSpacing: "0.08em",
                    }}>{ch.name}</div>
                    <div style={{
                      fontFamily: FONT_NARROW, fontSize: "clamp(6px,0.9vw,8px)",
                      color:      tk.dimText,  letterSpacing: "0.14em",
                    }}>{ch.role}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Center: 3D viewer ───────────────────────────────────────────── */}
        <div style={{
          width:      VIEWER_W, flexShrink: 0,
          background: `linear-gradient(180deg, ${tk.panelBg} 0%, ${tk.sidebarBg} 100%)`,
          borderRight: `1px solid ${tk.border}`,
          position:   "relative",
          overflow:   "hidden",
        }}>
          {/* Accent glow behind model */}
          <div style={{
            position:  "absolute", inset: 0, pointerEvents: "none",
            background: `radial-gradient(ellipse at 50% 70%, ${selectedChar.accentColor}22 0%, transparent 65%)`,
          }} />

          {/* 3D canvas */}
          <div style={{
            position: "absolute", inset: 0,
            opacity:  modelLoaded ? 1 : 0,
            transition: "opacity 0.32s ease",
          }}>
            <Character3D
              theme={settings.theme}
              modelPath={selectedChar.modelPath}
              onLoaded={() => setModelLoaded(true)}
            />
          </div>

          {/* Loading */}
          {!modelLoaded && (
            <div style={{
              position: "absolute", inset: 0,
              display:  "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                fontFamily:    FONT_NARROW,
                fontSize:      "clamp(8px,1.2vw,10px)",
                color:         tk.dimText,
                letterSpacing: "0.2em",
                animation:     "cfPulse 1.4s ease-in-out infinite",
              }}>LOADING...</div>
            </div>
          )}

          {/* Character name plate */}
          <div style={{
            position:   "absolute", bottom: 0, left: 0, right: 0,
            padding:    "clamp(8px,1.5vh,14px) clamp(10px,1.5vw,16px)",
            background: "linear-gradient(transparent, rgba(0,0,0,0.72))",
          }}>
            <div style={{
              fontFamily:    FONT_PRIMARY,
              fontSize:      CHAR_NAME_FS,
              color:         selectedChar.accentColor,
              letterSpacing: "0.15em",
              lineHeight:    1,
            }}>{selectedChar.name}</div>
            <div style={{
              fontFamily:    FONT_NARROW,
              fontSize:      CHAR_ROLE_FS,
              color:         tk.dimText,
              letterSpacing: "0.18em",
              marginTop:     2,
            }}>{selectedChar.role}</div>
          </div>
        </div>

        {/* ── Right: info / skin tabs ─────────────────────────────────────── */}
        <div style={{
          flex:       1, minWidth: 0,
          background: tk.contentBg,
          display:    "flex", flexDirection: "column",
          overflow:   "hidden",
        }}>
          {/* Top bar */}
          <div style={{
            display:      "flex", alignItems: "center",
            justifyContent: "space-between",
            padding:      "0 clamp(12px,2vw,20px)",
            height:       "clamp(44px,8vh,58px)",
            borderBottom: `1px solid ${tk.border}`,
            flexShrink:   0,
            gap:          "clamp(8px,1.5vw,16px)",
          }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: "clamp(4px,0.8vw,8px)" }}>
              {(["info", "skin"] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding:      "clamp(4px,0.8vh,7px) clamp(10px,1.6vw,18px)",
                    background:   tab === t ? tk.tabActive : "transparent",
                    border:       `1px solid ${tab === t ? tk.tabBorder : "transparent"}`,
                    borderRadius: 3,
                    cursor:       "pointer",
                    fontFamily:   FONT_NARROW,
                    fontSize:     "clamp(8px,1.2vw,10px)",
                    color:        tab === t ? tk.bodyText : tk.dimText,
                    letterSpacing: "0.16em",
                    transition:   "all 0.14s",
                  }}
                >
                  {t === "info" ? "INFO" : "SKIN"}
                </button>
              ))}
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                width:        "clamp(28px,4.5vw,38px)",
                height:       "clamp(28px,4.5vw,38px)",
                borderRadius: "50%",
                border:       `1px solid ${tk.border}`,
                background:   tk.closeBg,
                cursor:       "pointer",
                color:        tk.dimText,
                fontSize:     "clamp(12px,1.8vw,16px)",
                display:      "flex", alignItems: "center", justifyContent: "center",
              }}
            >✕</button>
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "clamp(12px,2vh,20px) clamp(14px,2.2vw,24px)" }}>
            {tab === "info" ? (
              <InfoTab char={selectedChar} bio={bio} tk={tk} />
            ) : (
              <SkinTab bio={bio} accent={selectedChar.accentColor} tk={tk} />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cfPulse { 0%,100%{opacity:0.35} 50%{opacity:1} }
      `}</style>
    </div>
  );
}

// ─── Info tab ────────────────────────────────────────────────────────────────
function InfoTab({
  char, bio, tk,
}: {
  char: typeof CHARACTERS[number];
  bio:  ReturnType<typeof CHARACTER_BIOS[CharacterId]>;
  tk:   ReturnType<typeof getTheme>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(12px,2.2vh,20px)" }}>

      {/* Lore */}
      <Section title="LORE" tk={tk}>
        <p style={{
          fontFamily:  FONT_NARROW, fontSize: BODY_TEXT_FS,
          color:       tk.bodyText,  lineHeight: 1.6,
          letterSpacing: "0.04em", margin: 0,
        }}>{bio.lore}</p>
        <p style={{
          fontFamily:    FONT_NARROW, fontSize: ACCENT_BADGE_FS,
          color:         tk.dimText,  letterSpacing: "0.12em",
          margin:        "clamp(4px,0.8vh,8px) 0 0",
        }}>{bio.origin}</p>
      </Section>

      {/* Stats */}
      <Section title="STATISTIK" tk={tk}>
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(6px,1.1vh,10px)" }}>
          {(
            [
              { key: "hp",    label: "KESEHATAN" },
              { key: "speed", label: "KECEPATAN" },
              { key: "armor", label: "ARMOR"     },
              { key: "power", label: "KEKUATAN SKILL" },
            ] as const
          ).map(({ key, label }) => (
            <StatBar
              key={key}
              label={label}
              value={bio.stats[key]}
              color={char.accentColor}
              tk={tk}
            />
          ))}
        </div>
      </Section>

      {/* Skills */}
      <Section title="SKILL" tk={tk}>
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(6px,1.2vh,10px)" }}>
          {char.skills.map(skill => (
            <div key={skill.id} style={{
              display:      "flex", gap: "clamp(8px,1.3vw,14px)", alignItems: "flex-start",
              padding:      "clamp(8px,1.4vh,12px) clamp(10px,1.5vw,14px)",
              background:   tk.cardBg,
              border:       `1px solid ${tk.border}`,
              borderRadius: 4,
            }}>
              <span style={{ fontSize: SKILL_ICON_FS, lineHeight: 1, flexShrink: 0 }}>{skill.icon}</span>
              <div>
                <div style={{
                  fontFamily:    FONT_PRIMARY, fontSize: SKILL_NAME_FS,
                  color:         char.accentColor, letterSpacing: "0.12em",
                }}>{skill.name}</div>
                {skill.cooldownSec > 0 && (
                  <div style={{
                    fontFamily:    FONT_NARROW, fontSize: ACCENT_BADGE_FS,
                    color:         tk.dimText,  letterSpacing: "0.10em",
                    marginTop:     2,
                  }}>
                    {skill.durationSec ? `Durasi: ${skill.durationSec}d · ` : ""}
                    Cooldown: {skill.cooldownSec}d
                  </div>
                )}
                <div style={{
                  fontFamily:    FONT_NARROW, fontSize: BODY_TEXT_FS,
                  color:         tk.bodyText,  letterSpacing: "0.04em",
                  lineHeight:    1.55, marginTop: "clamp(4px,0.6vh,6px)",
                }}>{skill.description}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Skin tab ────────────────────────────────────────────────────────────────
function SkinTab({
  bio, accent, tk,
}: {
  bio:    ReturnType<typeof CHARACTER_BIOS[CharacterId]>;
  accent: string;
  tk:     ReturnType<typeof getTheme>;
}) {
  const [activeSkin, setActiveSkin] = useState(bio.skins[0].id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(10px,2vh,16px)" }}>
      <div style={{
        fontFamily:    FONT_NARROW, fontSize: ACCENT_BADGE_FS,
        color:         tk.dimText,  letterSpacing: "0.16em",
        lineHeight:    1.5,
      }}>
        Pilih skin untuk karakter ini. Model pakaian akan tersedia setelah update berikutnya.
      </div>

      <div style={{
        display:   "flex", flexWrap: "wrap",
        gap:       "clamp(8px,1.4vw,14px)",
      }}>
        {bio.skins.map(skin => {
          const isActive  = skin.id === activeSkin;
          const rarColor  = RARITY_COLOR[skin.rarity];

          return (
            <button
              key={skin.id}
              onClick={() => skin.unlocked && setActiveSkin(skin.id)}
              style={{
                width:         SKIN_CARD_W,
                height:        SKIN_CARD_H,
                flexShrink:    0,
                display:       "flex", flexDirection: "column",
                alignItems:    "center", justifyContent: "space-between",
                padding:       "clamp(8px,1.3vh,12px) clamp(6px,0.9vw,10px)",
                background:    isActive ? `${rarColor}18` : tk.cardBg,
                border:        `1.5px solid ${isActive ? rarColor : (skin.unlocked ? tk.border : "rgba(255,255,255,0.08)")}`,
                borderRadius:  5,
                cursor:        skin.unlocked ? "pointer" : "default",
                opacity:       skin.unlocked ? 1 : 0.55,
                transition:    "border-color 0.14s, background 0.14s",
                position:      "relative",
                overflow:      "hidden",
              }}
            >
              {/* Preview placeholder */}
              <div style={{
                flex:          1, width: "100%",
                display:       "flex", alignItems: "center", justifyContent: "center",
              }}>
                {skin.unlocked ? (
                  <span style={{ fontSize: "clamp(22px,3.5vw,32px)" }}>🧍</span>
                ) : (
                  <span style={{ fontSize: "clamp(18px,2.8vw,26px)", opacity: 0.5 }}>🔒</span>
                )}
              </div>

              {/* Name */}
              <div style={{
                fontFamily:    FONT_NARROW,
                fontSize:      "clamp(6px,0.9vw,8px)",
                color:         isActive ? rarColor : tk.dimText,
                letterSpacing: "0.12em",
                textAlign:     "center",
                lineHeight:    1.2,
              }}>{skin.name}</div>

              {/* Rarity badge */}
              <div style={{
                fontFamily:    FONT_NARROW,
                fontSize:      "clamp(5px,0.75vw,7px)",
                color:         rarColor,
                letterSpacing: "0.10em",
                marginTop:     2,
              }}>{RARITY_LABEL[skin.rarity]}</div>

              {/* Locked badge */}
              {!skin.unlocked && (
                <div style={{
                  position:      "absolute", inset: 0,
                  display:       "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{
                    fontFamily:    FONT_NARROW,
                    fontSize:      "clamp(5px,0.8vw,7px)",
                    color:         tk.dimText,
                    letterSpacing: "0.12em",
                    background:    "rgba(0,0,0,0.5)",
                    padding:       "2px 6px",
                    borderRadius:  2,
                    position:      "absolute", bottom: 6,
                  }}>SEGERA</div>
                </div>
              )}

              {/* Active indicator */}
              {isActive && (
                <div style={{
                  position:   "absolute", top: 4, right: 4,
                  width:      8, height: 8,
                  borderRadius: "50%",
                  background:   accent,
                  boxShadow:    `0 0 6px ${accent}`,
                }} />
              )}
            </button>
          );
        })}
      </div>

      <div style={{
        fontFamily:    FONT_NARROW, fontSize: ACCENT_BADGE_FS,
        color:         tk.dimText,  letterSpacing: "0.12em",
        padding:       "clamp(8px,1.4vh,12px) clamp(10px,1.5vw,14px)",
        background:    tk.cardBg,
        border:        `1px solid ${tk.border}`,
        borderRadius:  4,
        lineHeight:    1.5,
      }}>
        Skin baru akan hadir bersama model karakter lengkap dalam update mendatang.
        Stay tuned!
      </div>
    </div>
  );
}

// ─── Reusable components ──────────────────────────────────────────────────────
function Section({
  title, children, tk,
}: {
  title: string;
  children: React.ReactNode;
  tk: ReturnType<typeof getTheme>;
}) {
  return (
    <div>
      <div style={{
        fontFamily:    FONT_NARROW, fontSize: ACCENT_BADGE_FS,
        color:         tk.dimText,  letterSpacing: "0.22em",
        marginBottom:  "clamp(6px,1.1vh,10px)",
        paddingBottom: "clamp(4px,0.7vh,6px)",
        borderBottom:  `1px solid ${tk.border}`,
      }}>{title}</div>
      {children}
    </div>
  );
}

function StatBar({
  label, value, color, tk,
}: {
  label: string; value: number; color: string;
  tk: ReturnType<typeof getTheme>;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "clamp(6px,1vw,10px)" }}>
      <div style={{
        fontFamily:    FONT_NARROW, fontSize: STAT_LABEL_FS,
        color:         tk.dimText,  letterSpacing: "0.12em",
        width:         "clamp(70px,10vw,100px)", flexShrink: 0,
        textAlign:     "right",
      }}>{label}</div>

      <div style={{
        flex: 1, height: "clamp(4px,0.7vh,6px)",
        background:    tk.statTrack,
        borderRadius:  3, overflow: "hidden",
      }}>
        <div style={{
          width:         `${value}%`, height: "100%",
          background:    color,
          borderRadius:  3,
          boxShadow:     `0 0 6px ${color}88`,
          transition:    "width 0.4s ease",
        }} />
      </div>

      <div style={{
        fontFamily:    FONT_PRIMARY, fontSize: STAT_VALUE_FS,
        color:         color, letterSpacing: "0.06em",
        width:         "clamp(24px,3vw,32px)", flexShrink: 0,
        textAlign:     "right",
      }}>{value}</div>
    </div>
  );
}
