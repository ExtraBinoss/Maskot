import { useAtomValue } from "jotai";
import {
  Circle,
  CircleCheck,
  Ellipsis,
  Eye,
  Heart,
  Hexagon,
  Info,
  Moon,
  Orbit,
  Sparkles,
  Star,
  Triangle,
  Zap,
} from "lucide-react";
import { SEQUENCE } from "../mascot/engine/states";
import type { StateId } from "../mascot/engine/bot-types";
import { STATE_LABELS } from "../mascot/mascot-catalog";
import { stateAtom } from "../state/lab";
import { usePlayer } from "../mascot/PlayerProvider";
import s from "../styles/lab.module.css";

const icons = {
  idle: Heart,
  thinking: Ellipsis,
  wink: Eye,
  wide: Sparkles,
  alert: Info,
  notify: CircleCheck,
  exclaim: Zap,
  sleep: Moon,
  egg: Circle,
  hexagon: Hexagon,
  play: Triangle,
  orbit: Orbit,
  burst: Star,
  comet: Sparkles,
  swirl: Orbit,
} satisfies Record<StateId, typeof Heart>;

export function MovementCatalog() {
  const state = useAtomValue(stateAtom);
  const player = usePlayer();
  return (
    <aside className={s.movements} aria-label="Mouvements">
      <div className={s.movementHeading}>
        <h2>Ses mouvements</h2>
        <span>{SEQUENCE.length}</span>
      </div>
      <div className={s.movementList}>
        {SEQUENCE.map((id) => {
          const Icon = icons[id];
          return (
            <button
              key={id}
              className={s.movement}
              aria-pressed={state === id}
              onClick={() => player.choose(id)}
            >
              <Icon size={16} />
              <span>{STATE_LABELS[id]}</span>
              <i />
            </button>
          );
        })}
      </div>
      <p className={s.movementNote}>
        De petits mouvements,
        <br />
        de grandes émotions.
      </p>
    </aside>
  );
}
