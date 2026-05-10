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
export const CHARACTER_MODEL_PATH     = "/assets/characters/andromeda.glb";
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
export const STORAGE_KEY_PLAYER    = "forgeArena_player";
export const STORAGE_KEY_SETTINGS  = "forgeArena_settings";
export const STORAGE_KEY_CURRENCY  = "forgeArena_currency";
export const STORAGE_KEY_INVENTORY = "forgeArena_inventory";

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
  readonly durationSec?: number;
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

// ─── Character lore & stats (separate from core def for extensibility) ────────
export interface CharacterStats {
  readonly hp:     number; // 0–100
  readonly speed:  number; // 0–100
  readonly armor:  number; // 0–100
  readonly power:  number; // 0–100 (skill potency)
}

export interface CharacterBio {
  readonly lore:     string;
  readonly origin:   string;
  readonly stats:    CharacterStats;
  readonly skins:    readonly SkinDef[];
}

export interface SkinDef {
  readonly id:       string;
  readonly name:     string;
  readonly rarity:   "common" | "rare" | "epic" | "legendary";
  readonly unlocked: boolean;
  readonly modelPath?: string; // override model when skin is equipped (future)
}

export const CHARACTER_BIOS: Record<CharacterId, CharacterBio> = {
  specter: {
    lore:   "Agen bayangan yang identitasnya dirahasiakan bahkan dari komandan tertinggi. ANDROMEDA beroperasi di luar protokol standar — muncul, menyerang, lenyap. Tidak ada yang pernah melihat wajah aslinya.",
    origin: "Asal: Tidak Diketahui · Unit: PHANTOM DIVISION",
    stats:  { hp: 72, speed: 95, armor: 55, power: 90 },
    skins: [
      { id: "default",  name: "DEFAULT",      rarity: "common",    unlocked: true  },
      { id: "phantom",  name: "PHANTOM",       rarity: "rare",      unlocked: false },
      { id: "eclipse",  name: "ECLIPSE",       rarity: "epic",      unlocked: false },
      { id: "void",     name: "VOID",          rarity: "legendary", unlocked: false },
    ],
  },
  fighter: {
    lore:   "Prajurit garis depan yang dibentuk oleh ratusan medan pertempuran. FIGHTER tidak mengenal rasa takut — hanya maju, terus maju. Armor-nya adalah tameng tim, tubuhnya adalah senjata.",
    origin: "Asal: VANGUARD CORPS · Unit: IRON BATTALION",
    stats:  { hp: 100, speed: 65, armor: 100, power: 75 },
    skins: [
      { id: "default",   name: "DEFAULT",       rarity: "common",    unlocked: true  },
      { id: "warfront",  name: "WARFRONT",       rarity: "rare",      unlocked: false },
      { id: "titanfall", name: "TITANFALL",      rarity: "epic",      unlocked: false },
      { id: "berserker", name: "BERSERKER",      rarity: "legendary", unlocked: false },
    ],
  },
  medic: {
    lore:   "Dokter lapangan yang menyelamatkan nyawa di bawah hujan peluru. MEDIC membuktikan bahwa kemampuan menyembuhkan sama mematikannya dengan senjata. Tanpa dia, tim adalah angka.",
    origin: "Asal: FIELD MEDICAL CORPS · Unit: LIFELINE SQUAD",
    stats:  { hp: 80, speed: 85, armor: 60, power: 88 },
    skins: [
      { id: "default",  name: "DEFAULT",       rarity: "common",    unlocked: true  },
      { id: "trauma",   name: "TRAUMA",         rarity: "rare",      unlocked: false },
      { id: "guardian", name: "GUARDIAN",       rarity: "epic",      unlocked: false },
      { id: "lifeline", name: "LIFELINE",       rarity: "legendary", unlocked: false },
    ],
  },
  engineer: {
    lore:   "Ahli teknologi tempur yang bisa merakit senjata dari puing-puing. ENGINEER mengubah situasi mustahil menjadi keunggulan taktis. Otaknya adalah senjata paling berbahaya di medan tempur.",
    origin: "Asal: TECH CORPS · Unit: FORGE DIVISION",
    stats:  { hp: 85, speed: 75, armor: 75, power: 82 },
    skins: [
      { id: "default",   name: "DEFAULT",       rarity: "common",    unlocked: true  },
      { id: "blueprint", name: "BLUEPRINT",      rarity: "rare",      unlocked: false },
      { id: "overclk",   name: "OVERCLOCK",      rarity: "epic",      unlocked: false },
      { id: "archon",    name: "ARCHON",         rarity: "legendary", unlocked: false },
    ],
  },
};

// ─── Weapon definitions ───────────────────────────────────────────────────────
export type WeaponType    = "pistol" | "smg" | "ar" | "shotgun" | "sniper" | "lmg" | "heavy";
export type WeaponRarity  = "common" | "uncommon" | "rare" | "epic";

export interface WeaponAttachment {
  readonly slot:     "scope" | "grip" | "magazine" | "muzzle" | "stock";
  readonly name:     string;
  readonly unlocked: boolean;
}

