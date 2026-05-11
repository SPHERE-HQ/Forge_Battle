import { useState, useCallback } from "react";
import { useSettings } from "../context/SettingsContext";
import { useBGM } from "../hooks/useBGM";
import { PlayerData } from "../types/player";
import Character3D from "./Character3D";
import {
  FONT_PRIMARY, FONT_NARROW,
  TOPBAR_HEIGHT_VH, BOTTOMBAR_HEIGHT_VH, SIDEBAR_WIDTH_VW,
  FADE_IN_MS,
  CHARACTERS, CHARACTER_ID_SPECTER,
  type CharacterId, type SkillDef,
} from "../constants/game";

// ─── Layout constants ─────────────────────────────────────────────────────────
const TOPBAR_H    = `${TOPBAR_HEIGHT_VH}vh`;
const BOTTOMBAR_H = `${BOTTOMBAR_HEIGHT_VH}vh`;
const CHAR_LIST_W = `${SIDEBAR_WIDTH_VW}vw`;

// ─── Skill card ───────────────────────────────────────────────────────────────
const SKILL_CARD_RADIUS  = 4;
const SKILL_ICON_SIZE    = "clamp(18px, 3vw, 26px)";
const SKILL_NAME_SIZE    = "clamp(9px, 1.6vw, 13px)";
const SKILL_DESC_SIZE    = "clamp(8px, 1.3vw, 11px)";
const SKILL_CD_BADGE_H   = "clamp(14px, 2.2vh, 20px)";
const SKILL_CD_FONT_SIZE = "clamp(7px, 1.1vw, 10px)";

// ─── Theme helper ─────────────────────────────────────────────────────────────
function getTokens(isDark: boolean, accent: string) {
  return {
    pageBg:      isDark ? "#141628" : "#181e3c",
    gradient:    isDark
      ? `radial-gradient(ellipse at 30% 60%, ${accent}2a 0%, transparent 55%)`
      : `radial-gradient(ellipse at 70% 40%, ${accent}33 0%, transparent 55%)`,
    hudBg:       isDark ? "rgba(40,44,80,0.94)" : "rgba(40,55,110,0.94)",
    hudBorder:   `${accent}70`,
    accentBorder:`${accent}cc`,
    bodyText:    isDark ? "#ffffff" : "#e8f4ff",
    dimText:     isDark ? "rgba(255,255,255,0.72)" : "rgba(200,225,255,0.78)",
    cardBg:      isDark ? "rgba(255,255,255,0.10)" : "rgba(0,120,255,0.10)",
    cardBorder:  isDark ? "rgba(255,255,255,0.22)" : "rgba(0,140,255,0.30)",
    accent,
  };
}

// ─── Mode label map ───────────────────────────────────────────────────────────
const MODE_LABELS: Record<"offline" | "online" | "lan", string> = {
  offline: "OFFLINE",
  online:  "ONLINE",
  lan:     "LAN",
};

// ─── Battle settings options ───────────────────────────────────────────────────
const KILL_OPTIONS  = [10, 20, 30, 50] as const;
const TIME_OPTIONS  = [
  { label: "3 MIN",  sec: 180  },
  { label: "5 MIN",  sec: 300  },
  { label: "10 MIN", sec: 600  },
  { label: "15 MIN", sec: 900  },
] as const;

interface Props {
  player:    PlayerData;
  mode:      "offline" | "online" | "lan";
  onConfirm: (characterId: CharacterId, killLimit: number, timeLimitSec: number) => void;
  onBack:    () => void;
}

