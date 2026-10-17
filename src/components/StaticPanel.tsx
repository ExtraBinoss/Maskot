import { useTranslation } from "react-i18next";
import { useDeferredValue } from "react";
import { useAtom } from "jotai";
import { lookAtom } from "../state/lab";
import { EYE_STYLES } from "../mascot/engine/eye-styles";
import { ScrollShadow } from "./ScrollShadow";
import { SHAPES } from "../mascot/engine/skins";
import { SYMBOLS, ORBS, isFigure } from "../mascot/figures";
import { SHAPE_LABELS } from "../mascot/mascot-catalog";
import { VisibleMascotThumbnail } from "./VisibleMascotThumbnail";
import { EyePreview } from "./EyePreview";
import { Expressions } from "./Expressions";
import { Switch } from "./ui/switch";
import { EyeControls } from "./EyeControls";
import { ColorControl } from "./ColorControl";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./ui/accordion";
import s from "../styles/settings.module.css";

export default function StaticPanel() {
  const { t } = useTranslation();

  const [look, setLook] = useAtom(lookAtom);
  const previewLook = useDeferredValue(look);
  return (
    <div aria-label={t("Apparence de la mascotte")}>
      <section className={s.section}>
        <h3>
          {t("Silhouette")}
          <span>
            {t("{{count}} formes", {
              count: SHAPES.length + SYMBOLS.length + ORBS.length,
            })}
          </span>
        </h3>
        <ScrollShadow label={t("Silhouettes")}>
          <div className={s.shapeGrid}>
            {SHAPES.map(({ id }) => (
              <button
                key={id}
                className={s.previewChoice}
                aria-label={t(SHAPE_LABELS[id])}
                aria-pressed={look.shape === id}
                onClick={() => setLook({ ...look, shape: id })}
              >
                <VisibleMascotThumbnail
                  look={{ ...previewLook, shape: id }}
                  size={47}
                />
                <span>{t(SHAPE_LABELS[id])}</span>
              </button>
            ))}
          </div>
          {[
            { label: "Symboles", entries: SYMBOLS },
            { label: "Thinking orbs", entries: ORBS },
          ].map(({ label, entries }) => (
            <div key={label}>
              <h4 className={s.familyLabel}>{t(label)}</h4>
              <div className={s.shapeGrid}>
                {entries.map(({ id, label }) => (
                  <button
                    key={id}
                    className={s.previewChoice}
                    aria-label={t(label)}
                    aria-pressed={look.shape === id}
                    onClick={() => setLook({ ...look, shape: id })}
                  >
                    <VisibleMascotThumbnail
                      look={{ ...previewLook, shape: id }}
                      size={47}
                    />
                    <span>{t(label).split(" · ").at(-1)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </ScrollShadow>
      </section>
      {!isFigure(look.shape) && (
        <>
          <section className={s.section}>
            <h3>
              {t("Style des yeux")}
              <span>
                {t("{{count}} regards", { count: EYE_STYLES.length })}
              </span>
            </h3>
            <ScrollShadow label={t("Styles des yeux")}>
              <div className={s.eyeGrid}>
                {EYE_STYLES.map(({ id, label }) => (
                  <button
                    key={id}
                    className={s.eyeChoice}
                    aria-label={t(label)}
                    aria-pressed={look.eyes === id}
                    onClick={() => setLook({ ...look, eyes: id })}
                  >
                    <EyePreview look={previewLook} style={id} />
                    <span>{t(label)}</span>
                  </button>
                ))}
              </div>
            </ScrollShadow>
          </section>
          <Expressions />
        </>
      )}
      <ColorControl />
      {!isFigure(look.shape) && (
        <>
          <Accordion className={s.details}>
            <AccordionItem value="geometry" className={s.geometryItem}>
              <AccordionTrigger className={s.geometryTrigger}>
                {t("Ajuster les yeux")}
              </AccordionTrigger>
              <AccordionContent className={s.geometry}>
                <EyeControls />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className={s.settingRow}>
            <span>{t("Petites joues rosées")}</span>
            <Switch
              label={t("Petites joues rosées")}
              checked={look.blush}
              onCheckedChange={(blush) => setLook({ ...look, blush })}
            />
          </div>
        </>
      )}
    </div>
  );
}
