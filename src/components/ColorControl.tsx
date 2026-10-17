import { useId, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { m } from "motion/react";
import { Plus } from "lucide-react";
import { lookAtom, statusAtom } from "../state/lab";
import { customColorsAtom } from "../state/palette";
import { PALETTE } from "../mascot/mascot-catalog";
import { normalizeHex } from "../lib/color";
import { ColorPicker } from "./ui/color-picker";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "./ui/popover";
import s from "../styles/settings.module.css";

export function ColorControl() {
  const [look, setLook] = useAtom(lookAtom);
  const [customColors, addColor] = useAtom(customColorsAtom);
  const setStatus = useSetAtom(statusAtom);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ source: look.color, text: look.color });
  const errorId = useId();
  const value = draft.source === look.color ? draft.text : look.color;
  const valid = !!normalizeHex(value);
  const select = (color: string) => {
    setDraft({ source: color, text: color });
    setLook({ ...look, color });
  };
  return (
    <section className={s.section}>
      <h3>
        Couleur
        <input
          className={s.colorInput}
          aria-label="Couleur personnalisée au format hexadécimal"
          value={value}
          aria-invalid={!valid}
          aria-describedby={!valid ? errorId : undefined}
          maxLength={7}
          spellCheck={false}
          onChange={(event) => {
            const text = event.currentTarget.value;
            const hex = normalizeHex(text);
            setDraft({ source: hex ?? look.color, text });
            if (hex) setLook({ ...look, color: hex });
          }}
        />
      </h3>
      <div className={s.palette}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <m.button
                className={s.pickerTrigger}
                aria-label="Choisir une couleur personnalisée"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
              >
                <Plus size={12} />
              </m.button>
            }
          />
          <PopoverContent
            align="start"
            sideOffset={10}
            className={s.colorPopover}
          >
            <PopoverTitle className={s.pickerTitle}>
              Une couleur bien à toi
            </PopoverTitle>
            <ColorPicker
              value={look.color}
              onChange={select}
              onAdd={(color) => {
                select(color);
                if ([...PALETTE, ...customColors].includes(color)) {
                  setStatus("Cette couleur est déjà dans ta palette.");
                } else addColor(color);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
        {[...PALETTE, ...customColors].map((color) => (
          <m.button
            key={color}
            style={{ background: color }}
            aria-label={"Couleur " + color}
            aria-pressed={look.color.toLowerCase() === color}
            onClick={() => select(color)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            transition={{ duration: 0.16 }}
          />
        ))}
      </div>
      {!valid && (
        <p id={errorId} className={s.error}>
          Utilise une couleur comme #FF5A1F.
        </p>
      )}
    </section>
  );
}
