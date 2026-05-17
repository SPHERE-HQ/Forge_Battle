import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  FONT_PRIMARY, FONT_NARROW,
  CORE_BOX_META,
} from "../constants/game";
import type { BattleState, BattleConfig, InputState, Team } from "../game/battleTypes";
import type { HUDSettings } from "../game/hudSettings";
import { DEFAULT_HUD } from "../game/hudSettings";

// ─── Layout constants ─────────────────────────────────────────────────────────
const CROSSHAIR_SRC    = "/assets/crosshairs/crosshair025.png";
const CROSSHAIR_SIZE   = 40;
const HUD_Z            = 50;
const OVERLAY_Z        = 60;
const HP_BAR_W         = "clamp(110px, 18vw, 160px)";
const HP_BAR_H         = "clamp(7px, 1.2vh, 11px)";
const AMMO_FS          = "clamp(18px, 3.5vw, 28px)";
const AMMO_SUB_FS      = "clamp(10px, 1.6vw, 14px)";
const KILL_FS          = "clamp(16px, 2.8vw, 22px)";
const TIMER_FS         = "clamp(11px, 1.8vw, 15px)";
const FEED_FS          = "clamp(8px, 1.2vw, 10px)";
const COREBOX_FS       = "clamp(12px, 2vw, 16px)";
const HINT_FS          = "clamp(9px, 1.4vw, 12px)";
const HP_LOW_THRESH    = 30;

const TEAM_COLOR: Record<Team, string> = { blue: "#4488ff", red: "#ff4444" };

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface Props {
  state:         BattleState;
  config:        BattleConfig;
  hudSettings:   HUDSettings;
  onEnd:         (won: boolean, kills: number) => void;
  onMobileInput: (inp: Partial<InputState>) => void;
  isMobile:      boolean;
}

// Build a position style from HUD settings — always fixed, top-left anchored
function posStyle(x: number, y: number, scale: number): CSSProperties {
  return {
    position:        "fixed",
    left:            `${x}vw`,
    top:             `${y}vh`,
    transform:       scale !== 1 ? `scale(${scale})` : undefined,
    transformOrigin: "top left",
    zIndex:          HUD_Z,
  };
}

