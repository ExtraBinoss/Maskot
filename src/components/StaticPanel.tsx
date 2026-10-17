import { useTranslation } from "react-i18next";
import { useAtom } from "jotai";
import { RotateCcw } from "lucide-react";
import { lookAtom } from "../state/lab";
import { EYE_STYLES } from "../mascot/engine/eye-styles";
import { ScrollShadow } from "./ScrollShadow";
import { SHAPES } from "../mascot/engine/skins";
import {
  DEFAULT_EYE_GEOMETRY,
  EYE_GEOMETRY_LIMITS,
} from "../mascot/engine/eye-geometry";
import type { EyeGeometry } from "../mascot/engine/bot-types";
import { SHAPE_LABELS } from "../mascot/mascot-catalog";
import { VisibleMascotThumbnail } from "./VisibleMascotThumbnail";
import { EyePreview } from "./EyePreview";
import { Expressions } from "./Expressions";
import { SurfacePicker } from "./SurfacePicker";
import { Switch } from "./ui/switch";
import { Range } from "./ui/range";
import { ColorControl } from "./ColorControl";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./ui/accordion";
import s from "../styles/settings.module.css";

const geometryControls: { key: keyof EyeGeometry; label: string }[] = [
  { key: "size", label: "Taille des yeux" },
  { key: "width", label: "Largeur des yeux" },
  { key: "height", label: "Hauteur des yeux" },
  { key: "spacing", label: "Écartement des yeux" },
  { key: "offsetY", label: "Position verticale" },
];

export default function StaticPanel() {
  const { t } = useTranslation();

  const [look, setLook] = useAtom(lookAtom);
  return (
    <div aria-label={t("Apparence de la mascotte")}>
      <section className={s.section}>
        <h3>
          {t("Silhouette")}
          <span>{t("{{count}} formes", { count: SHAPES.length })}</span>
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
                  look={{ ...look, shape: id }}
                  size={47}
                />
                <span>{t(SHAPE_LABELS[id])}</span>
              </button>
            ))}
          </div>
        </ScrollShadow>
      </section>
      <section className={s.section}>
        <h3>
          {t("Style des yeux")}
          <span>{t("{{count}} regards", { count: EYE_STYLES.length })}</span>
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
                <EyePreview look={look} style={id} />
                <span>{t(label)}</span>
              </button>
            ))}
          </div>
        </ScrollShadow>
      </section>
      <Expressions />
      <ColorControl />
      <Accordion className={s.details}>
        <AccordionItem value="geometry" className={s.geometryItem}>
          <AccordionTrigger className={s.geometryTrigger}>
            {t("Ajuster les yeux")}
          </AccordionTrigger>
          <AccordionContent className={s.geometry}>
            {geometryControls.map(({ key, label }) => (
              <Range
                key={key}
                label={t(label)}
                suffix=" %"
                defaultValue={DEFAULT_EYE_GEOMETRY[key] * 100}
                value={Math.round(look.eyeGeometry[key] * 100)}
                min={EYE_GEOMETRY_LIMITS[key][0] * 100}
                max={EYE_GEOMETRY_LIMITS[key][1] * 100}
                onChange={(value) =>
                  setLook({
                    ...look,
                    eyeGeometry: { ...look.eyeGeometry, [key]: value / 100 },
                  })
                }
              />
            ))}
            <button
              className={s.textButton}
              onClick={() =>
                setLook({ ...look, eyeGeometry: { ...DEFAULT_EYE_GEOMETRY } })
              }
            >
              <RotateCcw size={12} />
              {t("Réinitialiser les yeux")}
            </button>
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
      <SurfacePicker />
    </div>
  );
}
