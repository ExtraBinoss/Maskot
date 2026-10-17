import { useState } from "react";
import { useAtom } from "jotai";
import {
  Ellipsis,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Star,
} from "lucide-react";
import { lookAtom } from "../state/lab";
import { usePlayer } from "../mascot/PlayerProvider";
import { BeamySvg } from "../mascot/BeamySvg";
import { SHAPES } from "../mascot/engine/skins";
import { EXPRESSIONS } from "../mascot/engine/expressions";
import {
  DEFAULT_EYE_GEOMETRY,
  EYE_GEOMETRY_LIMITS,
} from "../mascot/engine/eye-geometry";
import type { ExpressionId, EyeGeometry } from "../mascot/engine/bot-types";
import {
  createMascotEngine,
  EXPRESSION_LABELS,
  PALETTE,
  SHAPE_LABELS,
} from "../mascot/mascot-catalog";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Range } from "./ui/range";
import s from "../styles/lab.module.css";

const eyeStyles = [
  { id: "sparkle", label: "Éclats", Icon: Sparkles },
  { id: "star", label: "Étoiles", Icon: Star },
  { id: "capsule", label: "Gélules", Icon: Ellipsis },
] as const;
const eyeControls: { key: keyof EyeGeometry; label: string }[] = [
  { key: "size", label: "Taille des yeux" },
  { key: "width", label: "Largeur des yeux" },
  { key: "height", label: "Hauteur des yeux" },
  { key: "spacing", label: "Écartement des yeux" },
  { key: "offsetY", label: "Position verticale" },
];

function ColorInput({
  color,
  onChange,
}: {
  color: string;
  onChange: (color: string) => void;
}) {
  const [draft, setDraft] = useState({ source: color, text: color });
  const value = draft.source === color ? draft.text : color;
  const valid = /^#[0-9a-f]{6}$/i.test(value);
  return (
    <div>
      <input
        className={s.colorInput}
        aria-label="Couleur personnalisée au format hexadécimal"
        aria-invalid={!valid}
        aria-describedby={!valid ? "color-error" : undefined}
        value={value}
        spellCheck={false}
        maxLength={7}
        onChange={(event) => {
          const text = event.currentTarget.value;
          setDraft({ source: color, text });
          if (/^#[0-9a-f]{6}$/i.test(text)) onChange(text);
        }}
      />
      {!valid && (
        <p id="color-error" className={s.fieldError}>
          Utilise une couleur comme #FF5A1F.
        </p>
      )}
    </div>
  );
}

export function Appearance() {
  const [look, setLook] = useAtom(lookAtom);
  const player = usePlayer();
  return (
    <aside
      className={`${s.panel} ${s.appearance}`}
      aria-label="Apparence de la mascotte"
    >
      <div className={s.panelHeading}>
        <SlidersHorizontal size={16} />
        <h2>Son petit look</h2>
      </div>
      <section className={s.appearanceSection}>
        <h3>
          Silhouette <span>{SHAPES.length} formes</span>
        </h3>
        <div className={s.shapeGrid}>
          {SHAPES.map((shape) => (
            <button
              key={shape.id}
              className={s.shapeChoice}
              aria-label={SHAPE_LABELS[shape.id]}
              aria-pressed={look.shape === shape.id}
              onClick={() => setLook({ ...look, shape: shape.id })}
            >
              <BeamySvg
                frame={createMascotEngine({ ...look, shape: shape.id }).sample(
                  0.8,
                )}
                color={look.color}
                size={43}
              />
              <span>{SHAPE_LABELS[shape.id]}</span>
            </button>
          ))}
        </div>
      </section>
      <section className={s.appearanceSection}>
        <h3>Des yeux qui brillent</h3>
        <div className={s.eyeGrid}>
          {eyeStyles.map(({ id, label, Icon }) => (
            <button
              key={id}
              aria-pressed={look.eyes === id}
              onClick={() => setLook({ ...look, eyes: id })}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <details className={s.eyeDetails}>
          <summary>
            Ajuster les yeux <SlidersHorizontal size={12} />
          </summary>
          <div className={s.eyeControls}>
            {eyeControls.map(({ key, label }) => (
              <Range
                key={key}
                label={label}
                value={Math.round(look.eyeGeometry[key] * 100)}
                min={EYE_GEOMETRY_LIMITS[key][0] * 100}
                max={EYE_GEOMETRY_LIMITS[key][1] * 100}
                suffix=" %"
                onChange={(value) =>
                  setLook({
                    ...look,
                    eyeGeometry: { ...look.eyeGeometry, [key]: value / 100 },
                  })
                }
              />
            ))}
            <Button
              variant="ghost"
              size="xs"
              onClick={() =>
                setLook({ ...look, eyeGeometry: { ...DEFAULT_EYE_GEOMETRY } })
              }
            >
              <RotateCcw />
              Réinitialiser les yeux
            </Button>
          </div>
        </details>
      </section>
      <section className={s.appearanceSection}>
        <h3>
          Une touche de couleur <span>{look.color.toUpperCase()}</span>
        </h3>
        <div className={s.palette}>
          {PALETTE.map((color) => (
            <button
              key={color}
              style={{ background: color }}
              aria-label={`Couleur ${color}`}
              aria-pressed={look.color.toLowerCase() === color}
              onClick={() => setLook({ ...look, color })}
            />
          ))}
        </div>
        <ColorInput
          color={look.color}
          onChange={(color) => setLook({ ...look, color })}
        />
      </section>
      <section className={s.appearanceSection}>
        <h3>
          <label htmlFor="expression">Humeur au repos</label>
        </h3>
        <select
          id="expression"
          className={s.select}
          value={look.expression}
          onChange={(event) => {
            setLook({
              ...look,
              expression: event.currentTarget.value as ExpressionId,
            });
            player.choose("idle");
          }}
        >
          {EXPRESSIONS.map(({ id }) => (
            <option key={id} value={id}>
              {EXPRESSION_LABELS[id]}
            </option>
          ))}
        </select>
      </section>
      <div className={s.blushRow}>
        <span>Petites joues rosées</span>
        <Switch
          label="Petites joues rosées"
          checked={look.blush}
          onCheckedChange={(blush) => setLook({ ...look, blush })}
        />
      </div>
      <p className={s.appearanceNote}>
        Une bulle, deux étoiles,
        <br />
        et un peu de personnalité.
      </p>
    </aside>
  );
}
