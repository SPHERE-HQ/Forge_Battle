export interface PlayerData {
  nickname: string;
  playerId: string;
  createdAt: number;
}

export function loadPlayer(): PlayerData | null {
  try {
    const raw = localStorage.getItem("forgeArena_player");
    if (!raw) return null;
    return JSON.parse(raw) as PlayerData;
  } catch {
    return null;
  }
}

export function savePlayer(nickname: string): PlayerData {
  const playerId = String(Math.floor(100000 + Math.random() * 900000));
  const data: PlayerData = { nickname, playerId, createdAt: Date.now() };
  localStorage.setItem("forgeArena_player", JSON.stringify(data));
  return data;
}
