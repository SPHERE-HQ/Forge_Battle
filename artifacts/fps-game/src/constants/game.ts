// ─── Economy ──────────────────────────────────────────────────────────────────
export const VRX_PER_BATTLE_BASE = 10;
export const VRX_PER_KILL        = 10;
export const VRX_PER_ASSIST      = 5;

// ─── Currency ─────────────────────────────────────────────────────────────────
export const CURRENCY_VRX_LABEL  = "Vrx";
export const CURRENCY_ATHS_LABEL = "Aths";
export const CURRENCY_VRX_NAME   = "Vyrox";
export const CURRENCY_ATHS_NAME  = "Aetheris";

// ─── Asset paths ──────────────────────────────────────────────────────────────
export const CHARACTER_MODEL_PATH     = "/assets/characters/andromeda.glb"; // kept for backward compat
export const CHARACTER_MODEL_SPECTER  = "/assets/characters/andromeda.glb";
export const CHARACTER_MODEL_FIGHTER  = "/assets/characters/fighter.glb";
export const CHARACTER_MODEL_MEDIC    = "/assets/characters/medic.glb";
export const CHARACTER_MODEL_ENGINEER = "/assets/characters/engineer.glb";

// ─── Fonts ────────────────────────────────────────────────────────────────────
export const FONT_PRIMARY = "'Kenney Future', 'Segoe UI', sans-serif";
export const FONT_NARROW  = "'Kenney Future Narrow', 'Segoe UI', sans-serif";

// ─── Layout (vh / vw values as numbers — use as `${N}vh` in styles) ──────────
export const TOPBAR_HEIGHT_VH    = 10;
export const BOTTOMBAR_HEIGHT_VH = 13;
export const SIDEBAR_WIDTH_VW    = 16;

// ─── Animation durations (ms) ─────────────────────────────────────────────────
export const PANEL_SLIDE_MS = 280;
export const FADE_IN_MS     = 320;

// ─── Storage keys ─────────────────────────────────────────────────────────────
export const STORAGE_KEY_PLAYER   = "forgeArena_player";
export const STORAGE_KEY_SETTINGS = "forgeArena_settings";
export const STORAGE_KEY_CURRENCY = "forgeArena_currency";

// ─── Character IDs ────────────────────────────────────────────────────────────
export const CHARACTER_ID_SPECTER  = "specter"  as const;
export const CHARACTER_ID_FIGHTER  = "fighter"  as const;
export const CHARACTER_ID_MEDIC    = "medic"    as const;
export const CHARACTER_ID_ENGINEER = "engineer" as const;

export type CharacterId =
  | typeof CHARACTER_ID_SPECTER
  | typeof CHARACTER_ID_FIGHTER
  | typeof CHARACTER_ID_MEDIC
  | typeof CHARACTER_ID_ENGINEER;

// ─── Character accent colors ──────────────────────────────────────────────────
export const CHARACTER_COLOR_SPECTER  = "#00aaff";
export const CHARACTER_COLOR_FIGHTER  = "#ff3300";
export const CHARACTER_COLOR_MEDIC    = "#00cc66";
export const CHARACTER_COLOR_ENGINEER = "#ffaa00";

// ─── Medic skill values ───────────────────────────────────────────────────────
export const MEDIC_HEAL_COOLDOWN_SEC = 30;
export const MEDIC_MAX_HP_PERCENT    = 100;

// ─── Engineer skill values ────────────────────────────────────────────────────
export const ENGINEER_CRAFT_COOLDOWN_SEC = 60;

// ─── Specter skill values ─────────────────────────────────────────────────────
export const SPECTER_LANDMINE_COOLDOWN_SEC          = 10;
export const SPECTER_LANDMINE_TRIGGER_RADIUS_TILES  = 1;
export const SPECTER_TURRET_COOLDOWN_SEC            = 30;
export const SPECTER_TURRET_RANGE_MIN_TILES         = 5;
export const SPECTER_TURRET_RANGE_MAX_TILES         = 7;
export const SPECTER_TURRET_DURATION_SEC            = 60;
export const SPECTER_TURRET_HP_PERCENT              = 300;

