import type {
  BattleConfig, BattleState, InputState,
  BotInstance, Bullet, CoreBox, KillEvent, Team, Vec3,
} from "./battleTypes";
import MAP_LAYOUT from "./mapLayout";
import { WEAPONS, WEAPON_RECIPES, CHARACTERS, CHARACTER_BIOS } from "../constants/game";

// ─── Game constants (no magic numbers in logic below) ─────────────────────────
const PLAYER_SPEED       = 7.0;
const PLAYER_MAX_HP      = 100;
const PLAYER_RADIUS      = 0.5;
const PLAYER_INV_SEC     = 0.4;

const BOT_SPEED_CHASE    = 3.8;
const BOT_SPEED_ROAM     = 2.0;
const BOT_RADIUS         = 0.45;
const BOT_MAX_HP         = 80;
const BOT_CHASE_RANGE    = 35;
const BOT_ATTACK_RANGE   = 20;
const BOT_FIRE_INTERVAL  = 1.5;
const BOT_FIRE_JITTER    = 0.5;
const BOT_DAMAGE         = 16;
const BOT_ROAM_RANGE     = 14;
const BOT_ROAM_TIMER_MIN = 3.0;
const BOT_ROAM_TIMER_MAX = 7.0;
const BOT_ARRIVE_RADIUS  = 1.5;
const LEADER_RESPAWN_SEC = 10;

const BULLET_SPEED       = 48;
const BULLET_TTL         = 1.0;
const BULLET_HIT_RADIUS  = 0.55;

const CORE_BOX_RANGE     = 1.8;
const MACHINE_RANGE      = 3.5;
const MAP_HALF           = 54;
const CAM_PITCH_MIN      = -0.32;
const CAM_PITCH_MAX      = 0.60;
const MOUSE_SENSITIVITY  = 1.0;
const KILL_FEED_LIFETIME = 6.0;

const WEAPON_FIRE_INTERVAL: Record<string, number> = {
  pistol:  0.48,
  smg:     0.11,
  ar:      0.14,
  shotgun: 0.75,
  sniper:  1.10,
  lmg:     0.11,
  heavy:   1.90,
};

const RELOAD_TIME: Record<string, number> = {
  pistol:  1.2,
  smg:     1.8,
  ar:      2.0,
  shotgun: 2.2,
  sniper:  2.5,
  lmg:     3.0,
  heavy:   3.5,
};

const BOT_NAMES = [
  "Raven", "Shadow", "Viper", "Ghost", "Titan",
  "Storm", "Blaze", "Nova",  "Lynx",  "Apex",
];

let bulletId = 0;

function dist2d(a: Vec3, b: Vec3) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

// ─── BattleEngine ─────────────────────────────────────────────────────────────
export class BattleEngine {
  state: BattleState;

  private config:             BattleConfig;
  private playerFireCooldown: number = 0;
  private playerInvTimer:     number = 0;
  private reloadTimer:        number = 0;

  constructor(config: BattleConfig) {
    this.config = config;

    // Resolve player max HP from character bio stats (each character has unique HP)
    const charBio    = CHARACTER_BIOS[config.playerCharacterId as keyof typeof CHARACTER_BIOS];
    const resolvedMaxHp = charBio ? charBio.stats.hp : PLAYER_MAX_HP;

    const weaponDef  = WEAPONS.find(w => w.id === config.playerWeaponId);
    const startAmmo  = weaponDef?.stats.ammo ?? 0;

    const bots: BotInstance[] = MAP_LAYOUT.botSpawns.map((s, i) => ({
      id:           s.id,
      name:         BOT_NAMES[i % BOT_NAMES.length],
      team:         s.team,
      role:         s.role,
      characterId:  "specter",
      pos:          { ...s.pos },
      yaw:          s.yaw,
      hp:           BOT_MAX_HP,
      maxHp:        BOT_MAX_HP,
      aiState:      "idle" as const,
      weaponId:     "m9_pistol",
      fireCooldown: Math.random() * BOT_FIRE_INTERVAL,
      respawnTimer: 0,
      roamTarget:   null,
      roamTimer:    0,
    }));

    const coreBoxes: CoreBox[] = MAP_LAYOUT.coreBoxSpawns.map((c, i) => ({
      id:        `box_${i}`,
      color:     c.color,
      pos:       { ...c.pos },
      collected: false,
    }));

    this.state = {
      phase:           "playing",
      timeLeftSec:     config.timeLimitSec,
      playerPos:       { ...MAP_LAYOUT.playerSpawn },
      playerYaw:       MAP_LAYOUT.playerSpawnYaw,
      cameraYaw:       MAP_LAYOUT.playerSpawnYaw,
      cameraPitch:     0.12,
      playerHp:        resolvedMaxHp,
      playerMaxHp:     resolvedMaxHp,
      playerWeaponId:  config.playerWeaponId,
      playerAmmo:      startAmmo,
      playerMaxAmmo:   startAmmo,
      playerCoreBoxes: {},
      blueKills:       0,
      redKills:        0,
      killFeed:        [],
      bots,
      bullets:         [],
      coreBoxes,
      nearMachineTeam: null,
      winnerTeam:      null,
      isReloading:     false,
    };
  }