export interface WeaponDef {
  readonly id:          string;
  readonly name:        string;
  readonly type:        WeaponType;
  readonly rarity:      WeaponRarity;
  readonly icon:        string;
  readonly description: string;
  readonly stats: {
    readonly damage:   number; // 0–100
    readonly ammo:     number; // mag size
    readonly range:    number; // 0–100
    readonly fireRate: number; // 0–100
    readonly handling: number; // 0–100
  };
  readonly attachments: readonly WeaponAttachment[];
}

export const WEAPONS: readonly WeaponDef[] = [
  {
    id:          "m9_pistol",
    name:        "M9 PISTOL",
    type:        "pistol",
    rarity:      "common",
    icon:        "🔫",
    description: "Pistol semi-otomatis standar militer. Andal, ringan, mudah dibawa. Pilihan utama sebagai senjata cadangan.",
    stats:       { damage: 35, ammo: 15, range: 45, fireRate: 55, handling: 90 },
    attachments: [
      { slot: "scope",    name: "Red Dot",     unlocked: false },
      { slot: "muzzle",   name: "Silencer",    unlocked: false },
      { slot: "magazine", name: "Extended",    unlocked: false },
    ],
  },
  {
    id:          "mp5_smg",
    name:        "MP5 SMG",
    type:        "smg",
    rarity:      "common",
    icon:        "🔫",
    description: "Submachine gun legendaris dengan recoil rendah dan laju tembak tinggi. Cocok untuk pertempuran jarak dekat.",
    stats:       { damage: 40, ammo: 30, range: 40, fireRate: 80, handling: 80 },
    attachments: [
      { slot: "scope",    name: "Holo Sight",  unlocked: false },
      { slot: "grip",     name: "Foregrip",    unlocked: false },
      { slot: "muzzle",   name: "Compensator", unlocked: false },
      { slot: "magazine", name: "Drum Mag",    unlocked: false },
    ],
  },
  {
    id:          "m4_ar",
    name:        "M4A1 ASSAULT RIFLE",
    type:        "ar",
    rarity:      "uncommon",
    icon:        "🔫",
    description: "Assault rifle serba guna dengan keseimbangan sempurna antara damage, akurasi, dan laju tembak.",
    stats:       { damage: 55, ammo: 30, range: 70, fireRate: 70, handling: 70 },
    attachments: [
      { slot: "scope",    name: "ACOG",        unlocked: false },
      { slot: "grip",     name: "Angled Grip", unlocked: false },
      { slot: "muzzle",   name: "Flash Hider", unlocked: false },
      { slot: "magazine", name: "Extended",    unlocked: false },
      { slot: "stock",    name: "Tactical",    unlocked: false },
    ],
  },
  {
    id:          "spas12_shotgun",
    name:        "SPAS-12 SHOTGUN",
    type:        "shotgun",
    rarity:      "uncommon",
    icon:        "🔫",
    description: "Shotgun pump-action dengan daya henti luar biasa. Satu tembakan cukup untuk mengubah keseimbangan pertempuran.",
    stats:       { damage: 88, ammo: 8, range: 25, fireRate: 25, handling: 55 },
    attachments: [
      { slot: "muzzle",   name: "Choke",       unlocked: false },
      { slot: "stock",    name: "Folding",      unlocked: false },
    ],
  },
  {
    id:          "awm_sniper",
    name:        "AWM SNIPER",
    type:        "sniper",
    rarity:      "rare",
    icon:        "🎯",
    description: "Sniper rifle bolt-action paling mematikan di kelasnya. Satu peluru, satu eliminasi — dari jarak yang tidak bisa dibayangkan.",
    stats:       { damage: 98, ammo: 5, range: 100, fireRate: 12, handling: 40 },
    attachments: [
      { slot: "scope",    name: "8x Scope",    unlocked: false },
      { slot: "muzzle",   name: "Suppressor",  unlocked: false },
      { slot: "stock",    name: "Precision",   unlocked: false },
    ],
  },
  {
    id:          "m249_lmg",
    name:        "M249 LMG",
    type:        "lmg",
    rarity:      "rare",
    icon:        "🔫",
    description: "Light machine gun dengan kapasitas amunisi masif. Diciptakan untuk fire suppression — biarkan peluru yang bicara.",
    stats:       { damage: 60, ammo: 100, range: 60, fireRate: 85, handling: 30 },
    attachments: [
      { slot: "scope",    name: "Holo",        unlocked: false },
      { slot: "grip",     name: "Bipod",       unlocked: false },
    ],
  },
  {
    id:          "rpg7_heavy",
    name:        "RPG-7",
    type:        "heavy",
    rarity:      "epic",
    icon:        "💥",
    description: "Peluncur roket anti-tank yang bisa meratakan apapun dalam radius ledakannya. Amunisi langka, dampaknya tidak.",
    stats:       { damage: 100, ammo: 1, range: 80, fireRate: 5, handling: 20 },
    attachments: [
      { slot: "scope",    name: "Thermal",     unlocked: false },
    ],
  },
];

// ─── Starter weapon IDs (owned by all players from the start) ─────────────────
export const STARTER_WEAPON_IDS = ["m9_pistol", "mp5_smg", "m4_ar"] as const;

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
