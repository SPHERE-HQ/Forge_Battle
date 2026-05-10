import { useState, useEffect, useCallback } from "react";
import IntroScene from "./IntroScene";
import NicknameForm from "./NicknameForm";
import MainMenu from "./MainMenu";
import PreBattleScene from "./scenes/PreBattleScene";
import HomeScene from "./scenes/HomeScene";
import { SettingsProvider } from "./context/SettingsContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { loadPlayer, PlayerData } from "./types/player";
import { CHARACTER_ID_SPECTER, type CharacterId } from "./constants/game";

type GameMode = "offline" | "online" | "lan";
type Scene    = "intro" | "nickname" | "menu" | "home" | "prebattle";

function GameRoot() {
  const [scene,       setScene]       = useState<Scene>("intro");
  const [player,      setPlayer]      = useState<PlayerData | null>(null);
  const [mode,        setMode]        = useState<GameMode>("offline");
  const [characterId, setCharacterId] = useState<CharacterId>(CHARACTER_ID_SPECTER);

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

  // Menu → Home (lobby)
  const handleSelectMode = useCallback((selected: GameMode) => {
    setMode(selected);
    setScene("home");
  }, []);

  // Home BATTLE button → PreBattle (hero selection)
  const handleBattle = useCallback(() => {
    setScene("prebattle");
  }, []);

  // PreBattle confirm → back to Home with chosen hero (until Battle scene is ready)
  const handlePreBattleConfirm = useCallback((charId: CharacterId) => {
    setCharacterId(charId);
    setScene("home");
  }, []);

  // PreBattle back → Home (not menu)
  const handlePreBattleBack = useCallback(() => {
    setScene("home");
  }, []);

  if (scene === "intro")                       return <IntroScene onComplete={handleIntroComplete} />;
  if (scene === "nickname")                    return <NicknameForm onSubmit={handleNicknameSubmit} />;
  if (scene === "menu"      && player)         return <MainMenu player={player} onSelectMode={handleSelectMode} />;
  if (scene === "home"      && player)         return <HomeScene player={player} mode={mode} characterId={characterId} onBattle={handleBattle} />;
  if (scene === "prebattle" && player)         return <PreBattleScene player={player} mode={mode} onConfirm={handlePreBattleConfirm} onBack={handlePreBattleBack} />;
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
