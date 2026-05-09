import { useState, useEffect, useCallback } from "react";
import IntroScene from "./IntroScene";
import NicknameForm from "./NicknameForm";
import MainMenu from "./MainMenu";
import { SettingsProvider } from "./context/SettingsContext";
import { loadPlayer, PlayerData } from "./types/player";

type Scene = "intro" | "nickname" | "menu";

function GameRoot() {
  const [scene, setScene]   = useState<Scene>("intro");
  const [player, setPlayer] = useState<PlayerData | null>(null);

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

  const handleSelectMode = useCallback((mode: "offline" | "online" | "lan") => {
    // TODO: transition to game scene
    console.log("Mode selected:", mode);
  }, []);

  if (scene === "intro")                return <IntroScene onComplete={handleIntroComplete} />;
  if (scene === "nickname")             return <NicknameForm onSubmit={handleNicknameSubmit} />;
  if (scene === "menu" && player)       return <MainMenu player={player} onSelectMode={handleSelectMode} />;
  return null;
}

export default function App() {
  return (
    <SettingsProvider>
      <GameRoot />
    </SettingsProvider>
  );
}
