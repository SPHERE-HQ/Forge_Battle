// ─── Core types ───────────────────────────────────────────────────────────────
export type Team        = "blue" | "red";
export type BotRole     = "leader" | "follower";
export type BotAIState  = "idle" | "roam" | "chase" | "attack" | "dead";
export type BattlePhase = "playing" | "won" | "lost";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// ─── Input (keyboard + mouse + joystick) ─────────────────────────────────────
export interface InputState {
  moveX:      number;   // -1..1 strafe
  moveZ:      number;   // -1..1 forward/back
  deltaYaw:   number;   // camera yaw delta (rad/frame)
  deltaPitch: number;   // camera pitch delta (rad/frame)
  fire:       boolean;
  interact:   boolean;
  sprint:     boolean;
}

// ─── Bot ─────────────────────────────────────────────────────────────────────
export interface BotInstance {
  id:           string;
  name:         string;
  team:         Team;
  role:         BotRole;
  characterId:  string;
  pos:          Vec3;
  yaw:          number;
  hp:           number;
  maxHp:        number;
  aiState:      BotAIState;
  weaponId:     string;
  fireCooldown: number;
  respawnTimer: number;
  roamTarget:   Vec3 | null;
  roamTimer:    number;
}

// ─── Bullet ───────────────────────────────────────────────────────────────────
export interface Bullet {
  id:     string;
  pos:    Vec3;
  vel:    Vec3;
  fromId: string;
  team:   Team;
  damage: number;
  ttl:    number;
  hit:    boolean;
}

// ─── Collectible ─────────────────────────────────────────────────────────────
export interface CoreBox {
  id:        string;
  color:     string;
  pos:       Vec3;
  collected: boolean;
}

// ─── Events ───────────────────────────────────────────────────────────────────
export interface KillEvent {
  killerId:   string;
  killerName: string;
  killerTeam: Team;
  victimId:   string;
  victimName: string;
  t:          number;
}

// ─── Config (passed from PreBattle) ──────────────────────────────────────────
export interface BattleConfig {
  killLimit:         number;
  timeLimitSec:      number;
  playerCharacterId: string;
  playerWeaponId:    string;
  playerName:        string;
}

// ─── Full game snapshot (read by HUD + renderer) ──────────────────────────────
export interface BattleState {
  phase:           BattlePhase;
  timeLeftSec:     number;
  playerPos:       Vec3;
  playerYaw:       number;
  cameraYaw:       number;
  cameraPitch:     number;
  playerHp:        number;
  playerMaxHp:     number;
  playerWeaponId:  string;
  playerAmmo:      number;
  playerMaxAmmo:   number;
  playerCoreBoxes: Record<string, number>;
  blueKills:       number;
  redKills:        number;
  killFeed:        KillEvent[];
  bots:            BotInstance[];
  bullets:         Bullet[];
  coreBoxes:       CoreBox[];
  nearMachineTeam: Team | null;
  winnerTeam:      Team | null;
  isReloading:     boolean;
}
