import { useTranslation } from "react-i18next";
import { useEffect, useRef, type RefObject } from "react";
import { useAtomValue, useSetAtom, useStore } from "jotai";
import {
  boardAtom,
  frameAtom,
  paintAtom,
  previewColorAtom,
  lookAtom,
  surfaceAtom,
  viewAtom,
  followAtom,
  playingAtom,
} from "../state/lab";
import { BeamySvg } from "../mascot/BeamySvg";
import { STATE_LABELS } from "../mascot/mascot-catalog";
import { SEQUENCE } from "../mascot/engine/states";
import { usePlayer } from "../mascot/PlayerProvider";
import { MascotThumbnail } from "./MascotThumbnail";
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
      {SEQUENCE.map((state) => (
        <button
          key={state}
          aria-label={t(STATE_LABELS[state])}
          onClick={() => {
            setBoard(false);
            player.choose(state);
          }}
        >
          <MascotThumbnail
            look={look}
            state={state}
            portrait={false}
            size={110}
          />
          <span>{t(STATE_LABELS[state])}</span>
        </button>
      ))}
    </div>
  );
}

export function Canvas({
  svgRef,
}: {
  svgRef: RefObject<SVGSVGElement | null>;
}) {
  const { t } = useTranslation();

  const surface = useAtomValue(surfaceAtom);
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
    const scene = svgRef.current?.parentElement;
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
      data-surface={view === "about" ? "paper" : surface}
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
          <div className={s.mascot} data-mascot-preview>
            <LiveMascot svgRef={svgRef} />
          </div>
        )}
      </div>
    </section>
  );
}
