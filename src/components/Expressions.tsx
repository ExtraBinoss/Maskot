import { useTranslation } from "react-i18next";
import { useDeferredValue } from "react";
import { useAtom } from "jotai";
import { EXPRESSIONS } from "../mascot/engine/expressions";
import { EXPRESSION_LABELS } from "../mascot/mascot-catalog";
import { lookAtom } from "../state/lab";
import { usePlayer } from "../mascot/PlayerProvider";
import { VisibleMascotThumbnail } from "./VisibleMascotThumbnail";
import { ScrollShadow } from "./ScrollShadow";
import s from "../styles/settings.module.css";

export function Expressions() {
  const { t } = useTranslation();

  const [look, setLook] = useAtom(lookAtom);
  const previewLook = useDeferredValue(look);
  const player = usePlayer();
  return (
    <section className={s.section}>
      <h3>
        {t("Expressions")}
        <span>{t("{{count}} humeurs", { count: EXPRESSIONS.length })}</span>
      </h3>
      <ScrollShadow label={t("Expressions")}>
        <div className={s.expressionGrid}>
          {EXPRESSIONS.map(({ id }) => (
            <button
              key={id}
              className={s.previewChoice}
              aria-label={t("Expression {{label}}", {
                label: t(EXPRESSION_LABELS[id]),
              })}
              aria-pressed={look.expression === id}
              onClick={() => {
                setLook({ ...look, expression: id });
                player.choose("idle");
              }}
            >
              <VisibleMascotThumbnail
                look={{ ...previewLook, expression: id }}
                size={46}
              />
              <span>{t(EXPRESSION_LABELS[id])}</span>
            </button>
          ))}
        </div>
      </ScrollShadow>
    </section>
  );
}
