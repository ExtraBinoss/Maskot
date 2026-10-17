import { useAtom, useAtomValue } from "jotai";
import { ArrowLeft, ArrowRight, Film, Play, Plus, Trash2 } from "lucide-react";
import {
  activeStepAtom,
  durationAtom,
  elapsedAtom,
  lookAtom,
  sequencingAtom,
  timelineAtom,
} from "../state/lab";
import { BeamySvg } from "../mascot/BeamySvg";
import {
  createMascotEngine,
  STATE_LABELS,
  timelineDuration,
} from "../mascot/mascot-catalog";
import { SEQUENCE } from "../mascot/engine/states";
import type { StateId } from "../mascot/engine/bot-types";
import { usePlayer } from "../mascot/PlayerProvider";
import { Button } from "./ui/button";
import { Range } from "./ui/range";
import s from "../styles/lab.module.css";

function Scrubber() {
  const elapsed = useAtomValue(elapsedAtom);
  const duration = useAtomValue(durationAtom);
  const player = usePlayer();
  return (
    <div className={s.scrubber}>
      <span>{elapsed.toFixed(1)} s</span>
      <Range
        label="Position dans la séquence"
        value={elapsed}
        min={0}
        max={duration}
        step={0.01}
        showLabel={false}
        onChange={player.seek}
      />
      <span>{duration.toFixed(1)} s</span>
    </div>
  );
}

export function Timeline() {
  const [steps, setSteps] = useAtom(timelineAtom);
  const look = useAtomValue(lookAtom);
  const active = useAtomValue(activeStepAtom);
  const sequencing = useAtomValue(sequencingAtom);
  const total = useAtomValue(durationAtom);
  const player = usePlayer();
  const move = (index: number, direction: number) => {
    const updated = [...steps];
    const destination = index + direction;
    if (destination < 0 || destination >= updated.length) return;
    [updated[index], updated[destination]] = [
      updated[destination],
      updated[index],
    ];
    setSteps(updated);
  };
  return (
    <section className={`${s.panel} ${s.timeline}`} aria-label="Chorégraphie">
      <header className={s.timelineHeading}>
        <div className={s.panelHeading}>
          <Film size={17} />
          <h2>Sa petite chorégraphie</h2>
          <span>{total.toFixed(1)} s · en boucle</span>
        </div>
        <Button variant="secondary" size="sm" onClick={player.playSequence}>
          <Play />
          Jouer la séquence
        </Button>
      </header>
      <p className={s.timelineDescription}>
        Assemble ses mouvements pour imaginer un chargement, une arrivée ou un
        petit succès.
      </p>
      <div className={s.steps}>
        {steps.map((step, index) => (
          <article
            key={index}
            className={s.step}
            data-active={sequencing && active === index}
            aria-current={sequencing && active === index ? "step" : undefined}
          >
            <button
              className={s.stepPreview}
              aria-label={`Aller au mouvement ${index + 1} : ${STATE_LABELS[step.state]}`}
              onClick={() =>
                player.seek(timelineDuration(steps.slice(0, index)))
              }
            >
              <span className={s.stepNumber}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <BeamySvg
                frame={createMascotEngine(look, step.state).sample(0.9)}
                color={look.color}
                blush={look.blush}
                size={65}
              />
              <span>{STATE_LABELS[step.state]}</span>
            </button>
            <Range
              label={`Durée du mouvement ${index + 1}`}
              min={0.6}
              max={10}
              step={0.1}
              value={step.duration}
              suffix=" s"
              onChange={(duration) =>
                setSteps(
                  steps.map((item, i) =>
                    i === index ? { ...item, duration } : item,
                  ),
                )
              }
            />
            <div className={s.stepActions}>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Déplacer le mouvement ${index + 1} à gauche`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowLeft />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Déplacer le mouvement ${index + 1} à droite`}
                disabled={index === steps.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowRight />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Retirer le mouvement ${index + 1}`}
                disabled={steps.length === 1}
                onClick={() => setSteps(steps.filter((_, i) => i !== index))}
              >
                <Trash2 />
              </Button>
            </div>
          </article>
        ))}
        <div className={s.addStep}>
          <Plus size={22} />
          <select
            className={s.select}
            value=""
            aria-label="Ajouter un mouvement"
            disabled={steps.length >= 32}
            onChange={(event) => {
              if (
                steps.length < 32 &&
                SEQUENCE.includes(event.currentTarget.value as StateId)
              ) {
                setSteps([
                  ...steps,
                  { state: event.currentTarget.value as StateId, duration: 2 },
                ]);
              }
            }}
          >
            <option value="" disabled>
              {steps.length >= 32 ? "32 maximum" : "Ajouter"}
            </option>
            {SEQUENCE.map((state) => (
              <option key={state} value={state}>
                {STATE_LABELS[state]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Scrubber />
    </section>
  );
}