  // ─── Main update ────────────────────────────────────────────────────────────
  update(dt: number, input: InputState) {
    if (this.state.phase !== "playing") return;

    this.state.timeLeftSec = Math.max(0, this.state.timeLeftSec - dt);

    this.updateCamera(dt, input);
    this.updatePlayer(dt, input);
    this.updateBots(dt);
    this.updateBullets(dt);
    this.checkCoreBoxPickup();
    this.checkMachineProximity();
    this.cleanupKillFeed();
    this.checkWinCondition();
  }

  // ─── Camera ─────────────────────────────────────────────────────────────────
  private updateCamera(_dt: number, input: InputState) {
    this.state.cameraYaw   += input.deltaYaw   * MOUSE_SENSITIVITY;
    this.state.cameraPitch += input.deltaPitch * MOUSE_SENSITIVITY;
    this.state.cameraPitch  = clamp(this.state.cameraPitch, CAM_PITCH_MIN, CAM_PITCH_MAX);
    this.state.playerYaw    = this.state.cameraYaw;
  }

  // ─── Player ─────────────────────────────────────────────────────────────────
  private updatePlayer(dt: number, input: InputState) {
    const yaw = this.state.cameraYaw;
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);

    const dx = sin * input.moveZ + cos * input.moveX;
    const dz = cos * input.moveZ - sin * input.moveX;
    const len = Math.sqrt(dx * dx + dz * dz);

    if (len > 0.01) {
      const spd = input.sprint ? PLAYER_SPEED * 1.5 : PLAYER_SPEED;
      const nx  = this.state.playerPos.x + (dx / len) * spd * dt;
      const nz  = this.state.playerPos.z + (dz / len) * spd * dt;
      this.state.playerPos.x = clamp(nx, -MAP_HALF, MAP_HALF);
      this.state.playerPos.z = clamp(nz, -MAP_HALF, MAP_HALF);
      this.resolvePlayerBuildingCollision();
    }

    // Timers
    this.playerFireCooldown -= dt;
    this.playerInvTimer     -= dt;