export default function BattleHUD({ state, config, hudSettings, onEnd, isMobile, onMobileInput }: Props) {
  const hpPct     = (state.playerHp / state.playerMaxHp) * 100;
  const ammoPct   = state.playerMaxAmmo > 0 ? (state.playerAmmo / state.playerMaxAmmo) * 100 : 0;
  const isLowHp   = state.playerHp < HP_LOW_THRESH;
  const isPlaying = state.phase === "playing";
  const hs        = hudSettings;

  return (
    <>
      {isPlaying && (
        <>
          {/* ── Health bar ──────────────────────────────────────────────── */}
          <HealthBar
            hp={state.playerHp} maxHp={state.playerMaxHp} pct={hpPct} isLow={isLowHp}
            pos={hs.healthBar}
          />

          {/* ── Kill score + timer ──────────────────────────────────────── */}
          <ScoreTimer state={state} config={config} pos={hs.scoreTimer} />

          {/* ── Kill feed ───────────────────────────────────────────────── */}
          <KillFeed state={state} pos={hs.killFeed} />

          {/* ── Ammo ────────────────────────────────────────────────────── */}
          <AmmoDisplay state={state} ammoPct={ammoPct} pos={hs.ammo} />

          {/* ── Core box inventory (bottom-left, fixed for now) ─────────── */}
          <CoreBoxDisplay boxes={state.playerCoreBoxes} />

          {/* ── Crosshair (always center, not customizable) ─────────────── */}
          <div style={{
            position:  "fixed",
            top:       "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex:    HUD_Z,
            pointerEvents: "none",
          }}>
            <img
              src={CROSSHAIR_SRC}
              width={CROSSHAIR_SIZE}
              height={CROSSHAIR_SIZE}
              alt=""
              style={{ opacity: 0.9, filter: state.isReloading ? "brightness(0.5)" : "none" }}
            />
          </div>

          {/* ── Near machine hint ──────────────────────────────────────── */}
          {state.nearMachineTeam === "blue" && <InteractHint />}

          {/* ── Reload indicator ───────────────────────────────────────── */}
          {state.isReloading && <ReloadIndicator />}

          {/* ── Low HP vignette ────────────────────────────────────────── */}
          {isLowHp && (
            <div style={{
              position:      "fixed", inset: 0,
              zIndex:        HUD_Z - 5,
              pointerEvents: "none",
              background:    "radial-gradient(ellipse at center, transparent 40%, rgba(255,0,0,0.30) 100%)",
              animation:     "hud-pulse 0.9s ease-in-out infinite",
            }} />
          )}

          {/* ── Mobile controls ────────────────────────────────────────── */}
          {isMobile && (
            <MobileHUDControls
              onInput={onMobileInput}
              firePos={hs.fireButton}
              interactPos={hs.interactButton}
            />
          )}
        </>
      )}

      {/* ── Leader bot respawn timer ─────────────────────────────────── */}
      {isPlaying && (() => {
        const leaderBot = state.bots.find(b => b.team === "blue" && b.role === "leader" && b.aiState === "dead");
        return leaderBot && leaderBot.respawnTimer > 0
          ? <LeaderRespawnTimer seconds={leaderBot.respawnTimer} />
          : null;
      })()}

      {/* ── Game Over overlay ──────────────────────────────────────────── */}
      {!isPlaying && (
        <GameOverOverlay state={state} config={config} onEnd={onEnd} />
      )}

      <style>{`
        @keyframes hud-pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes hud-pop   { 0%{transform:scale(1.4);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes hud-slide { 0%{transform:translateX(20px);opacity:0} 100%{transform:translateX(0);opacity:1} }
      `}</style>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function HealthBar({ hp, maxHp, pct, isLow, pos }: {
  hp: number; maxHp: number; pct: number; isLow: boolean;
  pos: { x: number; y: number; scale: number };
}) {
  return (
    <div style={{
      ...posStyle(pos.x, pos.y, pos.scale),
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{
        fontFamily: FONT_NARROW, fontSize: "clamp(7px,1vw,9px)",
        color: isLow ? "#ff4444" : "#ffffff88", letterSpacing: "0.2em",
      }}>HP</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: HP_BAR_W, height: HP_BAR_H,
          background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 3, overflow: "hidden",
        }}>
          <div style={{
            width:      `${pct}%`, height: "100%",
            background: isLow ? "#ff2222" : `linear-gradient(90deg, #22cc44, #44ff88)`,
            borderRadius: 3,
            transition: "width 0.2s ease",
            boxShadow:  isLow ? "0 0 8px #ff2222" : "0 0 6px #33ff66",
          }} />
        </div>
        <span style={{
          fontFamily: FONT_PRIMARY, fontSize: "clamp(10px,1.6vw,13px)",
          color: isLow ? "#ff4444" : "#ffffff", letterSpacing: "0.05em",
        }}>{hp} / {maxHp}</span>
      </div>
    </div>
  );
}

function ScoreTimer({ state, config, pos }: {
  state: BattleState; config: BattleConfig;
  pos: { x: number; y: number; scale: number };
}) {
  const timeIsLow = state.timeLeftSec < 30;
  return (
    <div style={{
      ...posStyle(pos.x, pos.y, pos.scale),
      display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    }}>
      {/* Score */}
      <div style={{
        display: "flex", alignItems: "center", gap: "clamp(8px,1.5vw,14px)",
        background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 4, padding: "4px 14px",
      }}>
        <span style={{ fontFamily: FONT_PRIMARY, fontSize: KILL_FS, color: TEAM_COLOR.blue }}>
          {state.blueKills}
        </span>
        <span style={{ fontFamily: FONT_NARROW, fontSize: "clamp(7px,1vw,9px)", color: "#ffffff66", letterSpacing: "0.2em" }}>
          / {config.killLimit}
        </span>
        <span style={{ fontFamily: FONT_NARROW, fontSize: "clamp(10px,1.5vw,12px)", color: "#ffffff55" }}>:</span>
        <span style={{ fontFamily: FONT_PRIMARY, fontSize: KILL_FS, color: TEAM_COLOR.red }}>
          {state.redKills}
        </span>
      </div>
      {/* Timer */}
      <div style={{
        fontFamily:    FONT_NARROW, fontSize: TIMER_FS,
        color:         timeIsLow ? "#ff4444" : "#ffffffaa",
        letterSpacing: "0.15em",
        animation:     timeIsLow ? "hud-pulse 0.9s infinite" : "none",
      }}>
        ⏱ {formatTime(state.timeLeftSec)}
      </div>
    </div>
  );
}

function KillFeed({ state, pos }: {
  state: BattleState;
  pos: { x: number; y: number; scale: number };
}) {
  return (
    <div style={{
      ...posStyle(pos.x, pos.y, pos.scale),
      display: "flex", flexDirection: "column", gap: 4,
      maxWidth: "clamp(160px,25vw,220px)",
    }}>
      {state.killFeed.slice(0, 5).map((evt, i) => (
        <div key={i} style={{
          display:    "flex", alignItems: "center", gap: 4,
          background: "rgba(0,0,0,0.55)",
          border:     `1px solid ${TEAM_COLOR[evt.killerTeam]}33`,
          borderRadius: 3,
          padding:    "3px 8px",
          animation:  "hud-slide 0.2s ease",
        }}>
          <span style={{
            fontFamily: FONT_NARROW, fontSize: FEED_FS,
            color: TEAM_COLOR[evt.killerTeam], letterSpacing: "0.06em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 80,
          }}>{evt.killerName}</span>
          <span style={{ fontSize: "clamp(8px,1.1vw,10px)", opacity: 0.8 }}>💀</span>
          <span style={{
            fontFamily: FONT_NARROW, fontSize: FEED_FS,
            color: "#ffffffaa", letterSpacing: "0.06em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 80,
          }}>{evt.victimName}</span>
        </div>
      ))}
    </div>
  );
}

function AmmoDisplay({ state, ammoPct, pos }: {
  state: BattleState; ammoPct: number;
  pos: { x: number; y: number; scale: number };
}) {
  const isLowAmmo = state.playerAmmo <= Math.floor(state.playerMaxAmmo * 0.25);
  return (
    <div style={{
      ...posStyle(pos.x, pos.y, pos.scale),
      display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3,
    }}>
      {state.isReloading && (
        <div style={{
          fontFamily: FONT_NARROW, fontSize: "clamp(7px,1vw,9px)",
          color: "#ffaa00", letterSpacing: "0.2em",
          animation: "hud-pulse 0.7s ease-in-out infinite",
        }}>RELOADING...</div>
      )}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{
          fontFamily: FONT_PRIMARY, fontSize: AMMO_FS,
          color: isLowAmmo ? "#ff4444" : "#ffffff", letterSpacing: "0.05em",
          textShadow: isLowAmmo ? "0 0 10px #ff4444" : "none",
          animation: (isLowAmmo && !state.isReloading) ? "hud-pulse 0.6s infinite" : "none",
        }}>{state.playerAmmo}</span>
        <span style={{
          fontFamily: FONT_NARROW, fontSize: AMMO_SUB_FS,
          color: "#ffffff55", letterSpacing: "0.06em",
        }}>/ {state.playerMaxAmmo}</span>
      </div>
      {/* Ammo bar */}
      <div style={{
        width: "clamp(70px,12vw,100px)", height: 3,
        background: "rgba(255,255,255,0.15)", borderRadius: 2,
      }}>
        <div style={{
          width: `${ammoPct}%`, height: "100%", borderRadius: 2,
          background: isLowAmmo ? "#ff4444" : "#44aaff",
          transition: "width 0.1s ease",
        }} />
      </div>
      <div style={{
        fontFamily: FONT_NARROW, fontSize: "clamp(7px,1vw,9px)",
        color: "#ffffffaa", letterSpacing: "0.2em",
      }}>{state.playerWeaponId.replace(/_/g, " ").toUpperCase()}</div>
    </div>
  );
}

