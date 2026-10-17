import { useEffect, useRef, type RefObject } from "react";
import { useAtomValue, useSetAtom, useStore } from "jotai";
import {
  boardAtom,
  frameAtom,
  lookAtom,
  stateAtom,
  surfaceAtom,
  viewAtom,
  followAtom,
  playingAtom,
} from "../state/lab";
import { BeamySvg } from "../mascot/BeamySvg";
import { EXPRESSION_LABELS, STATE_LABELS } from "../mascot/mascot-catalog";
import { SEQUENCE } from "../mascot/engine/states";
import { usePlayer } from "../mascot/PlayerProvider";
import { MascotThumbnail } from "./MascotThumbnail";
import s from "../styles/canvas.module.css";

function LiveMascot({ svgRef }: { svgRef: RefObject<SVGSVGElement | null> }) {
  const frame = useAtomValue(frameAtom);
  const { color, blush } = useAtomValue(lookAtom);
  return (
    <BeamySvg
      ref={svgRef}
      frame={frame}
      color={color}
      blush={blush}
      size={520}
      label="Aperçu de la mascotte"
    />
  );
}

function Board() {
  const look = useAtomValue(lookAtom);
  const setBoard = useSetAtom(boardAtom);
  const player = usePlayer();
  return (
    <div className={s.board} aria-label="Planche des mouvements">
      {SEQUENCE.map((state) => (
        <button
          key={state}
          aria-label={STATE_LABELS[state]}
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
          <span>{STATE_LABELS[state]}</span>
        </button>
      ))}
    </div>
  );
}

function Caption() {
  const view = useAtomValue(viewAtom);
  const state = useAtomValue(stateAtom);
  const look = useAtomValue(lookAtom);
  return (
    <div className={s.caption}>
      <span>
        {view === "motion"
          ? STATE_LABELS[state]
          : EXPRESSION_LABELS[look.expression]}
      </span>
      <p>
        {view === "motion" ? (
          <>
            Un peu de vie. <kbd>Espace</kbd> pour la pause.
          </>
        ) : (
          "Une forme. Deux yeux. Tout un caractère."
        )}
      </p>
    </div>
  );
}

export function Canvas({
  svgRef,
}: {
  svgRef: RefObject<SVGSVGElement | null>;
}) {
  const surface = useAtomValue(surfaceAtom);
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
  return (
    <section
      className={s.canvas}
      data-surface={surface}
      aria-label="Aperçu"
      style={{ "--mascot-color": color } as React.CSSProperties}
    >
      <div
        className={s.scene}
        onPointerMove={(event) => {
          if (
            !board &&
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
        <div className={s.sceneHeading}>
          <span>YOUR LITTLE CHARACTER</span>
          <h1>
            Make it yours<span>.</span>
          </h1>
        </div>
        {board ? (
          <Board />
        ) : (
          <div className={s.mascot} data-mascot-preview>
            <LiveMascot svgRef={svgRef} />
          </div>
        )}
        <Caption />
      </div>
    </section>
  );
}
