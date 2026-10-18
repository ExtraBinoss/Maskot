import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { MascotPlayer } from "./player";

const PlayerContext = createContext<MascotPlayer | null>(null);

export function PlayerProvider({
  player,
  children,
  beforeMount,
}: {
  player: MascotPlayer;
  children: ReactNode;
  beforeMount?: () => void;
}) {
  useEffect(() => {
    beforeMount?.();
    return player.mount();
  }, [player, beforeMount]);
  return <PlayerContext value={player}>{children}</PlayerContext>;
}

export function usePlayer() {
  const player = useContext(PlayerContext);
  if (!player) throw new Error("Le lecteur Maskot est absent.");
  return player;
}
