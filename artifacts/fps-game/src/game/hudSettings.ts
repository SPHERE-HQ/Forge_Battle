// ─── HUD Settings — positions & scales for each HUD element ──────────────────

export interface HUDElementPos {
  x:     number;  // % from left of viewport (0–100)
  y:     number;  // % from top  of viewport (0–100)
  scale: number;  // 0.6 – 2.0
}

export interface HUDSettings {
  minimap:        HUDElementPos;
  healthBar:      HUDElementPos;
  ammo:           HUDElementPos;
  scoreTimer:     HUDElementPos;
  killFeed:       HUDElementPos;
  fireButton:     HUDElementPos;
  interactButton: HUDElementPos;
}

export const DEFAULT_HUD: HUDSettings = {
  minimap:        { x: 87, y: 68, scale: 1.0 },
  healthBar:      { x: 1,  y: 1,  scale: 1.0 },
  ammo:           { x: 85, y: 85, scale: 1.0 },
  scoreTimer:     { x: 43, y: 1,  scale: 1.0 },
  killFeed:       { x: 74, y: 1,  scale: 1.0 },
  fireButton:     { x: 80, y: 70, scale: 1.0 },
  interactButton: { x: 65, y: 72, scale: 1.0 },
};

const STORAGE_KEY = "forge_hud_v1";

export function loadHUDSettings(): HUDSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_HUD };
    const parsed = JSON.parse(raw) as Partial<HUDSettings>;
    // Merge with defaults so new keys added in updates still work
    return {
      minimap:        { ...DEFAULT_HUD.minimap,        ...parsed.minimap        },
      healthBar:      { ...DEFAULT_HUD.healthBar,      ...parsed.healthBar      },
      ammo:           { ...DEFAULT_HUD.ammo,           ...parsed.ammo           },
      scoreTimer:     { ...DEFAULT_HUD.scoreTimer,     ...parsed.scoreTimer     },
      killFeed:       { ...DEFAULT_HUD.killFeed,       ...parsed.killFeed       },
      fireButton:     { ...DEFAULT_HUD.fireButton,     ...parsed.fireButton     },
      interactButton: { ...DEFAULT_HUD.interactButton, ...parsed.interactButton },
    };
  } catch {
    return { ...DEFAULT_HUD };
  }
}

export function saveHUDSettings(s: HUDSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function resetHUDSettings(): HUDSettings {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  return { ...DEFAULT_HUD };
}
