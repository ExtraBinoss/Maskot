import { useId, useRef, useState, type PointerEvent } from "react";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { m } from "motion/react";
import { Plus } from "lucide-react";
import { hexToHsv, hsvToHex, normalizeHex, type Hsv } from "../../lib/color";
import { Input } from "./input";
import { Label } from "./label";
import { Button } from "./button";
import s from "./color-picker.module.css";

export function ColorPicker({
  value,
  onChange,
  onAdd,
}: {
  value: string;
  onChange: (color: string) => void;
  onAdd: (color: string) => void;
}) {
  const id = useId();
  const [selection, setSelection] = useState({
    source: value,
    hsv: hexToHsv(value),
  });
  const [draft, setDraft] = useState({ source: value, text: value });
  const hsv = selection.source === value ? selection.hsv : hexToHsv(value);
  const text = draft.source === value ? draft.text : value;
  const color = normalizeHex(text);
  const plane = useRef<DOMRect | null>(null);
  const update = (next: Hsv) => {
    const hex = hsvToHex(next);
    setSelection({ source: hex, hsv: next });
    setDraft({ source: hex, text: hex });
    onChange(hex);
  };
  const point = (event: PointerEvent<HTMLDivElement>) => {
    const rect = plane.current;
    if (!rect) return;
    update({
      ...hsv,
      s: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      v: 1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    });
  };
  const add = () => {
    if (color) onAdd(color);
  };
  return (
    <m.div
      className={s.picker}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div
        className={s.plane}
        style={{ backgroundColor: `hsl(${hsv.h} 100% 50%)` }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          plane.current = event.currentTarget.getBoundingClientRect();
          event.currentTarget.setPointerCapture(event.pointerId);
          point(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            point(event);
        }}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId);
          plane.current = null;
        }}
        onPointerCancel={() => {
          plane.current = null;
        }}
      >
        <span
          className={s.cursor}
          style={{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            background: value,
          }}
        />
        <input
          className="sr-only"
          type="range"
          aria-label="Saturation"
          min={0}
          max={100}
          step={1}
          value={Math.round(hsv.s * 100)}
          onChange={(event) =>
            update({ ...hsv, s: event.currentTarget.valueAsNumber / 100 })
          }
        />
        <input
          className="sr-only"
          type="range"
          aria-label="Luminosité"
          min={0}
          max={100}
          step={1}
          value={Math.round(hsv.v * 100)}
          onChange={(event) =>
            update({ ...hsv, v: event.currentTarget.valueAsNumber / 100 })
          }
        />
      </div>
      <SliderPrimitive.Root
        value={hsv.h}
        min={0}
        max={360}
        step={1}
        onValueChange={(h) => update({ ...hsv, h })}
      >
        <SliderPrimitive.Control className={s.hueControl}>
          <SliderPrimitive.Track className={s.hueTrack} />
          <SliderPrimitive.Thumb
            className={s.hueThumb}
            getAriaLabel={() => "Teinte"}
          />
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
      <div className={s.colorRow}>
        <span className={s.sample} style={{ background: value }} />
        <Label htmlFor={id} className="sr-only">
          Code hexadécimal
        </Label>
        <Input
          id={id}
          className={s.hex}
          value={text}
          maxLength={7}
          spellCheck={false}
          aria-invalid={!color}
          aria-describedby={!color ? `${id}-error` : undefined}
          onChange={(event) => {
            const next = event.currentTarget.value;
            const hex = normalizeHex(next);
            setDraft({ source: hex ?? value, text: next });
            if (hex) onChange(hex);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") add();
          }}
        />
        <Button
          className={s.add}
          size="sm"
          disabled={!color}
          onClick={add}
          aria-label="Ajouter cette couleur à la palette"
          render={<m.button whileTap={{ scale: 0.94 }} />}
        >
          <Plus size={14} /> Add
        </Button>
      </div>
      {!color && (
        <p className={s.error} id={`${id}-error`}>
          Six chiffres, comme #2563EB.
        </p>
      )}
    </m.div>
  );
}