function CoreBoxDisplay({ boxes }: { boxes: Record<string, number> }) {
  const entries = Object.entries(boxes).filter(([, n]) => n > 0);
  if (entries.length === 0) return null;
  return (
    <div style={{
      position: "fixed", bottom: "clamp(12px,2.5vh,20px)", left: "clamp(12px,2vw,20px)",
      zIndex: HUD_Z, display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{
        fontFamily: FONT_NARROW, fontSize: "clamp(6px,0.9vw,8px)",
        color: "#ffffff55", letterSpacing: "0.2em", marginBottom: 2,
      }}>CORE BOX</div>
      <div style={{ display: "flex", gap: "clamp(4px,0.8vw,7px)", flexWrap: "wrap", maxWidth: 140 }}>
        {entries.map(([color, n]) => {
          const meta = CORE_BOX_META[color as keyof typeof CORE_BOX_META];
          return meta ? (
            <div key={color} style={{
              display: "flex", alignItems: "center", gap: 2,
              background: `${meta.hex}22`, border: `1px solid ${meta.hex}55`,
              borderRadius: 3, padding: "2px 6px",
            }}>
              <span style={{ fontSize: COREBOX_FS }}>{meta.emoji}</span>
              <span style={{
                fontFamily: FONT_PRIMARY, fontSize: "clamp(9px,1.4vw,12px)",
                color: meta.hex,
              }}>×{n}</span>
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}

function InteractHint() {
  return (
    <div style={{
      position:  "fixed", bottom: "clamp(80px,15vh,110px)", left: "50%",
      transform: "translateX(-50%)", zIndex: HUD_Z,
      background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,140,0,0.5)",
      borderRadius: 4, padding: "6px 16px",
    }}>
      <span style={{
        fontFamily: FONT_NARROW, fontSize: HINT_FS,
        color: "#ff9900", letterSpacing: "0.18em",
      }}>[ E ] BUKA BUILDER MACHINE</span>
    </div>
  );
}

function ReloadIndicator() {
  return (
    <div style={{
      position:  "fixed", top: "55%", left: "50%",
      transform: "translate(-50%, -50%)", zIndex: HUD_Z,
      fontFamily: FONT_NARROW, fontSize: "clamp(9px,1.4vw,12px)",
      color: "#ffaa00", letterSpacing: "0.25em",
      textShadow: "0 0 10px #ffaa00",
    }}>RELOADING</div>
  );
}

// ─── Leader Respawn Timer ─────────────────────────────────────────────────────
function LeaderRespawnTimer({ seconds }: { seconds: number }) {
  const s = Math.ceil(seconds);
  return (
    <div style={{
      position:  "fixed", top: "clamp(60px,10vh,80px)", left: "50%",
      transform: "translateX(-50%)", zIndex: HUD_Z,
      display:   "flex", flexDirection: "column", alignItems: "center", gap: 2,
      background: "rgba(0,10,30,0.75)",
      border:     "1px solid rgba(68,136,255,0.35)",
      borderRadius: 4, padding: "5px 14px",
      pointerEvents: "none",
    }}>
      <div style={{
        fontFamily: FONT_NARROW, fontSize: "clamp(6px,0.9vw,8px)",
        color: "rgba(68,136,255,0.7)", letterSpacing: "0.2em",
      }}>PEMIMPIN BOT MATI</div>
      <div style={{
        fontFamily: FONT_PRIMARY, fontSize: "clamp(11px,1.8vw,15px)",
        color: "#4488ff", letterSpacing: "0.15em",
      }}>RESPAWN {s}s</div>
    </div>
  );
}

// ─── Game Over Overlay ────────────────────────────────────────────────────────
function GameOverOverlay({ state, config, onEnd }: {
  state:  BattleState;
  config: BattleConfig;
  onEnd:  (won: boolean, kills: number) => void;
}) {
  const won = state.phase === "won";
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position:   "fixed", inset: 0, zIndex: OVERLAY_Z,
      background: won ? "rgba(0,20,0,0.80)" : "rgba(20,0,0,0.82)",
      display:    "flex", alignItems: "center", justifyContent: "center",
      opacity:    show ? 1 : 0,
      transition: "opacity 0.6s ease",
    }}>
      <div style={{
        display:       "flex", flexDirection: "column", alignItems: "center",
        gap:           "clamp(12px,2.5vh,22px)",
        transform:     show ? "scale(1)" : "scale(0.85)",
        transition:    "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <div style={{ fontSize: "clamp(40px,8vw,70px)", lineHeight: 1 }}>
          {won ? "🏆" : "💀"}
        </div>
        <div style={{
          fontFamily:    FONT_PRIMARY,
          fontSize:      "clamp(22px,5vw,40px)",
          color:         won ? "#44ff88" : "#ff4444",
          letterSpacing: "0.2em",
          textShadow:    `0 0 30px ${won ? "#44ff88" : "#ff4444"}`,
        }}>
          {won ? "KEMENANGAN!" : "KEKALAHAN!"}
        </div>

        {/* Score */}
        <div style={{
          display:    "flex", gap: "clamp(24px,4vw,40px)", alignItems: "center",
          background: "rgba(255,255,255,0.06)",
          border:     "1px solid rgba(255,255,255,0.12)",
          borderRadius: 6, padding: "clamp(10px,2vh,18px) clamp(20px,4vw,36px)",
        }}>
          <ScorePill team="blue" kills={state.blueKills} label="TIM BIRU" />
          <div style={{
            fontFamily: FONT_NARROW, fontSize: "clamp(8px,1.2vw,10px)",
            color: "#ffffff44", letterSpacing: "0.2em",
          }}>VS</div>
          <ScorePill team="red" kills={state.redKills} label="TIM MERAH" />
        </div>

        {/* Time */}
        <div style={{
          fontFamily: FONT_NARROW, fontSize: "clamp(9px,1.4vw,12px)",
          color: "#ffffff66", letterSpacing: "0.2em",
        }}>
          {config.killLimit} KILL LIMIT · {formatTime(config.timeLimitSec - state.timeLeftSec)} PLAYED
        </div>

        {/* VRX Reward (win only) */}
        {won && (() => {
          const VRX_BASE = 10, VRX_PER_K = 10;
          const earned = VRX_BASE + state.blueKills * VRX_PER_K;
          return (
            <div style={{
              display:      "flex", alignItems: "center", gap: 8,
              background:   "rgba(255,204,0,0.10)",
              border:       "1px solid rgba(255,204,0,0.35)",
              borderRadius: 4, padding: "6px 18px",
            }}>
              <span style={{ fontSize: "clamp(14px,2vw,18px)" }}>💎</span>
              <div>
                <div style={{
                  fontFamily: FONT_NARROW, fontSize: "clamp(6px,0.9vw,8px)",
                  color: "rgba(255,204,0,0.6)", letterSpacing: "0.2em",
                }}>REWARD VRX</div>
                <div style={{
                  fontFamily: FONT_PRIMARY, fontSize: "clamp(14px,2.2vw,18px)",
                  color: "#ffcc00", letterSpacing: "0.1em",
                }}>+{earned} VRX</div>
              </div>
            </div>
          );
        })()}

        <button
          onClick={() => onEnd(won, state.blueKills)}
          style={{
            marginTop:    "clamp(8px,1.5vh,14px)",
            height:       "clamp(40px,7vh,54px)",
            padding:      "0 clamp(28px,5vw,50px)",
            background:   won ? "linear-gradient(135deg, #22aa44cc, #44ff88aa)" : "linear-gradient(135deg, #aa2222cc, #ff4444aa)",
            border:       `1px solid ${won ? "#44ff88" : "#ff4444"}`,
            borderRadius: 4,
            cursor:       "pointer",
            color:        "#fff",
            fontFamily:   FONT_PRIMARY,
            fontSize:     "clamp(12px,2vw,16px)",
            letterSpacing:"0.22em",
            boxShadow:    `0 0 20px ${won ? "#44ff8855" : "#ff444455"}`,
          }}
        >
          KEMBALI KE LOBBY
        </button>
      </div>
    </div>
  );
}

function ScorePill({ team, kills, label }: { team: Team; kills: number; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{
        fontFamily: FONT_PRIMARY, fontSize: "clamp(22px,4vw,34px)",
        color: TEAM_COLOR[team], letterSpacing: "0.1em",
      }}>{kills}</div>
      <div style={{
        fontFamily: FONT_NARROW, fontSize: "clamp(7px,1vw,9px)",
        color: TEAM_COLOR[team], letterSpacing: "0.18em", opacity: 0.85,
      }}>{label}</div>
    </div>
  );
}

// ─── Mobile HUD Controls (fire + interact) ────────────────────────────────────
function MobileHUDControls({ onInput, firePos, interactPos }: {
  onInput:      (inp: Partial<InputState>) => void;
  firePos:      { x: number; y: number; scale: number };
  interactPos:  { x: number; y: number; scale: number };
}) {
  const BASE_BTN = 68;  // px

  return (
    <>
      {/* Fire button */}
      <div
        style={{
          position:     "fixed",
          left:         `${firePos.x}vw`,
          top:          `${firePos.y}vh`,
          zIndex:       HUD_Z + 2,
          width:        BASE_BTN * firePos.scale,
          height:       BASE_BTN * firePos.scale,
          borderRadius: "50%",
          background:   "rgba(255,60,60,0.30)",
          border:       "2.5px solid rgba(255,80,80,0.70)",
          display:      "flex", alignItems: "center", justifyContent: "center",
          userSelect:   "none",
          touchAction:  "none",
        }}
        onPointerDown={() => onInput({ fire: true  })}
        onPointerUp={() =>   onInput({ fire: false })}
        onPointerLeave={() => onInput({ fire: false })}
      >
        <span style={{ fontSize: BASE_BTN * firePos.scale * 0.4 }}>🔥</span>
      </div>

      {/* Interact button */}
      <div
        style={{
          position:     "fixed",
          left:         `${interactPos.x}vw`,
          top:          `${interactPos.y}vh`,
          zIndex:       HUD_Z + 2,
          width:        BASE_BTN * interactPos.scale * 0.75,
          height:       BASE_BTN * interactPos.scale * 0.75,
          borderRadius: "50%",
          background:   "rgba(255,140,0,0.25)",
          border:       "2px solid rgba(255,140,0,0.55)",
          display:      "flex", alignItems: "center", justifyContent: "center",
          userSelect:   "none",
          touchAction:  "none",
        }}
        onPointerDown={() => onInput({ interact: true  })}
        onPointerUp={() =>   onInput({ interact: false })}
      >
        <span style={{
          fontSize:      BASE_BTN * interactPos.scale * 0.3,
          fontFamily:    FONT_NARROW,
          color:         "#ffaa00",
          letterSpacing: "0.1em",
        }}>E</span>
      </div>
    </>
  );
}
