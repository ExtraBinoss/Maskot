import { useState } from "react";
import { useAtom } from "jotai";
import { ChevronDown, RotateCcw } from "lucide-react";
import { lookAtom } from "../state/lab";
import { EYE_STYLES } from "../mascot/engine/eye-styles";
import { ScrollShadow } from "./ScrollShadow";
import { SHAPES } from "../mascot/engine/skins";
import {
  DEFAULT_EYE_GEOMETRY,
  EYE_GEOMETRY_LIMITS,
} from "../mascot/engine/eye-geometry";
import type { EyeGeometry } from "../mascot/engine/bot-types";
import { PALETTE, SHAPE_LABELS } from "../mascot/mascot-catalog";
import { VisibleMascotThumbnail } from "./VisibleMascotThumbnail";
import { EyePreview } from "./EyePreview";
import { Expressions } from "./Expressions";
import { SurfacePicker } from "./SurfacePicker";
import { Switch } from "./ui/switch";
import { Range } from "./ui/range";
import s from "../styles/settings.module.css";

const geometryControls: { key: keyof EyeGeometry; label: string }[] = [
  { key: "size", label: "Taille des yeux" },
  { key: "width", label: "Largeur des yeux" },
  { key: "height", label: "Hauteur des yeux" },
  { key: "spacing", label: "Écartement des yeux" },
  { key: "offsetY", label: "Position verticale" },
];

function ColorControl() {
  const [look, setLook] = useAtom(lookAtom);
  const color = look.color;
  const [draft, setDraft] = useState({ source: color, text: color });
  const value = draft.source === color ? draft.text : color;
  const valid = /^#[0-9a-f]{6}$/i.test(value);
  return (
    <section className={s.section}>
      <h3>
        Couleur
        <input
          className={s.colorInput}
          aria-label="Couleur personnalisée au format hexadécimal"
          value={value}
          aria-invalid={!valid}
          aria-describedby={!valid ? "color-error" : undefined}
          maxLength={7}
          spellCheck={false}
          onChange={(event) => {
            const text = event.currentTarget.value;
            setDraft({ source: color, text });
            if (/^#[0-9a-f]{6}$/i.test(text)) setLook({ ...look, color: text });
          }}
        />
      </h3>
      <div className={s.palette}>
        {PALETTE.map((color) => (
          <button
            key={color}
            style={{ background: color }}
            aria-label={"Couleur " + color}
            aria-pressed={look.color.toLowerCase() === color}
            onClick={() => {
              setDraft({ source: color, text: color });
              setLook({ ...look, color });
            }}
          />
        ))}
      </div>
      {!valid && (
        <p id="color-error" className={s.error}>
          Utilise une couleur comme #FF5A1F.
        </p>
      )}
    </section>
  );
}

export default function StaticPanel() {
  const [look, setLook] = useAtom(lookAtom);
  return (
    <div aria-label="Apparence de la mascotte">
      <section className={s.section}>
        <h3>
          Silhouette<span>{SHAPES.length} formes</span>
        </h3>
        <ScrollShadow label="Silhouettes">
          <div className={s.shapeGrid}>
            {SHAPES.map(({ id }) => (
              <button
                key={id}
                className={s.previewChoice}
                aria-label={SHAPE_LABELS[id]}
                aria-pressed={look.shape === id}
                onClick={() => setLook({ ...look, shape: id })}
              >
                <VisibleMascotThumbnail
                  look={{ ...look, shape: id }}
                  size={47}
                />
                <span>{SHAPE_LABELS[id]}</span>
              </button>
            ))}
          </div>
        </ScrollShadow>
      </section>
      <section className={s.section}>
        <h3>
          Style des yeux<span>{EYE_STYLES.length} regards</span>
        </h3>
        <ScrollShadow label="Styles des yeux">
          <div className={s.eyeGrid}>
            {EYE_STYLES.map(({ id, label }) => (
              <button
                key={id}
                className={s.eyeChoice}
                aria-label={label}
                aria-pressed={look.eyes === id}
                onClick={() => setLook({ ...look, eyes: id })}
              >
                <EyePreview look={look} style={id} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </ScrollShadow>
      </section>
      <Expressions />
      <ColorControl />
      <details className={s.details}>
        <summary>
          Ajuster les yeux
          <ChevronDown size={14} />
        </summary>
        <div className={s.geometry}>
          {geometryControls.map(({ key, label }) => (
            <Range
              key={key}
              label={label}
              suffix=" %"
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
            Réinitialiser les yeux
          </button>
        </div>
      </details>
      <div className={s.settingRow}>
        <span>Petites joues rosées</span>
        <Switch
          label="Petites joues rosées"
          checked={look.blush}
          onCheckedChange={(blush) => setLook({ ...look, blush })}
        />
      </div>
      <SurfacePicker />
    </div>
  );
}
