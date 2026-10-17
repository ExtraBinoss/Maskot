import { useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  Maximize2,
  Pause,
  Play,
} from "lucide-react";
import {
  boardAtom,
  followAtom,
  lookAtom,
  motionPanelAtom,
  playingAtom,
  reducedMotionAtom,
  speedAtom,
  stateAtom,
} from "../state/lab";
import { SEQUENCE } from "../mascot/engine/states";
import { STATE_LABELS } from "../mascot/mascot-catalog";
import { usePlayer } from "../mascot/PlayerProvider";
import { MascotThumbnail } from "./MascotThumbnail";
import { SurfacePicker } from "./SurfacePicker";
import { Switch } from "./ui/switch";
import s from "../styles/motion.module.css";

import SequenceEditor from "./SequenceEditor";

function Movements() {
  const look = useAtomValue(lookAtom);
  const state = useAtomValue(stateAtom);
  const player = usePlayer();
  return (
    <div className={s.movements} aria-label="Mouvements">
      {SEQUENCE.map((id) => (
        <button
          key={id}
          className={s.movement}
          aria-label={STATE_LABELS[id]}
          aria-pressed={state === id}
          onClick={() => player.choose(id)}
        >
          <MascotThumbnail look={look} state={id} portrait={false} size={76} />
          <span>{STATE_LABELS[id]}</span>
        </button>
      ))}
    </div>
  );
}

function Transport() {
  const [playing, setPlaying] = useAtom(playingAtom);
  const [speed, setSpeed] = useAtom(speedAtom);
  const [follow, setFollow] = useAtom(followAtom);
  const board = useAtomValue(boardAtom);
  const reduced = useAtomValue(reducedMotionAtom);
  const player = usePlayer();
  return (
    <div className={s.player}>
      <div className={s.transport}>
        <button
          aria-label="Mouvement précédent"
          onClick={() => player.next(-1)}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          className={s.playButton}
          disabled={board}
          aria-label={playing ? "Mettre en pause" : "Animer la mascotte"}
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button aria-label="Mouvement suivant" onClick={() => player.next(1)}>
          <ChevronRight size={16} />
        </button>
        <select
          value={speed}
          aria-label="Vitesse de lecture"
          onChange={(event) => setSpeed(Number(event.currentTarget.value))}
        >
          {[0.25, 0.5, 1, 1.5, 2].map((speed) => (
            <option key={speed} value={speed}>
              {String(speed).replace(".", ",")}×
            </option>
          ))}
        </select>
      </div>
      <label className={s.follow}>
        Suivre le curseur
        <Switch
          label="Suivre le curseur"
          checked={follow}
          disabled={board}
          onCheckedChange={setFollow}
        />
      </label>
      {reduced && (
        <p className={s.motionNote}>
          Animations en pause selon ta préférence de mouvements réduits. Le
          lancement manuel reste possible.
        </p>
      )}
    </div>
  );
}

export default function MotionPanel() {
  const player = usePlayer();
  useEffect(() => player.activateMotion(), [player]);
  const [panel, setPanel] = useAtom(motionPanelAtom);
  const [board, setBoard] = useAtom(boardAtom);
  return (
    <div>
      <div className={s.viewRow}>
        <div className={s.tabs} aria-label="Outils Motion">
          <button
            aria-pressed={panel === "movements"}
            onClick={() => setPanel("movements")}
          >
            Mouvements<span>{SEQUENCE.length}</span>
          </button>
          <button
            aria-pressed={panel === "sequence"}
            onClick={() => setPanel("sequence")}
          >
            Séquence
          </button>
        </div>
        <div className={s.boardToggle}>
          <button
            title="Vue mascotte"
            aria-label="Vue mascotte"
            aria-pressed={!board}
            onClick={() => setBoard(false)}
          >
            <Maximize2 size={13} />
          </button>
          <button
            title="Planche des mouvements"
            aria-label="Planche des mouvements"
            aria-pressed={board}
            onClick={() => setBoard(true)}
          >
            <Grid2X2 size={13} />
          </button>
        </div>
      </div>
      {panel === "movements" ? <Movements /> : <SequenceEditor />}
      <Transport />
      <SurfacePicker />
    </div>
  );
}
