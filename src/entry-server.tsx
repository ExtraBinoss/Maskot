import { prerender } from "react-dom/static";
import "./i18n";
import { Application } from "./Application";
import { createLabStore } from "./state/lab";
import { createMascotPlayer, type PlayerEnvironment } from "./mascot/player";

const environment: PlayerEnvironment = {
  requestFrame: () => 0,
  cancelFrame: () => {},
  isHidden: () => true,
  onVisibility: () => () => {},
  onMotion: () => () => {},
  save: () => {},
};

export async function render() {
  const store = createLabStore(() => null, false);
  const player = createMascotPlayer(store, environment);
  const { prelude } = await prerender(
    <Application store={store} player={player} />,
  );
  return new Response(prelude).text();
}
