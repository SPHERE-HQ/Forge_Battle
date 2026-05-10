import { useState } from "react";
import {
  FONT_PRIMARY, FONT_NARROW,
  PANEL_SLIDE_MS,
  WEAPONS, STARTER_WEAPON_IDS,
  type WeaponDef, type WeaponType,
} from "../constants/game";
import { useSettings } from "../context/SettingsContext";

// ─── Layout constants ─────────────────────────────────────────────────────────
const PANEL_Z        = 40;
const SIDEBAR_W      = "clamp(160px, 25vw, 240px)";
const BADGE_FS       = "clamp(7px, 1.0vw, 9px)";
const WEAPON_NAME_FS = "clamp(9px, 1.4vw, 12px)";
const WEAPON_TYPE_FS = "clamp(7px, 1.0vw, 9px)";
const STAT_LABEL_FS  = "clamp(7px, 1.0vw, 9px)";
const BODY_TEXT_FS   = "clamp(8px, 1.2vw, 11px)";
const DETAIL_NAME_FS = "clamp(13px, 2vw, 18px)";
const DETAIL_TYPE_FS = "clamp(8px, 1.2vw, 10px)";

// ─── Type labels ──────────────────────────────────────────────────────────────
const TYPE_LABEL: Record<WeaponType, string> = {
  pistol:  "PISTOL",
  smg:     "SUBMACHINE GUN",
  ar:      "ASSAULT RIFLE",
  shotgun: "SHOTGUN",
  sniper:  "SNIPER RIFLE",
  lmg:     "LIGHT MACHINE GUN",
  heavy:   "SENJATA BERAT",
};

const TYPE_COLOR: Record<WeaponType, string> = {
  pistol:  "#aaaaaa",
  smg:     "#44ddff",
  ar:      "#44ff88",
  shotgun: "#ffaa44",
  sniper:  "#aa44ff",
  lmg:     "#ff6644",
  heavy:   "#ff2244",
};

// ─── Rarity ───────────────────────────────────────────────────────────────────
const RARITY_COLOR: Record<string, string> = {
  common:    "#aaaaaa",
  uncommon:  "#44ff88",
  rare:      "#44aaff",
  epic:      "#cc44ff",
};
const RARITY_LABEL: Record<string, string> = {
  common:   "BIASA",
  uncommon: "TIDAK BIASA",
  rare:     "LANGKA",
  epic:     "EPIK",
};

const SLOT_LABEL: Record<string, string> = {
  scope:    "SCOPE",
  grip:     "GRIP",
  magazine: "MAGAZIN",
  muzzle:   "MUZZLE",
  stock:    "STOK",
};

function getTheme(isDark: boolean) {
  if (isDark) {
    return {
      overlay:   "rgba(0,0,0,0.72)",
      panelBg:   "#141628",
      sidebarBg: "rgba(20,22,40,0.97)",
      contentBg: "rgba(26,28,52,0.97)",
      border:    "rgba(255,140,0,0.28)",
      accent:    "#ff7700",
      dimText:   "rgba(255,255,255,0.50)",
      bodyText:  "#ffffff",
      cardBg:    "rgba(255,255,255,0.05)",
      cardHover: "rgba(255,255,255,0.10)",
      cardSel:   "rgba(255,140,0,0.12)",
      closeBg:   "rgba(255,255,255,0.08)",
      statTrack: "rgba(255,255,255,0.10)",
      slotBg:    "rgba(255,255,255,0.04)",
      slotBorder: "rgba(255,255,255,0.12)",
    };
  }
  return {
    overlay:   "rgba(0,0,0,0.65)",
    panelBg:   "#181e3c",
    sidebarBg: "rgba(22,28,60,0.97)",
    contentBg: "rgba(30,38,80,0.97)",
    border:    "rgba(80,180,255,0.30)",
    accent:    "#0088ff",
    dimText:   "rgba(200,225,255,0.55)",
    bodyText:  "#e8f4ff",
    cardBg:    "rgba(0,100,255,0.06)",
    cardHover: "rgba(0,120,255,0.12)",
    cardSel:   "rgba(0,140,255,0.15)",
    closeBg:   "rgba(255,255,255,0.06)",
    statTrack: "rgba(255,255,255,0.10)",
    slotBg:    "rgba(0,0,0,0.18)",
    slotBorder: "rgba(80,180,255,0.18)",
  };
}

interface Props {
  open:    boolean;
  onClose: () => void;
}

