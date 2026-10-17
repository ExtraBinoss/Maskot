import { useAtom } from "jotai";
import { EXPRESSIONS } from "../mascot/engine/expressions";
import { EXPRESSION_LABELS } from "../mascot/mascot-catalog";
import { lookAtom } from "../state/lab";
import { usePlayer } from "../mascot/PlayerProvider";
import { MascotThumbnail } from "./MascotThumbnail";
import s from "../styles/settings.module.css";

export function Expressions() {
  const [look, setLook] = useAtom(lookAtom);
  const player = usePlayer();
  return (
    <section className={s.section} aria-label="Expressions">
      <h3>
        Expressions<span>{EXPRESSIONS.length} humeurs</span>
      </h3>
      <div className={s.expressionGrid}>
        {EXPRESSIONS.map(({ id }) => (
          <button
            key={id}
            className={s.previewChoice}
            aria-label={`Expression ${EXPRESSION_LABELS[id]}`}
            aria-pressed={look.expression === id}
            onClick={() => {
              setLook({ ...look, expression: id });
              player.choose("idle");
            }}
          >
            <MascotThumbnail look={{ ...look, expression: id }} size={46} />
            <span>{EXPRESSION_LABELS[id]}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
