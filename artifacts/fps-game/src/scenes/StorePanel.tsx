import { useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { useCurrency } from "../context/CurrencyContext";
import {
  FONT_PRIMARY, FONT_NARROW,
  PANEL_SLIDE_MS,
  CURRENCY_VRX_LABEL, CURRENCY_ATHS_LABEL,
} from "../constants/game";

// ─── Tab definitions ──────────────────────────────────────────────────────────
const STORE_TABS = [
  { id: "weapons",  label: "WEAPONS",  icon: "🔫", soon: true  },
  { id: "armor",    label: "ARMOR",    icon: "🛡",  soon: true  },
  { id: "buffs",    label: "BUFFS",    icon: "⚗",  soon: true  },
  { id: "bank",     label: "BANK",     icon: "🏦",  soon: false },
  { id: "persona",  label: "PERSONA",  icon: "✨",  soon: true  },
] as const;

type TabId = (typeof STORE_TABS)[number]["id"];

// ─── Layout / style constants ─────────────────────────────────────────────────
const TAB_H               = "clamp(28px, 5.5vh, 40px)";
const TAB_FONT_SIZE        = "clamp(8px, 1.6vw, 12px)";
const PANEL_W              = "clamp(280px, 50vw, 480px)";
const PANEL_RADIUS         = 4;
const CONTENT_FONT_SIZE    = "clamp(11px, 2vw, 15px)";
const SOON_FONT_SIZE       = "clamp(9px, 1.5vw, 12px)";

interface Props {
  open:     boolean;
  onClose:  () => void;
}

export default function StorePanel({ open, onClose }: Props) {
  const { settings } = useSettings();
  const { currency }  = useCurrency();
  const [activeTab, setActiveTab] = useState<TabId>("bank");

  const isDark   = settings.theme === "dark";
  const accent   = isDark ? "#ff7700" : "#0088ff";
  const panelBg  = isDark ? "rgba(10,8,4,0.97)"  : "rgba(3,8,30,0.97)";
  const borderC  = isDark ? "rgba(255,120,0,0.25)" : "rgba(0,136,255,0.25)";
  const tabBg    = isDark ? "rgba(255,120,0,0.08)" : "rgba(0,136,255,0.08)";
  const tabHoverBg = isDark ? "rgba(255,120,0,0.15)" : "rgba(0,136,255,0.15)";
  const dimText  = isDark ? "rgba(255,255,255,0.28)" : "rgba(180,210,255,0.35)";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 80,
          background: "rgba(0,0,0,0.55)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: `opacity ${PANEL_SLIDE_MS}ms ease`,
        }}
      />

      {/* Slide panel */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 90,
          width: PANEL_W,
          background: panelBg,
          borderLeft: `1px solid ${borderC}`,
          borderRadius: `${PANEL_RADIUS}px 0 0 ${PANEL_RADIUS}px`,
          display: "flex", flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: `transform ${PANEL_SLIDE_MS}ms cubic-bezier(0.32,0,0.16,1)`,
          boxShadow: `inset 1px 0 0 ${borderC}, -8px 0 32px rgba(0,0,0,0.6)`,
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "clamp(8px,2vh,14px) clamp(12px,2vw,20px)",
          borderBottom: `1px solid ${borderC}`,
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: FONT_PRIMARY,
            fontSize: "clamp(14px,2.5vw,20px)",
            color: accent, letterSpacing: "0.18em",
          }}>
            🏪 STORE
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.55)", fontSize: "clamp(16px,2.5vw,22px)",
              lineHeight: 1, padding: "4px 6px",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
          >
            ✕
          </button>
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: "flex", flexShrink: 0,
          borderBottom: `1px solid ${borderC}`,
          overflow: "hidden",
        }}>
          {STORE_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, height: TAB_H, border: "none", cursor: "pointer",
                  background: isActive ? tabHoverBg : tabBg,
                  borderBottom: isActive ? `2px solid ${accent}` : "2px solid transparent",
                  fontFamily: FONT_NARROW,
                  fontSize: TAB_FONT_SIZE,
                  color: isActive ? accent : dimText,
                  letterSpacing: "0.08em",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 2,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: "clamp(11px,1.8vw,14px)", lineHeight: 1 }}>{tab.icon}</span>
                <span style={{ lineHeight: 1 }}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "clamp(10px,2vh,18px) clamp(12px,2vw,20px)" }}>
          {activeTab === "bank" ? (
            <BankTab accent={accent} borderC={borderC} dimText={dimText} vrx={currency.vrx} aths={currency.aths} />
          ) : (
            <SoonTab icon={STORE_TABS.find(t => t.id === activeTab)!.icon} label={STORE_TABS.find(t => t.id === activeTab)!.label} accent={accent} dimText={dimText} />
          )}
        </div>

        <div style={{
          padding: "clamp(6px,1.2vh,10px) clamp(12px,2vw,20px)",
          borderTop: `1px solid ${borderC}`,
          flexShrink: 0,
          fontFamily: FONT_NARROW,
          fontSize: SOON_FONT_SIZE,
          color: dimText,
          textAlign: "center", letterSpacing: "0.12em",
        }}>
          FORGE ARENA STORE • SPHERE HQ
        </div>
      </div>
    </>
  );
}

