import { useState, useCallback } from "react";
import { PlayerData } from "../types/player";
import { useSettings } from "../context/SettingsContext";
import { useCurrency } from "../context/CurrencyContext";
import Character3D from "./Character3D";
import StorePanel from "./StorePanel";
import SettingsPanel from "../SettingsPanel";
import { useBGM } from "../hooks/useBGM";
import {
  FONT_PRIMARY,
  FONT_NARROW,
  TOPBAR_HEIGHT_VH,
  BOTTOMBAR_HEIGHT_VH,
  SIDEBAR_WIDTH_VW,
  CURRENCY_VRX_LABEL,
  CURRENCY_ATHS_LABEL,
  FADE_IN_MS,
  CHARACTERS,
  type CharacterId,
} from "../constants/game";

// ─── Layout constants ─────────────────────────────────────────────────────────
const TOPBAR_H        = `${TOPBAR_HEIGHT_VH}vh`;
const BOTTOMBAR_H     = `${BOTTOMBAR_HEIGHT_VH}vh`;
const SIDEBAR_W       = `${SIDEBAR_WIDTH_VW}vw`;
const AVATAR_SIZE     = "clamp(28px, 5.5vw, 42px)";
const CURRENCY_FONT   = "clamp(11px, 1.9vw, 15px)";
const CURRENCY_ICON_F = "clamp(12px, 2vw, 16px)";
const MENU_BTN_W      = "clamp(52px, 9vw, 72px)";
const MENU_BTN_H      = "clamp(56px, 9.5vh, 78px)";
const MENU_ICON_SIZE  = "clamp(18px, 3vw, 26px)";
const MENU_LABEL_SIZE = "clamp(7px, 1.2vw, 10px)";
const MENU_GAP        = "clamp(8px, 1.5vh, 14px)";
const BATTLE_BTN_H    = "clamp(38px, 6.5vh, 54px)";
const BATTLE_FONT     = "clamp(14px, 2.4vw, 20px)";
const MODE_TAG_FONT   = "clamp(7px, 1.1vw, 10px)";

// ─── Theme helpers ─────────────────────────────────────────────────────────────
function getThemeTokens(isDark: boolean) {
  if (isDark) {
    return {
      pageBg:       "#141628",
      gradient:     "radial-gradient(ellipse at 30% 60%, rgba(255,100,0,0.18) 0%, transparent 55%)",
      hudBg:        "rgba(40,44,80,0.94)",
      hudBorder:    "rgba(255,140,0,0.45)",
      accent:       "#ff7700",
      accentGlow:   "rgba(255,140,0,0.75)",
      dimText:      "rgba(255,255,255,0.72)",
      bodyText:     "#ffffff",
      battleBg:     "linear-gradient(135deg, #cc4400 0%, #ff8800 100%)",
      battleShadow: "0 0 24px rgba(255,100,0,0.55), 0 4px 16px rgba(0,0,0,0.5)",
      soonBg:       "rgba(255,255,255,0.12)",
      soonBorder:   "rgba(255,255,255,0.28)",
    };
  }
  return {
    pageBg:       "#181e3c",
    gradient:     "radial-gradient(ellipse at 70% 40%, rgba(0,140,255,0.22) 0%, transparent 55%)",
    hudBg:        "rgba(40,55,110,0.94)",
    hudBorder:    "rgba(80,180,255,0.50)",
    accent:       "#0088ff",
    accentGlow:   "rgba(0,160,255,0.75)",
    dimText:      "rgba(200,225,255,0.78)",
    bodyText:     "#e8f4ff",
    battleBg:     "linear-gradient(135deg, #0044cc 0%, #0099ff 100%)",
    battleShadow: "0 0 24px rgba(0,120,255,0.55), 0 4px 16px rgba(0,0,0,0.5)",
    soonBg:       "rgba(0,120,255,0.14)",
    soonBorder:   "rgba(0,140,255,0.35)",
  };
}

// ─── Left sidebar menu items ───────────────────────────────────────────────────
const LEFT_MENU = [
  { id: "inventory",   icon: "🎒", label: "INVENTORY",  soon: true  },
  { id: "character",   icon: "🧍", label: "CHARACTER",  soon: true  },
  { id: "mission",     icon: "📋", label: "MISSION",    soon: true  },
] as const;

