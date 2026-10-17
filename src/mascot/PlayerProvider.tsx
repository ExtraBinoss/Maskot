import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { MascotPlayer } from "./player";

const PlayerContext = createContext<MascotPlayer | null>(null);

export function PlayerProvider({
  player,
  children,
}: {
  player: MascotPlayer;
  children: ReactNode;
}) {
  useEffect(() => player.mount(), [player]);
  return <PlayerContext value={player}>{children}</PlayerContext>;
}

export function usePlayer() {
  const player = useContext(PlayerContext);
  if (!player) throw new Error("Le lecteur MascotLab est absent.");
  return player;
}
