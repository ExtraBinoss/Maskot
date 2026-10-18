import { createRoot, hydrateRoot } from "react-dom/client";
import { prepareDrawerGestures } from "./lib/prepare-drawer";
import { Application } from "./Application";
import { restoreClientLanguage } from "./i18n";
import { createLabStore, restoreLabStore, PRESET_KEY } from "./state/lab";
import { restoreCustomColorsAtom } from "./state/palette";
import { browserEnvironment, createMascotPlayer } from "./mascot/player";
import "./styles/global.css";

prepareDrawerGestures();

const store = createLabStore(() => null, false);
const player = createMascotPlayer(store, browserEnvironment());
let restored = false;
function restorePreferences() {
  if (restored) return;
  restored = true;
  restoreLabStore(
    store,
    () => localStorage.getItem(PRESET_KEY),
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  store.set(restoreCustomColorsAtom);
  restoreClientLanguage();
}

const root = document.getElementById("root")!;
const application = (
  <Application store={store} player={player} beforeMount={restorePreferences} />
);
if (root.dataset.prerendered === "true") hydrateRoot(root, application);
else createRoot(root).render(application);
