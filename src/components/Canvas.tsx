import { useTranslation } from "react-i18next";
import { useEffect, useRef, type RefObject } from "react";
import { m, useReducedMotion } from "motion/react";
import { useAtomValue, useSetAtom, useStore } from "jotai";
import {
  boardAtom,
  frameAtom,
  paintAtom,
  previewColorAtom,
  lookAtom,
  viewAtom,
  followAtom,
  playingAtom,
} from "../state/lab";
import { BeamySvg } from "../mascot/BeamySvg";
import { usePlayer } from "../mascot/PlayerProvider";
import { MotionPicker } from "./MotionPicker";
import s from "../styles/canvas.module.css";

function LiveMascot({ svgRef }: { svgRef: RefObject<SVGSVGElement | null> }) {
  const { t } = useTranslation();

  const frame = useAtomValue(frameAtom);
  const { color, blush } = useAtomValue(paintAtom);
  const previewColor = useAtomValue(previewColorAtom);
  return (
    <BeamySvg
      ref={svgRef}
      frame={frame}
      color={previewColor ?? color}
      blush={blush}
      size={520}
      label={t("Aperçu de la mascotte")}
    />
  );
}

function Board() {
  const { t } = useTranslation();

  const look = useAtomValue(lookAtom);
  const setBoard = useSetAtom(boardAtom);
  const player = usePlayer();
  return (
    <div className={s.board} aria-label={t("Planche des mouvements")}>
      <MotionPicker
        look={look}
        onSelect={(state) => {
          setBoard(false);
          player.choose(state);
        }}
      />
    </div>
  );
}

export function Canvas({
  svgRef,
}: {
  svgRef: RefObject<SVGSVGElement | null>;
}) {
  const { t } = useTranslation();

  const reduced = useReducedMotion();
  const view = useAtomValue(viewAtom);
  const board = useAtomValue(boardAtom);
  const { color } = useAtomValue(lookAtom);
  const player = usePlayer();
  const store = useStore();
  const rect = useRef<DOMRect | null>(null);
  useEffect(() => {
    const invalidate = () => {
      rect.current = null;
    };
    window.addEventListener("resize", invalidate);
    return () => window.removeEventListener("resize", invalidate);
  }, []);
  useEffect(() => {
    rect.current = null;
    if (view !== "about") return;
    const scene = svgRef.current?.parentElement?.parentElement;
    const invalidate = () => {
      rect.current = null;
    };
    const follow = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !svgRef.current) return;
      rect.current ??= svgRef.current.getBoundingClientRect();
      player.aim(event, rect.current);
    };
    window.addEventListener("pointermove", follow, { passive: true });
    window.addEventListener("blur", player.release);
    scene?.addEventListener("transitionend", invalidate);
    return () => {
      window.removeEventListener("pointermove", follow);
      window.removeEventListener("blur", player.release);
      scene?.removeEventListener("transitionend", invalidate);
    };
  }, [view, player, svgRef]);
  return (
    <section
      className={s.canvas}
      data-view={view}
      aria-label={t("Aperçu")}
      style={{ "--mascot-color": color } as React.CSSProperties}
    >
      <div
        className={s.scene}
        onPointerMove={(event) => {
          if (
            !board &&
            store.get(viewAtom) !== "about" &&
            store.get(followAtom) &&
            store.get(playingAtom) &&
            event.pointerType !== "touch"
          ) {
            rect.current ??= event.currentTarget.getBoundingClientRect();
            player.aim(event, rect.current);
          }
        }}
        onPointerLeave={() => {
          rect.current = null;
          if (store.get(followAtom)) player.release();
        }}
      >
        {board ? (
          <Board />
        ) : (
          <div className={s.mascot}>
            <m.div
              className={s.arrival}
              data-mascot-preview
              initial={
                reduced
                  ? false
                  : { opacity: 0, scale: 0.55, y: 44, rotate: -14 }
              }
              animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 145,
                damping: 16,
                mass: 0.85,
              }}
            >
              <LiveMascot svgRef={svgRef} />
            </m.div>
          </div>
        )}
      </div>
    </section>
  );
}
