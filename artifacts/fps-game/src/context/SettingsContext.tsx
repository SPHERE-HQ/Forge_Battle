import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Theme = "dark" | "light";
export type BGMTrack = "off" | "ambient" | "glass";

export interface Settings {
  theme: Theme;
  bgmTrack: BGMTrack;
  bgmVolume: number;
}

const STORAGE_KEY = "forgeArena_settings";

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {}
  return defaultSettings;
}

const defaultSettings: Settings = {
  theme: "dark",
  bgmTrack: "ambient",
  bgmVolume: 0.55,
};

interface SettingsCtx {
  settings: Settings;
  setTheme: (t: Theme) => void;
  setBGMTrack: (t: BGMTrack) => void;
  setBGMVolume: (v: number) => void;
}

const SettingsContext = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const save = useCallback((next: Settings) => {
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    setSettings(s => { const n = { ...s, theme }; localStorage.setItem(STORAGE_KEY, JSON.stringify(n)); return n; });
  }, []);

  const setBGMTrack = useCallback((bgmTrack: BGMTrack) => {
    setSettings(s => { const n = { ...s, bgmTrack }; localStorage.setItem(STORAGE_KEY, JSON.stringify(n)); return n; });
  }, []);

  const setBGMVolume = useCallback((bgmVolume: number) => {
    setSettings(s => { const n = { ...s, bgmVolume }; localStorage.setItem(STORAGE_KEY, JSON.stringify(n)); return n; });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, setTheme, setBGMTrack, setBGMVolume }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}