// ─── Fighter skill values ─────────────────────────────────────────────────────
export const FIGHTER_INVINCIBLE_DURATION_SEC = 40;
export const FIGHTER_INVINCIBLE_COOLDOWN_SEC = 30;

// ─── Skill definition ─────────────────────────────────────────────────────────
export interface SkillDef {
  readonly id:           string;
  readonly name:         string;
  readonly description:  string;
  readonly cooldownSec:  number;
  readonly durationSec?: number; // optional — skill has an active duration window
  readonly icon:         string;
}

// ─── Character definition ─────────────────────────────────────────────────────
export interface CharacterDef {
  readonly id:          CharacterId;
  readonly name:        string;
  readonly role:        string;
  readonly icon:        string;
  readonly accentColor: string;
  readonly modelPath:   string;
  readonly skills:      readonly SkillDef[];
}

// ─── Character roster ─────────────────────────────────────────────────────────
export const CHARACTERS: readonly CharacterDef[] = [
  {
    id:          CHARACTER_ID_SPECTER,
    name:        "ANDROMEDA",
    role:        "SPECTER",
    icon:        "👁",
    accentColor: CHARACTER_COLOR_SPECTER,
    modelPath:   CHARACTER_MODEL_SPECTER,
    skills: [
      {
        id:          "landmine",
        name:        "LANDMINE",
        description: `Plant a proximity mine. Auto-triggers when enemy enters ${SPECTER_LANDMINE_TRIGGER_RADIUS_TILES}-tile radius. Reduced damage at perimeter, full damage on direct contact.`,
        cooldownSec: SPECTER_LANDMINE_COOLDOWN_SEC,
        icon:        "💣",
      },
      {
        id:          "auto_turret",
        name:        "AUTO TURRET",
        description: `Deploy a 360° auto-aim turret. Range ${SPECTER_TURRET_RANGE_MIN_TILES}–${SPECTER_TURRET_RANGE_MAX_TILES} tiles. HP: ${SPECTER_TURRET_HP_PERCENT}% of base player HP.`,
        cooldownSec: SPECTER_TURRET_COOLDOWN_SEC,
        durationSec: SPECTER_TURRET_DURATION_SEC,
        icon:        "🤖",
      },
    ],
  },
  {
    id:          CHARACTER_ID_FIGHTER,
    name:        "FIGHTER",
    role:        "HEAVY ASSAULT",
    icon:        "⚔",
    accentColor: CHARACTER_COLOR_FIGHTER,
    modelPath:   CHARACTER_MODEL_FIGHTER,
    skills: [
      {
        id:          "iron_shield",
        name:        "IRON SHIELD",
        description: `Become fully invincible to all damage. Cooldown begins after duration ends.`,
        cooldownSec: FIGHTER_INVINCIBLE_COOLDOWN_SEC,
        durationSec: FIGHTER_INVINCIBLE_DURATION_SEC,
        icon:        "🛡",
      },
    ],
  },
  {
    id:          CHARACTER_ID_MEDIC,
    name:        "MEDIC",
    role:        "FIELD MEDIC",
    icon:        "✚",
    accentColor: CHARACTER_COLOR_MEDIC,
    modelPath:   CHARACTER_MODEL_MEDIC,
    skills: [
      {
        id:          "medic_pack",
        name:        "MEDIC PACK",
        description: `Instantly restore ${MEDIC_MAX_HP_PERCENT}% HP to self or a nearby teammate.`,
        cooldownSec: MEDIC_HEAL_COOLDOWN_SEC,
        icon:        "❤",
      },
    ],
  },
  {
    id:          CHARACTER_ID_ENGINEER,
    name:        "ENGINEER",
    role:        "TECH SPECIALIST",
    icon:        "⚙",
    accentColor: CHARACTER_COLOR_ENGINEER,
    modelPath:   CHARACTER_MODEL_ENGINEER,
    skills: [
      {
        id:          "instant_craft",
        name:        "INSTANT CRAFT",
        description: `Open the crafting UI anywhere on the map. Craft any weapon instantly — no materials required. Cannot craft companion bots.`,
        cooldownSec: ENGINEER_CRAFT_COOLDOWN_SEC,
        icon:        "🔧",
      },
    ],
  },
] as const;