// ─── Right sidebar menu items ─────────────────────────────────────────────────
const RIGHT_MENU = [
  { id: "store",       icon: "🏪", label: "STORE",       soon: false },
  { id: "battlepass",  icon: "🎫", label: "BATTLE PASS", soon: true  },
] as const;

type MenuId = (typeof LEFT_MENU | typeof RIGHT_MENU)[number]["id"];

// ─── Mode label map ────────────────────────────────────────────────────────────
const MODE_LABELS: Record<"offline" | "online" | "lan", string> = {
  offline: "OFFLINE",
  online:  "ONLINE",
  lan:     "LAN",
};

interface Props {
  player:  PlayerData;
  mode:    "offline" | "online" | "lan";
  onBattle: () => void;
  characterId: CharacterId;
}

export default function HomeScene({ player, mode, onBattle, characterId }: Props) {
  const { settings }        = useSettings();
  const isDark               = settings.theme === "dark";
  const tk                   = getThemeTokens(isDark);
  useBGM(settings.bgmTrack, settings.bgmVolume);

  const [storeOpen, setStoreOpen]       = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelLoaded, setModelLoaded]   = useState(false);

  const selectedCharacter = CHARACTERS.find(c => c.id === characterId) ?? CHARACTERS[0];

  const handleMenuTap = useCallback((id: MenuId) => {
    if (id === "store") setStoreOpen(true);
  }, []);

  const { currency } = useCurrency();

  return (
    <div style={{
      position: "relative",
      width: "100%", height: "100%",
      overflow: "hidden",
      background: tk.pageBg,
      fontFamily: FONT_PRIMARY,
    }}>
      {/* ── Ambient gradient overlay ── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        background: tk.gradient,
      }} />

      {/* ── Character 3D canvas (fills entire center column) ── */}
      <div style={{
        position: "absolute",
        top: TOPBAR_H, bottom: BOTTOMBAR_H,
        left: SIDEBAR_W, right: SIDEBAR_W,
        zIndex: 1,
        opacity: modelLoaded ? 1 : 0,
        transition: `opacity ${FADE_IN_MS}ms ease`,
      }}>
        <Character3D theme={settings.theme} onLoaded={() => setModelLoaded(true)}
            modelPath={selectedCharacter.modelPath} />
      </div>

      {/* Loading shimmer while model loads */}
      {!modelLoaded && (
        <div style={{
          position: "absolute",
          top: TOPBAR_H, bottom: BOTTOMBAR_H,
          left: SIDEBAR_W, right: SIDEBAR_W,
          zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            fontFamily: FONT_NARROW, fontSize: "clamp(9px,1.4vw,12px)",
            color: tk.dimText, letterSpacing: "0.2em",
            animation: "pulse 1.4s ease-in-out infinite",
          }}>
            LOADING...
          </div>
        </div>
      )}

      {/* ── UI layer (flex column on top of everything) ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 10,
        display: "flex", flexDirection: "column",
        pointerEvents: "none",
      }}>

        {/* ══ TOP BAR ══════════════════════════════════════════════════════════ */}
        <TopBar
          player={player}
          vrx={currency.vrx}
          aths={currency.aths}
          isDark={isDark}
          tk={tk}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* ══ MIDDLE ROW ═══════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>

          {/* Left sidebar */}
          <SideBar side="left" items={LEFT_MENU} isDark={isDark} tk={tk} onTap={handleMenuTap} />

          {/* Center spacer — 3D canvas shows through */}
          <div style={{ flex: 1 }} />

          {/* Right sidebar */}
          <SideBar side="right" items={RIGHT_MENU} isDark={isDark} tk={tk} onTap={handleMenuTap} />
        </div>

        {/* ══ BOTTOM BAR ═══════════════════════════════════════════════════════ */}
        <BottomBar mode={mode} isDark={isDark} tk={tk} onBattle={onBattle} />
      </div>

      {/* ── Panels (outside pointer-events:none layer) ── */}
      <StorePanel open={storeOpen} onClose={() => setStoreOpen(false)} />
      {settingsOpen && <SettingsPanel player={player} onClose={() => setSettingsOpen(false)} />}

      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1;   }
        }
        @keyframes battleGlow {
          0%, 100% { box-shadow: 0 0 18px ${tk.accentGlow}, 0 4px 14px rgba(0,0,0,0.45); }
          50%       { box-shadow: 0 0 36px ${tk.accentGlow}, 0 4px 18px rgba(0,0,0,0.55); }
        }
      `}</style>
    </div>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────
interface TopBarProps {
  player: PlayerData;
  vrx: number; aths: number;
  isDark: boolean;
  tk: ReturnType<typeof getThemeTokens>;
  onOpenSettings: () => void;
}
function TopBar({ player, vrx, aths, isDark, tk, onOpenSettings }: TopBarProps) {
  void isDark;
  return (
    <div style={{
      height: TOPBAR_H, flexShrink: 0,
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: "0 clamp(10px,2vw,20px)",
      background: tk.hudBg,
      borderBottom: `1px solid ${tk.hudBorder}`,
      backdropFilter: "blur(6px)",
      pointerEvents: "auto",
      gap: "clamp(8px,1.5vw,16px)",
    }}>
      {/* Player info */}
      <div style={{ display: "flex", alignItems: "center", gap: "clamp(6px,1.2vw,12px)" }}>
        {/* Settings / avatar button */}
        <button
          onClick={onOpenSettings}
          style={{
            width: AVATAR_SIZE, height: AVATAR_SIZE,
            borderRadius: "50%",
            border: `1.5px solid ${tk.accent}`,
            background: "rgba(255,255,255,0.06)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "clamp(12px,2vw,17px)",
            color: tk.accent,
            flexShrink: 0,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
        >
          ⚙
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{
            fontFamily: FONT_PRIMARY,
            fontSize: "clamp(10px,1.7vw,14px)",
            color: tk.bodyText, letterSpacing: "0.1em", lineHeight: 1,
          }}>
            {player.nickname}
          </span>
          <span style={{
            fontFamily: FONT_NARROW,
            fontSize: "clamp(7px,1.1vw,10px)",
            color: tk.dimText, letterSpacing: "0.15em", lineHeight: 1,
          }}>
            #{player.playerId}
          </span>
        </div>
      </div>

      {/* Currency display */}
      <div style={{ display: "flex", alignItems: "center", gap: "clamp(6px,1.2vw,12px)" }}>
        <CurrencyBadge icon="💎" label={CURRENCY_VRX_LABEL}  value={vrx}  color="#44ccff" tk={tk} />
        <CurrencyBadge icon="✨" label={CURRENCY_ATHS_LABEL} value={aths} color={tk.accent} tk={tk} />
      </div>
    </div>
  );
}

// ─── CurrencyBadge ────────────────────────────────────────────────────────────
function CurrencyBadge({
  icon, label, value, color, tk,
}: {
  icon: string; label: string; value: number; color: string;
  tk: ReturnType<typeof getThemeTokens>;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      gap: "clamp(4px,0.6vw,7px)",
      padding: "clamp(3px,0.6vh,6px) clamp(8px,1.4vw,14px)",
      background: "rgba(255,255,255,0.05)",
      border: `1px solid ${tk.hudBorder}`,
      borderRadius: 3,
    }}>
      <span style={{ fontSize: CURRENCY_ICON_F, lineHeight: 1 }}>{icon}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 0, lineHeight: 1 }}>
        <span style={{
          fontFamily: FONT_NARROW,
          fontSize: "clamp(6px,0.9vw,9px)",
          color: tk.dimText, letterSpacing: "0.15em",
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: FONT_PRIMARY,
          fontSize: CURRENCY_FONT,
          color, letterSpacing: "0.06em",
        }}>
          {value.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ─── SideBar ──────────────────────────────────────────────────────────────────
type SideItem = { id: MenuId; icon: string; label: string; soon: boolean };

interface SideBarProps {
  side:    "left" | "right";
  items:   readonly SideItem[];
  isDark:  boolean;
  tk:      ReturnType<typeof getThemeTokens>;
  onTap:   (id: MenuId) => void;
}
function SideBar({ side, items, isDark, tk, onTap }: SideBarProps) {
  void isDark;
  void side;
  return (
    <div style={{
      width: SIDEBAR_W, flexShrink: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: MENU_GAP,
      padding: "clamp(6px,1.2vh,12px) 0",
      background: tk.hudBg,
      borderRight: side === "left" ? `1px solid ${tk.hudBorder}` : "none",
      borderLeft:  side === "right"? `1px solid ${tk.hudBorder}` : "none",
      pointerEvents: "auto",
    }}>
      {items.map(item => (
        <MenuButton key={item.id} item={item} tk={tk} onTap={onTap} />
      ))}
    </div>
  );
}

// ─── MenuButton ───────────────────────────────────────────────────────────────
function MenuButton({
  item, tk, onTap,
}: {
  item: SideItem;
  tk:   ReturnType<typeof getThemeTokens>;
  onTap: (id: MenuId) => void;
}) {
  return (
    <button
      onClick={() => !item.soon && onTap(item.id)}
      style={{
        width: MENU_BTN_W, height: MENU_BTN_H,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: "clamp(3px,0.6vh,5px)",
        background: item.soon ? tk.soonBg : "rgba(255,255,255,0.06)",
        border:     `1px solid ${item.soon ? tk.soonBorder : tk.hudBorder}`,
        borderRadius: 4,
        cursor: item.soon ? "default" : "pointer",
        opacity: item.soon ? 0.5 : 1,
        transition: "background 0.15s, border-color 0.15s, transform 0.1s",
        position: "relative",
        overflow: "visible",
      }}
      onMouseEnter={e => {
        if (!item.soon) {
          e.currentTarget.style.background = "rgba(255,255,255,0.10)";
          e.currentTarget.style.borderColor = tk.accent;
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = item.soon ? tk.soonBg : "rgba(255,255,255,0.06)";
        e.currentTarget.style.borderColor = item.soon ? tk.soonBorder : tk.hudBorder;
      }}
      onPointerDown={e => { if (!item.soon) e.currentTarget.style.transform = "scale(0.94)"; }}
      onPointerUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      <span style={{ fontSize: MENU_ICON_SIZE, lineHeight: 1 }}>{item.icon}</span>
      <span style={{
        fontFamily: FONT_NARROW,
        fontSize: MENU_LABEL_SIZE,
        color: item.soon ? tk.dimText : tk.bodyText,
        letterSpacing: "0.1em", lineHeight: 1, textAlign: "center",
      }}>
        {item.label}
      </span>
      {item.soon && (
        <span style={{
          position: "absolute", bottom: 3,
          fontFamily: FONT_NARROW, fontSize: "clamp(5px,0.8vw,7px)",
          color: tk.dimText, letterSpacing: "0.12em",
        }}>
          SOON
        </span>
      )}
    </button>
  );
}

// ─── BottomBar ────────────────────────────────────────────────────────────────
function BottomBar({
  mode, isDark, tk, onBattle,
}: {
  mode: "offline" | "online" | "lan";
  isDark: boolean;
  tk: ReturnType<typeof getThemeTokens>;
  onBattle: () => void;
}) {
  void isDark;
  return (
    <div style={{
      height: BOTTOMBAR_H, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: tk.hudBg,
      borderTop: `1px solid ${tk.hudBorder}`,
      backdropFilter: "blur(6px)",
      pointerEvents: "auto",
      gap: "clamp(10px,2vw,20px)",
    }}>
      <button
        onClick={onBattle}
        style={{
          height: BATTLE_BTN_H,
          padding: "0 clamp(28px,5vw,52px)",
          background: tk.battleBg,
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          display: "flex", alignItems: "center", gap: "clamp(8px,1.2vw,12px)",
          animation: "battleGlow 2.4s ease-in-out infinite",
          transition: "transform 0.1s",
        }}
        onPointerDown={e => (e.currentTarget.style.transform = "scale(0.96)")}
        onPointerUp={e => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        <span style={{ fontSize: "clamp(16px,2.5vw,22px)", lineHeight: 1 }}>⚔</span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
          <span style={{
            fontFamily: FONT_PRIMARY,
            fontSize: BATTLE_FONT,
            color: "#fff", letterSpacing: "0.22em", lineHeight: 1,
          }}>
            BATTLE
          </span>
          <span style={{
            fontFamily: FONT_NARROW,
            fontSize: MODE_TAG_FONT,
            color: "rgba(255,255,255,0.65)", letterSpacing: "0.18em", lineHeight: 1,
          }}>
            {MODE_LABELS[mode]}
          </span>
        </div>
      </button>
    </div>
  );
}
