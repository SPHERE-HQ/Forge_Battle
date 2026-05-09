import { useState, useEffect, useCallback } from "react";
import IntroScene from "./IntroScene";
import NicknameForm from "./NicknameForm";
import MainMenu from "./MainMenu";
import HomeScene from "./scenes/HomeScene";
import { SettingsProvider } from "./context/SettingsContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { loadPlayer, PlayerData } from "./types/player";

type GameMode = "offline" | "online" | "lan";
type Scene    = "intro" | "nickname" | "menu" | "home";

function GameRoot() {
  const [scene,  setScene]  = useState<Scene>("intro");
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [mode,   setMode]   = useState<GameMode>("offline");

  useEffect(() => {
    const lockOrientation = async () => {
      try {
        if (
          screen.orientation &&
          (screen.orientation as unknown as { lock: (o: string) => Promise<void> }).lock
        ) {
          await (
            screen.orientation as unknown as { lock: (o: string) => Promise<void> }
          ).lock("landscape");
        }
      } catch {
        // Android manifest enforces landscape as fallback
      }
    };
    lockOrientation();
  }, []);

  const handleIntroComplete = useCallback(() => {
    const saved = loadPlayer();
    if (saved) { setPlayer(saved); setScene("menu"); }
    else        { setScene("nickname"); }
  }, []);

  const handleNicknameSubmit = useCallback((data: PlayerData) => {
    setPlayer(data);
    setScene("menu");
  }, []);

  const handleSelectMode = useCallback((selected: GameMode) => {
    setMode(selected);
    setScene("home");
  }, []);

  const handleBattle = useCallback(() => {
    // TODO: transition to battle/game scene
  }, []);

  if (scene === "intro")                        return <IntroScene onComplete={handleIntroComplete} />;
  if (scene === "nickname")                     return <NicknameForm onSubmit={handleNicknameSubmit} />;
  if (scene === "menu"   && player)             return <MainMenu player={player} onSelectMode={handleSelectMode} />;
  if (scene === "home"   && player)             return <HomeScene player={player} mode={mode} onBattle={handleBattle} />;
  return null;
}

export default function App() {
  return (
    <SettingsProvider>
      <CurrencyProvider>
        <GameRoot />
      </CurrencyProvider>
    </SettingsProvider>
  );
}
