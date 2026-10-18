import { useState } from "react";
import { m, useReducedMotion } from "motion/react";
import { useAtomValue, useStore } from "jotai";
import { Dice5 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  lookAtom,
  previewColorAtom,
  previewEyeGeometryAtom,
  timelineAtom,
  viewAtom,
} from "../state/lab";
import {
  randomMascotLook,
  randomMascotTimeline,
} from "../mascot/mascot-random";
import { usePlayer } from "../mascot/PlayerProvider";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import s from "../styles/workspace.module.css";

const MotionButton = m.create(Button);

export function RandomizeButton() {
  const { t } = useTranslation();
  const view = useAtomValue(viewAtom);
  const store = useStore();
  const player = usePlayer();
  const reduced = useReducedMotion();
  const [roll, setRoll] = useState(0);
  const label = t(
    view === "motion" ? "Générer 10 mouvements" : "Mascotte aléatoire",
  );
  if (view === "about") return null;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <MotionButton
            variant="outline"
            size="icon"
            whileTap={{ scale: 0.9 }}
          />
        }
        className={`${s.randomizer} ${s.glass}`}
        data-randomize={view}
        aria-label={label}
        onClick={() => {
          setRoll((value) => value + 1);
          if (view === "motion") {
            store.set(timelineAtom, randomMascotTimeline());
            player.playSequence();
          } else {
            store.set(previewColorAtom, null);
            store.set(previewEyeGeometryAtom, null);
            store.set(lookAtom, randomMascotLook(store.get(lookAtom)));
          }
        }}
      >
        <m.span
          className={s.dice}
          initial={false}
          animate={{ rotate: reduced ? 0 : roll * 360 }}
          transition={{ type: "spring", stiffness: 280, damping: 20 }}
        >
          <Dice5 size={20} aria-hidden="true" />
        </m.span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
