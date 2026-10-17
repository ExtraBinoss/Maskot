import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "jotai";
import { MotionConfig } from "motion/react";
import { App } from "./App";
import { ThemeSync } from "./state/theme";
import { createLabStore, PRESET_KEY } from "./state/lab";
import { browserEnvironment, createMascotPlayer } from "./mascot/player";
import { PlayerProvider } from "./mascot/PlayerProvider";
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
        <PlayerProvider player={player}>
          <App />
        </PlayerProvider>
      </MotionConfig>
    </Provider>
  </StrictMode>,
);