export default function InventoryPanel({ open, onClose }: Props) {
  const { settings } = useSettings();
  const isDark        = settings.theme === "dark";
  const tk            = getTheme(isDark);

  const ownedWeapons = WEAPONS.filter(w =>
    STARTER_WEAPON_IDS.includes(w.id as typeof STARTER_WEAPON_IDS[number])
  );

  const [selectedId, setSelectedId] = useState<string>(ownedWeapons[0]?.id ?? "");

  const selectedWeapon = WEAPONS.find(w => w.id === selectedId) ?? ownedWeapons[0];

  return (
    <div
      style={{
        position:      "fixed", inset: 0,
        zIndex:        PANEL_Z,
        background:    tk.overlay,
        display:       "flex",
        alignItems:    "stretch",
        opacity:       open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transition:    `opacity ${PANEL_SLIDE_MS}ms ease`,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        display:    "flex",
        width:      "100%",
        height:     "100%",
        transform:  open ? "translateY(0)" : "translateY(40px)",
        transition: `transform ${PANEL_SLIDE_MS}ms cubic-bezier(0.22,1,0.36,1)`,
      }}>

        {/* ── Left: weapon list ────────────────────────────────────────────── */}
        <div style={{
          width:       SIDEBAR_W, flexShrink: 0,
          background:  tk.sidebarBg,
          borderRight: `1px solid ${tk.border}`,
          display:     "flex", flexDirection: "column",
          overflowY:   "auto",
        }}>
          {/* Header */}
          <div style={{
            padding:      "clamp(10px,2vh,18px) clamp(10px,1.5vw,16px) clamp(6px,1vh,10px)",
            borderBottom: `1px solid ${tk.border}`,
            flexShrink:   0,
          }}>
            <div style={{
              fontFamily:    FONT_NARROW, fontSize: BADGE_FS,
              color:         tk.accent,   letterSpacing: "0.2em",
            }}>SENJATA DIMILIKI</div>
            <div style={{
              fontFamily:    FONT_NARROW, fontSize: "clamp(6px,0.85vw,8px)",
              color:         tk.dimText,  letterSpacing: "0.12em",
              marginTop:     3,
            }}>{ownedWeapons.length} / {WEAPONS.length} TERBUKA</div>
          </div>

          {/* Weapon list */}
          <div style={{ padding: "clamp(6px,1.2vh,10px)", display: "flex", flexDirection: "column", gap: "clamp(4px,0.7vh,6px)" }}>
            {ownedWeapons.map(w => (
              <WeaponListItem
                key={w.id}
                weapon={w}
                isSelected={w.id === selectedId}
                onSelect={setSelectedId}
                tk={tk}
              />
            ))}

            {/* Locked weapons */}
            {WEAPONS.filter(w => !STARTER_WEAPON_IDS.includes(w.id as typeof STARTER_WEAPON_IDS[number])).map(w => (
              <WeaponListItem
                key={w.id}
                weapon={w}
                isSelected={false}
                onSelect={() => {}}
                tk={tk}
                locked
              />
            ))}
          </div>
        </div>

        {/* ── Right: weapon detail ─────────────────────────────────────────── */}
        <div style={{
          flex:       1, minWidth: 0,
          background: tk.contentBg,
          display:    "flex", flexDirection: "column",
          overflow:   "hidden",
        }}>
          {/* Top bar */}
          <div style={{
            display:        "flex", alignItems: "center",
            justifyContent: "space-between",
            padding:        "0 clamp(14px,2.2vw,24px)",
            height:         "clamp(44px,8vh,58px)",
            borderBottom:   `1px solid ${tk.border}`,
            flexShrink:     0,
          }}>
            <div style={{
              fontFamily:    FONT_NARROW, fontSize: BADGE_FS,
              color:         tk.accent,   letterSpacing: "0.2em",
            }}>INVENTORI</div>
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

          {/* Detail */}
          <div style={{ flex: 1, overflowY: "auto", padding: "clamp(14px,2.5vh,24px) clamp(16px,2.5vw,28px)" }}>
            {selectedWeapon ? (
              <WeaponDetail weapon={selectedWeapon} tk={tk} />
            ) : (
              <div style={{
                fontFamily: FONT_NARROW, fontSize: BODY_TEXT_FS,
                color: tk.dimText, letterSpacing: "0.12em",
              }}>Pilih senjata dari daftar</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Weapon list item ─────────────────────────────────────────────────────────
function WeaponListItem({
  weapon, isSelected, onSelect, tk, locked = false,
}: {
  weapon:     WeaponDef;
  isSelected: boolean;
  onSelect:   (id: string) => void;
  tk:         ReturnType<typeof getTheme>;
  locked?:    boolean;
}) {
  const typeColor = TYPE_COLOR[weapon.type];
  return (
    <button
      onClick={() => !locked && onSelect(weapon.id)}
      style={{
        display:       "flex", alignItems: "center",
        gap:           "clamp(8px,1.2vw,12px)",
        padding:       "clamp(7px,1.3vh,11px) clamp(8px,1.2vw,12px)",
        background:    isSelected ? tk.cardSel : tk.cardBg,
        border:        `1px solid ${isSelected ? typeColor : (locked ? "rgba(255,255,255,0.06)" : "transparent")}`,
        borderRadius:  4,
        cursor:        locked ? "default" : "pointer",
        opacity:       locked ? 0.4 : 1,
        textAlign:     "left",
        transition:    "background 0.13s, border-color 0.13s",
        position:      "relative",
      }}
      onMouseEnter={e => { if (!locked && !isSelected) e.currentTarget.style.background = tk.cardHover; }}
      onMouseLeave={e => { if (!locked && !isSelected) e.currentTarget.style.background = tk.cardBg; }}
    >
      <span style={{ fontSize: "clamp(16px,2.4vw,22px)", lineHeight: 1, opacity: locked ? 0.4 : 1 }}>
        {locked ? "🔒" : weapon.icon}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily:    FONT_PRIMARY, fontSize: WEAPON_NAME_FS,
          color:         isSelected ? typeColor : tk.bodyText,
          letterSpacing: "0.08em",
          whiteSpace:    "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{weapon.name}</div>
        <div style={{
          fontFamily:    FONT_NARROW, fontSize: WEAPON_TYPE_FS,
          color:         tk.dimText,  letterSpacing: "0.12em",
        }}>{TYPE_LABEL[weapon.type]}</div>
      </div>
      {/* Rarity pip */}
      <div style={{
        position:     "absolute", right: 6, top: 6,
        width:        5, height: 5,
        borderRadius: "50%",
        background:   RARITY_COLOR[weapon.rarity],
        flexShrink:   0,
      }} />
    </button>
  );
}

// ─── Weapon detail ────────────────────────────────────────────────────────────
function WeaponDetail({
  weapon, tk,
}: {
  weapon: WeaponDef;
  tk:     ReturnType<typeof getTheme>;
}) {
  const typeColor   = TYPE_COLOR[weapon.type];
  const rarColor    = RARITY_COLOR[weapon.rarity];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(14px,2.5vh,22px)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "clamp(10px,1.8vw,18px)" }}>
        <div style={{
          width:        "clamp(52px,8vw,72px)",
          height:       "clamp(52px,8vw,72px)",
          background:   tk.cardBg,
          border:       `1px solid ${typeColor}44`,
          borderRadius: 6,
          display:      "flex", alignItems: "center", justifyContent: "center",
          fontSize:     "clamp(24px,4vw,38px)", flexShrink: 0,
        }}>{weapon.icon}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily:    FONT_PRIMARY, fontSize: DETAIL_NAME_FS,
            color:         typeColor,    letterSpacing: "0.12em", lineHeight: 1,
          }}>{weapon.name}</div>
          <div style={{
            fontFamily:    FONT_NARROW, fontSize: DETAIL_TYPE_FS,
            color:         tk.dimText,  letterSpacing: "0.16em",
            marginTop:     4,
          }}>{TYPE_LABEL[weapon.type]}</div>
          <div style={{
            display:       "inline-flex", alignItems: "center",
            gap:           4,
            padding:       "2px 8px",
            background:    `${rarColor}18`,
            border:        `1px solid ${rarColor}44`,
            borderRadius:  3,
            marginTop:     6,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: rarColor }} />
            <span style={{
              fontFamily:    FONT_NARROW, fontSize: BADGE_FS,
              color:         rarColor,    letterSpacing: "0.14em",
            }}>{RARITY_LABEL[weapon.rarity]}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p style={{
        fontFamily:    FONT_NARROW, fontSize: BODY_TEXT_FS,
        color:         tk.bodyText,  lineHeight: 1.6,
        letterSpacing: "0.04em",    margin: 0,
        padding:       "clamp(8px,1.4vh,12px) clamp(10px,1.5vw,14px)",
        background:    tk.cardBg,
        border:        `1px solid ${tk.border}`,
        borderRadius:  4,
      }}>{weapon.description}</p>

      {/* Stats */}
      <div>
        <SectionTitle title="STATISTIK SENJATA" tk={tk} />
        <div style={{
          display:             "grid",
          gridTemplateColumns: "1fr 1fr",
          gap:                 "clamp(6px,1.1vh,10px)",
          marginTop:           "clamp(8px,1.4vh,12px)",
        }}>
          <StatBox label="DAMAGE"     value={weapon.stats.damage}   max={100} color={typeColor} tk={tk} />
          <StatBox label="MAGAZINE"   value={weapon.stats.ammo}     max={100} color={typeColor} tk={tk} raw />
          <StatBox label="JANGKAUAN"  value={weapon.stats.range}    max={100} color={typeColor} tk={tk} />
          <StatBox label="LAJU TEMBAK" value={weapon.stats.fireRate} max={100} color={typeColor} tk={tk} />
          <StatBox label="HANDLING"   value={weapon.stats.handling} max={100} color={typeColor} tk={tk} />
        </div>
      </div>

      {/* Attachments */}
      <div>
        <SectionTitle title="KUSTOMISASI" tk={tk} />
        <div style={{
          fontFamily:    FONT_NARROW, fontSize: BADGE_FS,
          color:         tk.dimText,  letterSpacing: "0.12em",
          marginBottom:  "clamp(8px,1.4vh,12px)",
          lineHeight:    1.5,
        }}>
          Slot modifikasi senjata. Attachment tersedia di update berikutnya.
        </div>
        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(clamp(100px,15vw,140px), 1fr))",
          gap:                 "clamp(6px,1.2vh,10px)",
        }}>
          {weapon.attachments.map(att => (
            <AttachmentSlot key={att.slot} att={att} tk={tk} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stat box ─────────────────────────────────────────────────────────────────
function StatBox({
  label, value, max, color, tk, raw = false,
}: {
  label: string; value: number; max: number; color: string;
  tk: ReturnType<typeof getTheme>; raw?: boolean;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{
      padding:      "clamp(8px,1.3vh,12px) clamp(10px,1.5vw,14px)",
      background:   tk.cardBg,
      border:       `1px solid ${tk.border}`,
      borderRadius: 4,
    }}>
      <div style={{
        fontFamily:    FONT_NARROW, fontSize: STAT_LABEL_FS,
        color:         tk.dimText,  letterSpacing: "0.14em",
        marginBottom:  "clamp(4px,0.7vh,6px)",
      }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{
          flex:         1, height: "clamp(3px,0.5vh,5px)",
          background:   tk.statTrack,
          borderRadius: 2, overflow: "hidden",
        }}>
          <div style={{
            width:        raw ? "100%" : `${pct}%`,
            height:       "100%",
            background:   color,
            borderRadius: 2,
            boxShadow:    `0 0 5px ${color}77`,
          }} />
        </div>
        <span style={{
          fontFamily: FONT_PRIMARY, fontSize: "clamp(9px,1.4vw,12px)",
          color:      color, letterSpacing: "0.06em",
          flexShrink: 0,
        }}>{value}</span>
      </div>
    </div>
  );
}

// ─── Attachment slot ──────────────────────────────────────────────────────────
function AttachmentSlot({
  att, tk,
}: {
  att: WeaponDef["attachments"][number];
  tk:  ReturnType<typeof getTheme>;
}) {
  return (
    <div style={{
      padding:      "clamp(8px,1.3vh,11px) clamp(8px,1.2vw,12px)",
      background:   tk.slotBg,
      border:       `1.5px dashed ${tk.slotBorder}`,
      borderRadius: 4,
      display:      "flex", flexDirection: "column",
      gap:          4,
      opacity:      0.65,
      cursor:       "default",
    }}>
      <div style={{
        fontFamily:    FONT_NARROW, fontSize: BADGE_FS,
        color:         tk.dimText,  letterSpacing: "0.16em",
      }}>{SLOT_LABEL[att.slot] ?? att.slot.toUpperCase()}</div>
      <div style={{
        fontFamily:    FONT_NARROW, fontSize: "clamp(6px,0.85vw,8px)",
        color:         tk.dimText,  letterSpacing: "0.10em",
        opacity:       0.7,
      }}>SEGERA HADIR</div>
    </div>
  );
}

// ─── Section title ────────────────────────────────────────────────────────────
function SectionTitle({ title, tk }: { title: string; tk: ReturnType<typeof getTheme> }) {
  return (
    <div style={{
      fontFamily:    FONT_NARROW, fontSize: BADGE_FS,
      color:         tk.dimText,  letterSpacing: "0.22em",
      paddingBottom: "clamp(5px,0.8vh,8px)",
      borderBottom:  `1px solid ${tk.border}`,
    }}>{title}</div>
  );
}
