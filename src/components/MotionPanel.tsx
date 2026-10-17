import { useTranslation } from "react-i18next";
// Layout adapted from Bloub's App.vue / Timeline.vue (MIT). See licenses/NOTICE.txt.
import { useEffect, type RefObject } from "react";
import { useAtom, useAtomValue } from "jotai";
import { ChevronLeft, ChevronRight, Grid2X2, Maximize2 } from "lucide-react";
import {
  boardAtom,
  followAtom,
  lookAtom,
  stateAtom,
  speedAtom,
  timelineAtom,
  reducedMotionAtom,
} from "../state/lab";
import { SEQUENCE } from "../mascot/engine/states";
import { STATE_LABELS, timelineDuration } from "../mascot/mascot-catalog";
import { usePlayer } from "../mascot/PlayerProvider";
import { MascotThumbnail } from "./MascotThumbnail";
import { Switch } from "./ui/switch";
import { WorkspaceActions } from "./WorkspaceActions";
import SequenceEditor from "./SequenceEditor";
import s from "../styles/motion.module.css";
import w from "../styles/workspace.module.css";

export default function MotionPanel({
  svgRef,
}: {
  svgRef: RefObject<SVGSVGElement | null>;
}) {
  const { t, i18n } = useTranslation();

  const look = useAtomValue(lookAtom);
  const state = useAtomValue(stateAtom);
  const [steps, setSteps] = useAtom(timelineAtom);
  const [board, setBoard] = useAtom(boardAtom);
  const [follow, setFollow] = useAtom(followAtom);
  const [speed, setSpeed] = useAtom(speedAtom);
  const reduced = useAtomValue(reducedMotionAtom);
  const player = usePlayer();
  useEffect(() => {
    player.seek(0);
    player.activateMotion();
  }, [player]);
  return (
    <>
      <aside
        className={w.inspector}
        id="settings"
        aria-label={t("Réglages de Maskot")}
      >
        <div className={w.panelScroll}>
          <header className={s.paletteHeader}>
            <h2>{t("Animation")}</h2>
            <div className={s.boardToggle}>
              <button
                title={t("Vue mascotte")}
                aria-label={t("Vue mascotte")}
                aria-pressed={!board}
                onClick={() => setBoard(false)}
              >
                <Maximize2 size={14} />
              </button>
              <button
                title={t("Planche des mouvements")}
                aria-label={t("Planche des mouvements")}
                aria-pressed={board}
                onClick={() => setBoard(true)}
              >
                <Grid2X2 size={14} />
              </button>
            </div>
          </header>
          <div className={s.movements} aria-label={t("Mouvements")}>
            {SEQUENCE.map((id) => (
              <button
                key={id}
                className={s.movement}
                aria-label={t(STATE_LABELS[id])}
                aria-pressed={state === id}
                onClick={() => {
                  setBoard(false);
                  if (steps.length < 32) {
                    const start = timelineDuration(steps);
                    setSteps([...steps, { state: id, duration: 2 }]);
                    player.seek(start);
                  } else player.choose(id);
                }}
              >
                <MascotThumbnail
                  look={look}
                  state={id}
                  portrait={false}
                  size={68}
                />
                <span>{t(STATE_LABELS[id])}</span>
              </button>
            ))}
          </div>
          <p className={s.hint}>
            {t(
              "Un clic pour ajouter au montage. Glisse une vignette pour la déplacer.",
            )}
          </p>
          <div className={s.options}>
            <div className={s.optionRow}>
              <span>{t("Lecture")}</span>
              <div className={s.playbackOptions}>
                <button
                  aria-label={t("Mouvement précédent")}
                  onClick={() => player.next(-1)}
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  aria-label={t("Mouvement suivant")}
                  onClick={() => player.next(1)}
                >
                  <ChevronRight size={15} />
                </button>
                <select
                  value={speed}
                  aria-label={t("Vitesse de lecture")}
                  onChange={(e) => setSpeed(Number(e.currentTarget.value))}
                >
                  {[0.25, 0.5, 1, 1.5, 2].map((value) => (
                    <option key={value} value={value}>
                      {value.toLocaleString(i18n.resolvedLanguage)}×
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label className={s.optionRow}>
              {t("Suivre le curseur")}
              <Switch
                label={t("Suivre le curseur")}
                checked={follow}
                disabled={board}
                onCheckedChange={setFollow}
              />
            </label>
            {reduced && (
              <p className={s.hint}>
                {t(
                  "La lecture démarre en pause selon ta préférence de mouvements réduits.",
                )}
              </p>
            )}
          </div>
        </div>
        <WorkspaceActions svgRef={svgRef} />
      </aside>
      <SequenceEditor />
    </>
  );
}