export default function PreBattleScene({ player, mode, onConfirm, onBack }: Props) {
  void player;
  const { settings } = useSettings();
  useBGM(settings.bgmTrack, settings.bgmVolume);

  const isDark = settings.theme === "dark";

  const [selected,      setSelected]      = useState<CharacterId>(CHARACTER_ID_SPECTER);
  const [modelLoaded,   setModelLoaded]   = useState(false);
  const [killLimit,     setKillLimit]     = useState<typeof KILL_OPTIONS[number]>(20);
  const [timeLimitSec,  setTimeLimitSec]  = useState<number>(300);

  const selectedChar = CHARACTERS.find(c => c.id === selected)!;
  const tk           = getTokens(isDark, selectedChar.accentColor);

  const handleSelect = useCallback((id: CharacterId) => {
    setSelected(prev => { if (prev !== id) setModelLoaded(false); return id; });
  }, []);

  const handleLoaded = useCallback(() => setModelLoaded(true), []);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: tk.pageBg,
      fontFamily: FONT_PRIMARY,
      overflow: "hidden",
    }}>
      {/* Ambient gradient */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: tk.gradient, zIndex: 0,
      }} />

      {/* ══ TOP BAR ══════════════════════════════════════════════════════════ */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: TOPBAR_H, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(10px,2vw,20px)",
        background: tk.hudBg,
        borderBottom: `1px solid ${tk.hudBorder}`,
        backdropFilter: "blur(6px)",
      }}>
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: `1px solid ${tk.hudBorder}`,
            borderRadius: 3, padding: "clamp(4px,0.8vh,7px) clamp(8px,1.4vw,14px)",
            cursor: "pointer", color: tk.dimText,
            fontFamily: FONT_NARROW, fontSize: "clamp(9px,1.5vw,12px)",
            letterSpacing: "0.15em", transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = tk.bodyText; e.currentTarget.style.borderColor = tk.accentBorder; }}
          onMouseLeave={e => { e.currentTarget.style.color = tk.dimText;  e.currentTarget.style.borderColor = tk.hudBorder; }}
        >
          ← BACK
        </button>

        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: FONT_NARROW, fontSize: "clamp(7px,1.2vw,10px)",
            color: tk.dimText, letterSpacing: "0.35em", marginBottom: 2,
          }}>
            PRE-BATTLE
          </div>
          <div style={{
            fontSize: "clamp(13px,2.8vw,20px)", color: tk.bodyText,
            letterSpacing: "0.12em", lineHeight: 1,
          }}>
            SELECT YOUR HERO
          </div>
        </div>

        {/* Mode badge */}
        <div style={{
          fontFamily: FONT_NARROW, fontSize: "clamp(8px,1.3vw,11px)",
          color: tk.accent, letterSpacing: "0.2em",
          border: `1px solid ${tk.accentBorder}`,
          borderRadius: 2, padding: "clamp(3px,0.5vh,5px) clamp(8px,1.2vw,12px)",
        }}>
          {MODE_LABELS[mode]}
        </div>
      </div>

      {/* ══ MAIN CONTENT ═════════════════════════════════════════════════════ */}
      <div style={{
        position: "absolute",
        top: TOPBAR_H, bottom: BOTTOMBAR_H,
        left: 0, right: 0,
        display: "flex", flexDirection: "row",
        zIndex: 5,
      }}>
        {/* ── Character list ── */}
        <div style={{
          width: CHAR_LIST_W, flexShrink: 0,
          display: "flex", flexDirection: "column",
          background: tk.hudBg,
          borderRight: `1px solid ${tk.hudBorder}`,
          overflowY: "auto",
        }}>
          {CHARACTERS.map(char => {
            const isSelected = char.id === selected;
            return (
              <button
                key={char.id}
                onClick={() => handleSelect(char.id)}
                style={{
                  flex: 1,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: "clamp(3px,0.6vh,6px)",
                  padding: "clamp(6px,1.2vh,10px) clamp(4px,0.8vw,8px)",
                  background: isSelected ? `${char.accentColor}18` : "transparent",
                  border: "none",
                  borderLeft: isSelected ? `3px solid ${char.accentColor}` : "3px solid transparent",
                  borderBottom: `1px solid ${tk.hudBorder}`,
                  cursor: "pointer",
                  transition: "background 0.18s, border-color 0.18s",
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = `${char.accentColor}10`; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: "clamp(18px,3.2vw,26px)", lineHeight: 1 }}>{char.icon}</span>
                <span style={{
                  fontFamily: FONT_PRIMARY,
                  fontSize: "clamp(7px,1.3vw,10px)",
                  color: isSelected ? char.accentColor : tk.dimText,
                  letterSpacing: "0.08em", lineHeight: 1, textAlign: "center",
                  transition: "color 0.18s",
                }}>
                  {char.role}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Center: 3D preview + info ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* 3D model preview */}
          <div style={{ flex: 1, position: "relative" }}>
            {/* Loading shimmer */}
            {!modelLoaded && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 2,
              }}>
                <span style={{
                  fontFamily: FONT_NARROW, fontSize: "clamp(8px,1.3vw,11px)",
                  color: tk.dimText, letterSpacing: "0.2em",
                  animation: "prebattle-pulse 1.4s ease-in-out infinite",
                }}>
                  LOADING...
                </span>
              </div>
            )}
            <div style={{
              position: "absolute", inset: 0, zIndex: 1,
              opacity: modelLoaded ? 1 : 0,
              transition: `opacity ${FADE_IN_MS}ms ease`,
            }}>
              <Character3D
                key={selected}
                theme={settings.theme}
                modelPath={selectedChar.modelPath}
                onLoaded={handleLoaded}
              />
            </div>
          </div>

          {/* ── Character info + skills panel ── */}
          <div style={{
            flexShrink: 0,
            height: "clamp(120px, 32vh, 200px)",
            background: tk.hudBg,
            borderTop: `1px solid ${tk.hudBorder}`,
            display: "flex", flexDirection: "column",
            padding: "clamp(8px,1.5vh,14px) clamp(10px,2vw,20px)",
            gap: "clamp(6px,1.2vh,10px)",
          }}>
            {/* Name + role */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "clamp(8px,1.5vw,14px)", flexShrink: 0 }}>
              <span style={{
                fontFamily: FONT_PRIMARY,
                fontSize: "clamp(14px,3vw,22px)",
                color: selectedChar.accentColor,
                letterSpacing: "0.1em", lineHeight: 1,
                textShadow: `0 0 20px ${selectedChar.accentColor}66`,
              }}>
                {selectedChar.name}
              </span>
              <span style={{
                fontFamily: FONT_NARROW,
                fontSize: "clamp(8px,1.4vw,11px)",
                color: tk.dimText, letterSpacing: "0.25em",
                border: `1px solid ${tk.hudBorder}`,
                borderRadius: 2, padding: "2px 8px",
              }}>
                {selectedChar.role}
              </span>
            </div>

            {/* Skill cards */}
            <div style={{
              flex: 1, display: "flex", flexDirection: "row",
              gap: "clamp(6px,1.2vw,12px)", minHeight: 0,
            }}>
              {selectedChar.skills.map(skill => (
                <SkillCard key={skill.id} skill={skill} accent={selectedChar.accentColor} tk={tk} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ BOTTOM BAR — SETTINGS + CONFIRM ════════════════════════════════ */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: BOTTOMBAR_H,
        zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(10px,2vw,22px)",
        background: tk.hudBg,
        borderTop: `1px solid ${tk.hudBorder}`,
        backdropFilter: "blur(6px)",
        gap: "clamp(8px,1.5vw,16px)",
      }}>
        {/* Kill limit */}
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(6px,1vw,10px)", flexShrink: 0 }}>
          <span style={{
            fontFamily: FONT_NARROW, fontSize: "clamp(7px,1vw,9px)",
            color: tk.dimText, letterSpacing: "0.22em",
          }}>KILL LIMIT</span>
          {KILL_OPTIONS.map(k => (
            <button
              key={k}
              onClick={() => setKillLimit(k)}
              style={{
                height: "clamp(26px,4.2vh,36px)",
                padding: "0 clamp(8px,1.2vw,12px)",
                background: killLimit === k ? `${selectedChar.accentColor}33` : "transparent",
                border: `1px solid ${killLimit === k ? selectedChar.accentColor : tk.hudBorder}`,
                borderRadius: 3, cursor: "pointer",
                fontFamily: FONT_NARROW,
                fontSize: "clamp(9px,1.3vw,11px)",
                color: killLimit === k ? selectedChar.accentColor : tk.dimText,
                letterSpacing: "0.1em",
                transition: "all 0.15s",
              }}
            >{k}</button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, alignSelf: "stretch", background: tk.hudBorder, flexShrink: 0 }} />

        {/* Time limit */}
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(6px,1vw,10px)", flexShrink: 0 }}>
          <span style={{
            fontFamily: FONT_NARROW, fontSize: "clamp(7px,1vw,9px)",
            color: tk.dimText, letterSpacing: "0.22em",
          }}>WAKTU</span>
          {TIME_OPTIONS.map(t => (
            <button
              key={t.sec}
              onClick={() => setTimeLimitSec(t.sec)}
              style={{
                height: "clamp(26px,4.2vh,36px)",
                padding: "0 clamp(8px,1.2vw,12px)",
                background: timeLimitSec === t.sec ? `${selectedChar.accentColor}33` : "transparent",
                border: `1px solid ${timeLimitSec === t.sec ? selectedChar.accentColor : tk.hudBorder}`,
                borderRadius: 3, cursor: "pointer",
                fontFamily: FONT_NARROW,
                fontSize: "clamp(9px,1.3vw,11px)",
                color: timeLimitSec === t.sec ? selectedChar.accentColor : tk.dimText,
                letterSpacing: "0.1em",
                transition: "all 0.15s",
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ flex: 1 }} />

        {/* Confirm button */}
        <button
          onClick={() => onConfirm(selected, killLimit, timeLimitSec)}
          style={{
            height: "clamp(34px,5.5vh,48px)",
            padding: "0 clamp(24px,4.5vw,48px)",
            background: `linear-gradient(135deg, ${selectedChar.accentColor}cc, ${selectedChar.accentColor}88)`,
            border: `1px solid ${selectedChar.accentColor}`,
            borderRadius: 4,
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: "clamp(6px,1.2vw,12px)",
            transition: "transform 0.1s, box-shadow 0.2s",
            boxShadow: `0 0 20px ${selectedChar.accentColor}44`,
            flexShrink: 0,
          }}
          onPointerDown={e => (e.currentTarget.style.transform = "scale(0.96)")}
          onPointerUp={e => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <span style={{ fontSize: "clamp(12px,2vw,18px)" }}>⚔</span>
          <span style={{
            fontFamily: FONT_PRIMARY,
            fontSize: "clamp(10px,1.8vw,15px)",
            color: "#fff", letterSpacing: "0.2em",
          }}>MULAI BATTLE</span>
        </button>
      </div>

      {/* Global keyframes */}
      <style>{`
        @keyframes prebattle-pulse {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── SkillCard ────────────────────────────────────────────────────────────────
function SkillCard({
  skill, accent, tk,
}: {
  skill:  SkillDef;
  accent: string;
  tk:     ReturnType<typeof getTokens>;
}) {
  return (
    <div style={{
      flex: 1,
      background: tk.cardBg,
      border: `1px solid ${tk.cardBorder}`,
      borderTop: `2px solid ${accent}66`,
      borderRadius: SKILL_CARD_RADIUS,
      padding: "clamp(6px,1.2vh,10px) clamp(8px,1.4vw,12px)",
      display: "flex", flexDirection: "column", gap: "clamp(3px,0.6vh,5px)",
      overflow: "hidden",
    }}>
      {/* Header: icon + name + cooldown badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "clamp(4px,0.8vw,8px)", flexShrink: 0 }}>
        <span style={{ fontSize: SKILL_ICON_SIZE, lineHeight: 1, flexShrink: 0 }}>{skill.icon}</span>
        <span style={{
          fontFamily: FONT_PRIMARY,
          fontSize: SKILL_NAME_SIZE,
          color: accent, letterSpacing: "0.08em", flex: 1, lineHeight: 1,
        }}>
          {skill.name}
        </span>
        <div style={{
          height: SKILL_CD_BADGE_H,
          padding: "0 clamp(4px,0.7vw,7px)",
          background: `${accent}22`,
          border: `1px solid ${accent}55`,
          borderRadius: 2,
          display: "flex", alignItems: "center",
          fontFamily: FONT_NARROW, fontSize: SKILL_CD_FONT_SIZE,
          color: accent, letterSpacing: "0.1em", flexShrink: 0, whiteSpace: "nowrap",
        }}>
          ⏱ {skill.cooldownSec}s CD
        </div>
      </div>

      {/* Description */}
      <p style={{
        fontFamily: FONT_NARROW,
        fontSize: SKILL_DESC_SIZE,
        color: tk.dimText, letterSpacing: "0.04em",
        lineHeight: 1.4, margin: 0,
        overflow: "hidden",
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
      } as React.CSSProperties}>
        {skill.description}
      </p>

      {/* Duration badge (if skill has active duration) */}
      {skill.durationSec !== undefined && (
        <div style={{
          fontFamily: FONT_NARROW, fontSize: SKILL_CD_FONT_SIZE,
          color: accent, letterSpacing: "0.08em",
          marginTop: "auto", flexShrink: 0,
        }}>
          ▶ Active: {skill.durationSec}s
        </div>
      )}
    </div>
  );
}