    // Reload
    if (this.state.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.state.isReloading  = false;
        this.state.playerAmmo   = this.state.playerMaxAmmo;
        this.reloadTimer        = 0;
      }
    }

    // Fire
    if (input.fire && !this.state.isReloading) {
      if (this.state.playerAmmo <= 0) {
        this.startReload();
      } else if (this.playerFireCooldown <= 0) {
        const interval = this.getFireInterval(this.state.playerWeaponId);
        if (interval > 0) {
          this.playerFireCooldown = interval;
          this.state.playerAmmo   = Math.max(0, this.state.playerAmmo - 1);
          this.spawnPlayerBullet();
          if (this.state.playerAmmo === 0) this.startReload();
        }
      }
    }
  }

  private startReload() {
    if (this.state.isReloading) return;
    const w = WEAPONS.find(x => x.id === this.state.playerWeaponId);
    const rt = w ? (RELOAD_TIME[w.type] ?? 2.0) : 2.0;
    this.state.isReloading = true;
    this.reloadTimer       = rt;
  }

  private spawnPlayerBullet() {
    const yaw   = this.state.cameraYaw;
    const pitch = this.state.cameraPitch;
    const dmg   = this.getWeaponDamage(this.state.playerWeaponId);

    this.state.bullets.push({
      id:     `pb_${bulletId++}`,
      pos:    { x: this.state.playerPos.x, y: 1.4, z: this.state.playerPos.z },
      vel:    {
        x:  Math.sin(yaw) * Math.cos(pitch) * BULLET_SPEED,
        y: -Math.sin(pitch) * BULLET_SPEED,
        z:  Math.cos(yaw) * Math.cos(pitch) * BULLET_SPEED,
      },
      fromId: "player",
      team:   "blue",
      damage: dmg,
      ttl:    BULLET_TTL,
      hit:    false,
    });
  }

  private resolvePlayerBuildingCollision() {
    const obstacles = [
      ...MAP_LAYOUT.buildings,
      ...MAP_LAYOUT.colliders,
    ];
    for (const b of obstacles) {
      const dx = this.state.playerPos.x - b.pos.x;
      const dz = this.state.playerPos.z - b.pos.z;
      const overlapX = b.halfW + PLAYER_RADIUS - Math.abs(dx);
      const overlapZ = b.halfD + PLAYER_RADIUS - Math.abs(dz);
      if (overlapX > 0 && overlapZ > 0) {
        if (overlapX < overlapZ) {
          this.state.playerPos.x += dx > 0 ? overlapX : -overlapX;
        } else {
          this.state.playerPos.z += dz > 0 ? overlapZ : -overlapZ;
        }
      }
    }
  }

  private isClearOfObstacles(pos: { x: number; z: number }, radius: number): boolean {
    const obstacles = [
      ...MAP_LAYOUT.buildings,
      ...MAP_LAYOUT.colliders,
    ];
    for (const b of obstacles) {
      const dx = Math.abs(pos.x - b.pos.x);
      const dz = Math.abs(pos.z - b.pos.z);
      if (dx < b.halfW + radius && dz < b.halfD + radius) return false;
    }
    return true;
  }

  // ─── Bots ────────────────────────────────────────────────────────────────────
  private updateBots(dt: number) {
    for (const bot of this.state.bots) this.updateBot(bot, dt);
  }

  private updateBot(bot: BotInstance, dt: number) {
    if (bot.aiState === "dead") {
      if (bot.role === "leader") {
        bot.respawnTimer -= dt;
        if (bot.respawnTimer <= 0) this.respawnBot(bot);
      }
      return;
    }

    bot.fireCooldown -= dt;
    bot.roamTimer    -= dt;

    const target = this.findBotTarget(bot);
    if (!target) {
      this.roamBot(bot, dt);
      return;
    }

    const d = dist2d(bot.pos, target.pos);
    if (d > BOT_CHASE_RANGE) {
      this.roamBot(bot, dt);
    } else if (d > BOT_ATTACK_RANGE) {
      bot.aiState = "chase";
      this.moveToward(bot, target.pos, BOT_SPEED_CHASE, dt);
    } else {
      bot.aiState = "attack";
      const dx = target.pos.x - bot.pos.x;
      const dz = target.pos.z - bot.pos.z;
      bot.yaw   = Math.atan2(dx, dz);
      if (bot.fireCooldown <= 0) {
        bot.fireCooldown = BOT_FIRE_INTERVAL + Math.random() * BOT_FIRE_JITTER;
        this.spawnBotBullet(bot);
      }
    }
  }

  private findBotTarget(bot: BotInstance): { pos: Vec3; id: string } | null {
    if (bot.team === "red") {
      const pDist = dist2d(bot.pos, this.state.playerPos);
      let best: { pos: Vec3; id: string; d: number } | null = null;

      // Include player as potential target
      if (pDist < BOT_CHASE_RANGE) {
        best = { pos: this.state.playerPos, id: "player", d: pDist };
      }
      // Blue bots
      for (const ally of this.state.bots) {
        if (ally.team !== "red" && ally.aiState !== "dead") {
          const d = dist2d(bot.pos, ally.pos);
          if (d < BOT_CHASE_RANGE && (!best || d < best.d)) {
            best = { pos: ally.pos, id: ally.id, d };
          }
        }
      }
      return best ? { pos: best.pos, id: best.id } : null;
    } else {
      let best: { pos: Vec3; id: string; d: number } | null = null;
      for (const enemy of this.state.bots) {
        if (enemy.team === "red" && enemy.aiState !== "dead") {
          const d = dist2d(bot.pos, enemy.pos);
          if (d < BOT_CHASE_RANGE && (!best || d < best.d)) {
            best = { pos: enemy.pos, id: enemy.id, d };
          }
        }
      }
      return best ? { pos: best.pos, id: best.id } : null;
    }
  }

  private roamBot(bot: BotInstance, dt: number) {
    bot.aiState = "roam";
    if (!bot.roamTarget || bot.roamTimer <= 0 || dist2d(bot.pos, bot.roamTarget) < BOT_ARRIVE_RADIUS) {
      const baseX = bot.team === "blue" ? -40 : 40;
      const baseZ = bot.team === "blue" ? -40 : 40;
      bot.roamTarget = {
        x: clamp(baseX + (Math.random() - 0.5) * BOT_ROAM_RANGE * 2, -MAP_HALF, MAP_HALF),
        y: 0,
        z: clamp(baseZ + (Math.random() - 0.5) * BOT_ROAM_RANGE * 2, -MAP_HALF, MAP_HALF),
      };
      bot.roamTimer = BOT_ROAM_TIMER_MIN + Math.random() * (BOT_ROAM_TIMER_MAX - BOT_ROAM_TIMER_MIN);
    }
    this.moveToward(bot, bot.roamTarget, BOT_SPEED_ROAM, dt);
  }

  private moveToward(bot: BotInstance, target: Vec3, speed: number, dt: number) {
    const dx  = target.x - bot.pos.x;
    const dz  = target.z - bot.pos.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.05) return;
    bot.yaw    = Math.atan2(dx, dz);
    bot.pos.x  = clamp(bot.pos.x + (dx / len) * speed * dt, -MAP_HALF, MAP_HALF);
    bot.pos.z  = clamp(bot.pos.z + (dz / len) * speed * dt, -MAP_HALF, MAP_HALF);
  }

  private spawnBotBullet(bot: BotInstance) {
    const spread = (Math.random() - 0.5) * 0.08;
    this.state.bullets.push({
      id:     `bb_${bulletId++}`,
      pos:    { x: bot.pos.x, y: 1.4, z: bot.pos.z },
      vel:    {
        x: Math.sin(bot.yaw + spread) * BULLET_SPEED,
        y: 0,
        z: Math.cos(bot.yaw + spread) * BULLET_SPEED,
      },
      fromId: bot.id,
      team:   bot.team,
      damage: BOT_DAMAGE,
      ttl:    BULLET_TTL,
      hit:    false,
    });
  }

  // ─── Bullets ─────────────────────────────────────────────────────────────────
  private updateBullets(dt: number) {
    for (const bullet of this.state.bullets) {
      if (bullet.hit || bullet.ttl <= 0) continue;
      bullet.pos.x += bullet.vel.x * dt;
      bullet.pos.y += bullet.vel.y * dt;
      bullet.pos.z += bullet.vel.z * dt;
      bullet.ttl   -= dt;

      // Hit bots
      for (const bot of this.state.bots) {
        if (bot.aiState === "dead" || bullet.team === bot.team || bullet.fromId === bot.id) continue;
        if (dist2d(bullet.pos, bot.pos) < BOT_RADIUS + BULLET_HIT_RADIUS) {
          bullet.hit = true;
          this.damageBot(bot, bullet.damage, bullet.fromId);
          break;
        }
      }

      // Hit player (red bullets)
      if (!bullet.hit && bullet.team === "red" && this.playerInvTimer <= 0) {
        if (dist2d(bullet.pos, this.state.playerPos) < PLAYER_RADIUS + BULLET_HIT_RADIUS) {
          bullet.hit            = true;
          this.playerInvTimer   = PLAYER_INV_SEC;
          this.state.playerHp   = Math.max(0, this.state.playerHp - bullet.damage);
          if (this.state.playerHp <= 0) {
            this.state.phase      = "lost";
            this.state.winnerTeam = "red";
          }
        }
      }
    }
    this.state.bullets = this.state.bullets.filter(b => !b.hit && b.ttl > 0);
  }

  private damageBot(bot: BotInstance, damage: number, fromId: string) {
    bot.hp -= damage;
    if (bot.hp > 0) return;

    bot.hp      = 0;
    bot.aiState = "dead";

    const killerIsPlayer = fromId === "player";
    const killerBot      = killerIsPlayer ? null : this.state.bots.find(b => b.id === fromId);
    const killerName     = killerIsPlayer ? this.config.playerName : (killerBot?.name ?? "Unknown");
    const killerTeam: Team = bot.team === "red" ? "blue" : "red";

    this.pushKillEvent({
      killerId:   fromId,
      killerName,
      killerTeam,
      victimId:   bot.id,
      victimName: bot.name,
      t:          this.config.timeLimitSec - this.state.timeLeftSec,
    });

    if (bot.team === "red") this.state.blueKills++;
    else                    this.state.redKills++;

    if (bot.role === "leader") bot.respawnTimer = LEADER_RESPAWN_SEC;
  }

  private respawnBot(bot: BotInstance) {
    const spawnDef = MAP_LAYOUT.botSpawns.find(s => s.id === bot.id);
    if (!spawnDef) return;
    let respawnPos = { ...spawnDef.pos };
    // If original spawn is somehow inside an obstacle, jitter until clear
    if (!this.isClearOfObstacles(respawnPos, BOT_RADIUS)) {
      for (let attempt = 0; attempt < 20; attempt++) {
        const candidate = {
          x: clamp(respawnPos.x + (Math.random() - 0.5) * 6, -MAP_HALF, MAP_HALF),
          z: clamp(respawnPos.z + (Math.random() - 0.5) * 6, -MAP_HALF, MAP_HALF),
        };
        if (this.isClearOfObstacles(candidate, BOT_RADIUS)) {
          respawnPos.x = candidate.x;
          respawnPos.z = candidate.z;
          break;
        }
      }
    }
    bot.pos          = respawnPos;
    bot.hp           = BOT_MAX_HP;
    bot.aiState      = "idle";
    bot.roamTarget   = null;
    bot.fireCooldown = 1.0 + Math.random();
  }

  private pushKillEvent(evt: KillEvent) {
    this.state.killFeed = [evt, ...this.state.killFeed].slice(0, 6);
  }

  // ─── Collection ──────────────────────────────────────────────────────────────
  private checkCoreBoxPickup() {
    for (const box of this.state.coreBoxes) {
      if (box.collected) continue;
      if (dist2d(this.state.playerPos, box.pos) < CORE_BOX_RANGE) {
        box.collected = true;
        const prev    = this.state.playerCoreBoxes[box.color] ?? 0;
        this.state.playerCoreBoxes = { ...this.state.playerCoreBoxes, [box.color]: prev + 1 };
      }
    }
  }

  private checkMachineProximity() {
    const bd = dist2d(this.state.playerPos, MAP_LAYOUT.blueMachinePos);
    const rd = dist2d(this.state.playerPos, MAP_LAYOUT.redMachinePos);
    this.state.nearMachineTeam = bd < MACHINE_RANGE ? "blue" : rd < MACHINE_RANGE ? "red" : null;
  }

  // ─── Win condition ────────────────────────────────────────────────────────────
  private checkWinCondition() {
    if (this.state.phase !== "playing") return;
    const lim = this.config.killLimit;
    if (this.state.blueKills >= lim) { this.state.phase = "won";  this.state.winnerTeam = "blue"; return; }
    if (this.state.redKills  >= lim) { this.state.phase = "lost"; this.state.winnerTeam = "red";  return; }
    if (this.state.timeLeftSec <= 0) {
      if (this.state.blueKills > this.state.redKills)      { this.state.phase = "won";  this.state.winnerTeam = "blue"; }
      else if (this.state.redKills > this.state.blueKills) { this.state.phase = "lost"; this.state.winnerTeam = "red";  }
      else { this.state.phase = this.state.playerHp > 0 ? "won" : "lost"; this.state.winnerTeam = this.state.playerHp > 0 ? "blue" : "red"; }
    }
  }

  private cleanupKillFeed() {
    const elapsed = this.config.timeLimitSec - this.state.timeLeftSec;
    this.state.killFeed = this.state.killFeed.filter(k => elapsed - k.t < KILL_FEED_LIFETIME);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  private getFireInterval(weaponId: string) {
    const w = WEAPONS.find(x => x.id === weaponId);
    return w ? (WEAPON_FIRE_INTERVAL[w.type] ?? 0.5) : 0;
  }

  private getWeaponDamage(weaponId: string) {
    return WEAPONS.find(x => x.id === weaponId)?.stats.damage ?? 10;
  }

  // ─── Equip weapon (called by crafting panel) ──────────────────────────────
  equipWeapon(weaponId: string) {
    const w = WEAPONS.find(x => x.id === weaponId);
    if (!w) return;
    this.state.playerWeaponId = weaponId;
    this.state.playerAmmo     = w.stats.ammo;
    this.state.playerMaxAmmo  = w.stats.ammo;
    this.state.isReloading    = false;
    this.reloadTimer          = 0;
  }

  // ─── Craft weapon — deduct core boxes & equip (returns true if success) ───
  craftWeapon(weaponId: string): boolean {
    const recipe = WEAPON_RECIPES[weaponId];
    if (!recipe) return false;

    // Check affordability
    for (const ing of recipe) {
      if ((this.state.playerCoreBoxes[ing.color] ?? 0) < ing.amount) return false;
    }

    // Deduct boxes
    for (const ing of recipe) {
      this.state.playerCoreBoxes[ing.color] =
        (this.state.playerCoreBoxes[ing.color] ?? 0) - ing.amount;
    }

    this.equipWeapon(weaponId);
    return true;
  }
}
