import { StrictMode } from "react";
import { Provider } from "jotai";
import { LazyMotion, domAnimation, MotionConfig } from "motion/react";
import { App } from "./App";
import type { LabStore } from "./state/lab";
import { ThemeSync } from "./state/theme";
import type { MascotPlayer } from "./mascot/player";
import { PlayerProvider } from "./mascot/PlayerProvider";
import { TooltipProvider } from "./components/ui/tooltip";

// The build and browser use the same tree, including React's generated SVG IDs.
export function Application({
  store,
  player,
  beforeMount,
}: {
  store: LabStore;
  player: MascotPlayer;
  beforeMount?: () => void;
}) {
  return (
    <StrictMode>
      <Provider store={store}>
        <MotionConfig reducedMotion="user">
          <ThemeSync />
          <LazyMotion features={domAnimation} strict>
            <PlayerProvider player={player} beforeMount={beforeMount}>
              <TooltipProvider delay={250}>
                <App />
              </TooltipProvider>
            </PlayerProvider>
          </LazyMotion>
        </MotionConfig>
      </Provider>
    </StrictMode>
  );
}
