import { useCallback } from "react";
import {
  FONT_PRIMARY, FONT_NARROW,
  WEAPONS, WEAPON_RECIPES, BOT_RECIPE, CORE_BOX_META,
  type CoreBoxColor,
} from "../constants/game";
import type { BattleState } from "../game/battleTypes";

// ─── Layout ───────────────────────────────────────────────────────────────────
const PANEL_Z     = 70;
const ACCENT      = "#00ccff";
const PANEL_BG    = "rgba(10,14,30,0.97)";
const PANEL_BORDER= "rgba(0,204,255,0.30)";
const CARD_BG     = "rgba(255,255,255,0.05)";
const CARD_HOVER  = "rgba(0,204,255,0.10)";

interface Props {
  state:       BattleState;
  onCraft:     (weaponId: string) => boolean;
  onClose:     () => void;
}

export default function CraftingPanel({ state, onCraft, onClose }: Props) {
  const boxes = state.playerCoreBoxes;

  function canAfford(weaponId: string): boolean {
    const recipe = WEAPON_RECIPES[weaponId];
    if (!recipe) return false;
    return recipe.every(ing => (boxes[ing.color] ?? 0) >= ing.amount);
  }

  const handleCraft = useCallback((weaponId: string) => {
    if (canAfford(weaponId)) onCraft(weaponId);
  }, [boxes, onCraft]); // eslint-disable-line react-hooks/exhaustive-deps

  const craftableWeapons = WEAPONS.filter(w => WEAPON_RECIPES[w.id]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: PANEL_Z,
        background: "rgba(0,0,0,0.65)",
        display:    "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width:        "min(90vw, 680px)",
        maxHeight:    "85vh",
        background:   PANEL_BG,
        border:       `1px solid ${PANEL_BORDER}`,
        borderRadius: 8,
        display:      "flex", flexDirection: "column",
        overflow:     "hidden",
        boxShadow:    `0 0 40px ${ACCENT}22`,
      }}>

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div style={{
          display:        "flex", alignItems: "center", justifyContent: "space-between",
          padding:        "clamp(10px,2vh,16px) clamp(14px,2.5vw,22px)",
          borderBottom:   `1px solid ${PANEL_BORDER}`,
          background:     `${ACCENT}0a`,
          flexShrink:     0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "clamp(16px,2.5vw,22px)" }}>⚙</span>
            <div>
              <div style={{
                fontFamily: FONT_PRIMARY, fontSize: "clamp(13px,2vw,17px)",
                color: ACCENT, letterSpacing: "0.15em",
              }}>BUILDER MACHINE</div>
              <div style={{
                fontFamily: FONT_NARROW, fontSize: "clamp(7px,1vw,9px)",
                color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", marginTop: 2,
              }}>MARKAS TIM BIRU · CRAFT SENJATA</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: `1px solid rgba(255,255,255,0.2)`,
              borderRadius: 3, padding: "4px 10px",
              color: "rgba(255,255,255,0.5)", cursor: "pointer",
              fontFamily: FONT_NARROW, fontSize: "clamp(9px,1.2vw,11px)",
              letterSpacing: "0.1em",
            }}
          >ESC / TUTUP</button>
        </div>

        {/* ── Core box inventory ──────────────────────────────────────────────── */}
        <div style={{
          padding:      "clamp(8px,1.5vh,14px) clamp(14px,2.5vw,22px)",
          borderBottom: `1px solid ${PANEL_BORDER}`,
          flexShrink:   0,
        }}>
          <div style={{
            fontFamily: FONT_NARROW, fontSize: "clamp(7px,1vw,9px)",
            color: "rgba(255,255,255,0.4)", letterSpacing: "0.25em", marginBottom: 8,
          }}>CORE BOX TERSEDIA</div>
          <div style={{ display: "flex", gap: "clamp(6px,1vw,10px)", flexWrap: "wrap" }}>
            {(Object.entries(CORE_BOX_META) as [CoreBoxColor, typeof CORE_BOX_META[CoreBoxColor]][]).map(([color, meta]) => {
              const count = boxes[color] ?? 0;
              return (
                <div key={color} style={{
                  display:      "flex", alignItems: "center", gap: 5,
                  background:   count > 0 ? `${meta.hex}18` : CARD_BG,
                  border:       `1px solid ${count > 0 ? meta.hex + "55" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 4,
                  padding:      "5px 10px",
                  opacity:      count > 0 ? 1 : 0.4,
                }}>
                  <span style={{ fontSize: "clamp(14px,2vw,18px)" }}>{meta.emoji}</span>
                  <span style={{
                    fontFamily: FONT_PRIMARY, fontSize: "clamp(12px,1.8vw,16px)",
                    color: count > 0 ? meta.hex : "rgba(255,255,255,0.3)",
                  }}>×{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Weapon recipes ──────────────────────────────────────────────────── */}
        <div style={{
          flex:       1, overflowY: "auto",
          padding:    "clamp(8px,1.5vh,14px) clamp(14px,2.5vw,22px)",
          display:    "flex", flexDirection: "column", gap: "clamp(6px,1.2vh,10px)",
        }}>
          <div style={{
            fontFamily: FONT_NARROW, fontSize: "clamp(7px,1vw,9px)",
            color: "rgba(255,255,255,0.4)", letterSpacing: "0.25em", marginBottom: 4,
          }}>RESEP SENJATA</div>

          {craftableWeapons.map(weapon => {
            const recipe    = WEAPON_RECIPES[weapon.id]!;
            const affordable = canAfford(weapon.id);
            const isCurrent  = state.playerWeaponId === weapon.id;

            return (
              <WeaponCard
                key={weapon.id}
                weapon={weapon}
                recipe={recipe}
                affordable={affordable}
                isCurrent={isCurrent}
                boxes={boxes}
                onCraft={() => handleCraft(weapon.id)}
              />
            );
          })}

          {/* Bot recipe info */}
          <div style={{
            marginTop:    "clamp(4px,0.8vh,8px)",
            padding:      "clamp(8px,1.2vh,12px) clamp(10px,1.5vw,16px)",
            background:   CARD_BG,
            border:       "1px solid rgba(255,255,255,0.08)",
            borderRadius: 6,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: "clamp(14px,2vw,18px)" }}>🤖</span>
              <span style={{
                fontFamily: FONT_PRIMARY, fontSize: "clamp(9px,1.4vw,12px)",
                color: "#88aaff", letterSpacing: "0.1em",
              }}>PANGGIL BOT PENDUKUNG</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {BOT_RECIPE.map((ing, i) => {
                const meta  = CORE_BOX_META[ing.color as CoreBoxColor];
                const have  = boxes[ing.color] ?? 0;
                const enough= have >= ing.amount;
                return (
                  <IngredientBadge key={i} meta={meta} amount={ing.amount} have={have} enough={enough} />
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <div style={{
          padding:        "clamp(6px,1.2vh,10px) clamp(14px,2.5vw,22px)",
          borderTop:      `1px solid ${PANEL_BORDER}`,
          background:     `${ACCENT}06`,
          flexShrink:     0,
          fontFamily:     FONT_NARROW,
          fontSize:       "clamp(7px,1vw,9px)",
          color:          "rgba(255,255,255,0.3)",
          letterSpacing:  "0.15em",
          textAlign:      "center",
        }}>
          KUMPULKAN CORE BOX DI MAP · CRAFT SENJATA DI SINI · KALAHKAN MUSUH
        </div>
      </div>
    </div>
  );
}

// ─── WeaponCard ───────────────────────────────────────────────────────────────
function WeaponCard({
  weapon, recipe, affordable, isCurrent, boxes, onCraft,
}: {
  weapon:     typeof WEAPONS[number];
  recipe:     ReadonlyArray<{ color: string; amount: number }>;
  affordable: boolean;
  isCurrent:  boolean;
  boxes:      Record<string, number>;
  onCraft:    () => void;
}) {
  const TYPE_LABELS: Record<string, string> = {
    pistol: "PISTOL", smg: "SMG", ar: "ASSAULT RIFLE",
    shotgun: "SHOTGUN", sniper: "SNIPER", heavy: "HEAVY",
  };

  return (
    <div style={{
      display:      "flex", alignItems: "center", gap: "clamp(8px,1.5vw,14px)",
      background:   isCurrent ? `${ACCENT}12` : affordable ? CARD_HOVER : CARD_BG,
      border:       `1px solid ${isCurrent ? ACCENT + "55" : affordable ? ACCENT + "28" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 6,
      padding:      "clamp(8px,1.2vh,12px) clamp(10px,1.5vw,16px)",
      transition:   "background 0.15s",
    }}>
      {/* Weapon name + type */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily:    FONT_PRIMARY,
          fontSize:      "clamp(10px,1.5vw,13px)",
          color:         isCurrent ? ACCENT : affordable ? "#ffffff" : "rgba(255,255,255,0.5)",
          letterSpacing: "0.1em",
          whiteSpace:    "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {isCurrent && <span style={{ marginRight: 6, color: ACCENT }}>✓</span>}
          {weapon.name}
        </div>
        <div style={{
          fontFamily: FONT_NARROW, fontSize: "clamp(7px,1vw,9px)",
          color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", marginTop: 2,
        }}>{TYPE_LABELS[weapon.type] ?? weapon.type.toUpperCase()}</div>
      </div>

      {/* Stats mini-bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0, width: 60 }}>
        <StatBar label="DMG" value={weapon.stats.damage} max={100} color="#ff6644" />
        <StatBar label="AMO" value={weapon.stats.ammo}   max={100} color="#44aaff" />
        <StatBar label="RNG" value={weapon.stats.range}  max={100} color="#44ff88" />
      </div>

      {/* Recipe */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0, flexWrap: "wrap", maxWidth: 120 }}>
        {recipe.map((ing, i) => {
          const meta  = CORE_BOX_META[ing.color as CoreBoxColor];
          const have  = boxes[ing.color] ?? 0;
          const enough= have >= ing.amount;
          return (
            <IngredientBadge key={i} meta={meta} amount={ing.amount} have={have} enough={enough} />
          );
        })}
      </div>

      {/* Craft button */}
      {isCurrent ? (
        <div style={{
          flexShrink: 0,
          fontFamily: FONT_NARROW, fontSize: "clamp(8px,1.1vw,10px)",
          color: ACCENT, letterSpacing: "0.1em",
          border: `1px solid ${ACCENT}44`, borderRadius: 3,
          padding: "5px 10px",
        }}>AKTIF</div>
      ) : (
        <button
          onClick={onCraft}
          disabled={!affordable}
          style={{
            flexShrink:   0,
            height:       "clamp(28px,4.5vh,36px)",
            padding:      "0 clamp(10px,1.5vw,14px)",
            background:   affordable ? `linear-gradient(135deg, ${ACCENT}44, ${ACCENT}22)` : "rgba(255,255,255,0.04)",
            border:       `1px solid ${affordable ? ACCENT + "88" : "rgba(255,255,255,0.12)"}`,
            borderRadius: 4,
            cursor:       affordable ? "pointer" : "not-allowed",
            color:        affordable ? ACCENT : "rgba(255,255,255,0.25)",
            fontFamily:   FONT_NARROW,
            fontSize:     "clamp(8px,1.1vw,10px)",
            letterSpacing:"0.12em",
            transition:   "background 0.15s",
            whiteSpace:   "nowrap",
          }}
        >
          {affordable ? "CRAFT ⚡" : "KURANG"}
        </button>
      )}
    </div>
  );
}

// ─── IngredientBadge ──────────────────────────────────────────────────────────
function IngredientBadge({ meta, amount, have, enough }: {
  meta:   typeof CORE_BOX_META[CoreBoxColor];
  amount: number;
  have:   number;
  enough: boolean;
}) {
  return (
    <div style={{
      display:      "flex", alignItems: "center", gap: 3,
      background:   enough ? `${meta.hex}18` : "rgba(255,0,0,0.08)",
      border:       `1px solid ${enough ? meta.hex + "55" : "rgba(255,80,80,0.3)"}`,
      borderRadius: 3, padding: "2px 6px",
    }}>
      <span style={{ fontSize: "clamp(10px,1.4vw,13px)" }}>{meta.emoji}</span>
      <span style={{
        fontFamily: FONT_NARROW, fontSize: "clamp(8px,1.1vw,10px)",
        color: enough ? meta.hex : "#ff6666",
      }}>{have}/{amount}</span>
    </div>
  );
}

// ─── StatBar ──────────────────────────────────────────────────────────────────
function StatBar({ label, value, max, color }: {
  label: string; value: number; max: number; color: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{
        fontFamily: FONT_NARROW, fontSize: "clamp(6px,0.85vw,8px)",
        color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em",
        width: 24, flexShrink: 0,
      }}>{label}</span>
      <div style={{
        flex: 1, height: 3,
        background: "rgba(255,255,255,0.1)", borderRadius: 2,
      }}>
        <div style={{
          width: `${Math.min(100, (value / max) * 100)}%`,
          height: "100%", background: color, borderRadius: 2,
        }} />
      </div>
    </div>
  );
}
