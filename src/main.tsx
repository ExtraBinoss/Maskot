import { StrictMode } from "react";
import "./i18n";
import { createRoot } from "react-dom/client";
import { Provider } from "jotai";
import { LazyMotion, domAnimation, MotionConfig } from "motion/react";
import { App } from "./App";
import { ThemeSync } from "./state/theme";
import { createLabStore, PRESET_KEY } from "./state/lab";
import { browserEnvironment, createMascotPlayer } from "./mascot/player";
import { PlayerProvider } from "./mascot/PlayerProvider";
import { TooltipProvider } from "./components/ui/tooltip";
import "./styles/global.css";

const store = createLabStore(
  () => localStorage.getItem(PRESET_KEY),
  window.matchMedia("(prefers-reduced-motion: reduce)").matches,
);
const player = createMascotPlayer(store, browserEnvironment());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <MotionConfig reducedMotion="user">
        <ThemeSync />
        <LazyMotion features={domAnimation} strict>
          <PlayerProvider player={player}>
            <TooltipProvider delay={250}>
              <App />
            </TooltipProvider>
          </PlayerProvider>
        </LazyMotion>
      </MotionConfig>
    </Provider>
  </StrictMode>,
);
