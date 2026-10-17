import { useAtom, useAtomValue } from "jotai";
import { ArrowDown, ArrowUp, Play, Repeat2, Trash2 } from "lucide-react";
import {
  activeStepAtom,
  durationAtom,
  elapsedAtom,
  lookAtom,
  sequencingAtom,
  timelineAtom,
} from "../state/lab";
import { STATE_LABELS, timelineDuration } from "../mascot/mascot-catalog";
import { SEQUENCE } from "../mascot/engine/states";
import type { StateId } from "../mascot/engine/bot-types";
import { usePlayer } from "../mascot/PlayerProvider";
import { MascotThumbnail } from "./MascotThumbnail";
import { Range } from "./ui/range";
import s from "../styles/motion.module.css";

function Scrubber() {
  const elapsed = useAtomValue(elapsedAtom);
  const duration = useAtomValue(durationAtom);
  const player = usePlayer();
  return (
    <div className={s.scrubber}>
      <div>
        <span>{elapsed.toFixed(1)} s</span>
        <span>{duration.toFixed(1)} s</span>
      </div>
      <Range
        label="Position dans la séquence"
        value={elapsed}
        min={0}
        max={duration}
        step={0.01}
        showLabel={false}
        onChange={player.seek}
      />
    </div>
  );
}

export default function SequenceEditor() {
  const [steps, setSteps] = useAtom(timelineAtom);
  const look = useAtomValue(lookAtom);
  const active = useAtomValue(activeStepAtom);
  const sequencing = useAtomValue(sequencingAtom);
  const total = useAtomValue(durationAtom);
  const player = usePlayer();
  const move = (index: number, direction: number) => {
    const next = [...steps];
    const destination = index + direction;
    if (destination < 0 || destination >= next.length) return;
    [next[index], next[destination]] = [next[destination], next[index]];
    setSteps(next);
  };
  return (
    <section className={s.sequence} aria-label="Chorégraphie">
      <header className={s.sequenceHeader}>
        <span>
          <Repeat2 size={12} />
          {total.toFixed(1)} s · en boucle
        </span>
        <button onClick={player.playSequence} aria-label="Jouer la séquence">
          <Play size={12} />
          Jouer
        </button>
      </header>
      <div className={s.steps}>
        {steps.map((step, index) => (
          <article
            key={index}
            className={s.step}
            aria-current={sequencing && active === index ? "step" : undefined}
          >
            <div className={s.stepTop}>
              <span className={s.stepNumber}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <button
                className={s.stepPreview}
                aria-label={
                  "Aller au mouvement " +
                  (index + 1) +
                  " : " +
                  STATE_LABELS[step.state]
                }
                onClick={() =>
                  player.seek(timelineDuration(steps.slice(0, index)))
                }
              >
                <MascotThumbnail
                  look={look}
                  state={step.state}
                  portrait={false}
                  size={44}
                />
                <span>{STATE_LABELS[step.state]}</span>
              </button>
              <div className={s.stepActions}>
                <button
                  aria-label={
                    "Déplacer le mouvement " + (index + 1) + " à gauche"
                  }
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  aria-label={
                    "Déplacer le mouvement " + (index + 1) + " à droite"
                  }
                  disabled={index === steps.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown size={12} />
                </button>
                <button
                  aria-label={"Retirer le mouvement " + (index + 1)}
                  disabled={steps.length === 1}
                  onClick={() => setSteps(steps.filter((_, i) => i !== index))}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <Range
              label={"Durée du mouvement " + (index + 1)}
              min={0.6}
              max={10}
              step={0.1}
              value={step.duration}
              suffix=" s"
              onChange={(duration) =>
                setSteps(
                  steps.map((step, i) =>
                    i === index ? { ...step, duration } : step,
                  ),
                )
              }
            />
          </article>
        ))}
      </div>
      <select
        className={s.addStep}
        value=""
        aria-label="Ajouter un mouvement"
        disabled={steps.length >= 32}
        onChange={(event) => {
          const state = event.currentTarget.value as StateId;
          if (steps.length < 32 && SEQUENCE.includes(state))
            setSteps([...steps, { state, duration: 2 }]);
        }}
      >
        <option value="" disabled>
          {steps.length >= 32 ? "32 étapes maximum" : "+ Ajouter un mouvement"}
        </option>
        {SEQUENCE.map((state) => (
          <option key={state} value={state}>
            {STATE_LABELS[state]}
          </option>
        ))}
      </select>
      <Scrubber />
    </section>
  );
}