// ─── Bank tab ─────────────────────────────────────────────────────────────────
function BankTab({
  accent, borderC, dimText, vrx, aths,
}: {
  accent: string; borderC: string; dimText: string; vrx: number; aths: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(10px,2vh,16px)" }}>
      <p style={{ fontFamily: FONT_NARROW, fontSize: CONTENT_FONT_SIZE, color: dimText, margin: 0, letterSpacing: "0.06em" }}>
        Exchange {CURRENCY_ATHS_LABEL} for {CURRENCY_VRX_LABEL}, or top up your premium currency.
      </p>

      {/* Balance cards */}
      {[
        { label: "Vyrox",    symbol: CURRENCY_VRX_LABEL,  icon: "💎", value: vrx,  color: "#44ccff" },
        { label: "Aetheris", symbol: CURRENCY_ATHS_LABEL, icon: "✨", value: aths, color: accent    },
      ].map(item => (
        <div key={item.symbol} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "clamp(8px,1.5vh,12px) clamp(10px,1.8vw,16px)",
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${borderC}`,
          borderRadius: 4,
        }}>
          <span style={{ fontFamily: FONT_NARROW, fontSize: CONTENT_FONT_SIZE, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em" }}>
            {item.icon} {item.label}
          </span>
          <span style={{ fontFamily: FONT_PRIMARY, fontSize: "clamp(14px,2.2vw,18px)", color: item.color }}>
            {item.value.toLocaleString()} <span style={{ fontSize: "0.7em", opacity: 0.7 }}>{item.symbol}</span>
          </span>
        </div>
      ))}

      {/* Exchange coming soon note */}
      <div style={{
        marginTop: "clamp(6px,1.2vh,10px)",
        padding: "clamp(8px,1.5vh,12px)",
        border: `1px dashed ${dimText}`,
        borderRadius: 4,
        textAlign: "center",
        fontFamily: FONT_NARROW,
        fontSize: SOON_FONT_SIZE,
        color: dimText,
        letterSpacing: "0.12em",
      }}>
        💱 EXCHANGE & TOP-UP — COMING SOON
      </div>
    </div>
  );
}

// ─── Soon tab placeholder ─────────────────────────────────────────────────────
function SoonTab({ icon, label, accent, dimText }: { icon: string; label: string; accent: string; dimText: string }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: "clamp(8px,1.5vh,14px)", paddingTop: "clamp(24px,5vh,48px)",
    }}>
      <span style={{ fontSize: "clamp(28px,5vw,40px)" }}>{icon}</span>
      <p style={{
        fontFamily: FONT_PRIMARY, fontSize: CONTENT_FONT_SIZE,
        color: accent, letterSpacing: "0.18em", margin: 0,
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: FONT_NARROW, fontSize: SOON_FONT_SIZE,
        color: dimText, letterSpacing: "0.14em", margin: 0,
      }}>
        COMING SOON
      </p>
    </div>
  );
}
