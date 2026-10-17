import { useTranslation } from "react-i18next";
import { useId, useState } from "react";
import { useAtom, useSetAtom, useStore } from "jotai";
import { m } from "motion/react";
import { Plus } from "lucide-react";
import {
  commitColorAtom,
  lookAtom,
  previewColorAtom,
  statusAtom,
} from "../state/lab";
import { customColorsAtom } from "../state/palette";
import { PALETTE } from "../mascot/mascot-catalog";
import { normalizeHex } from "../lib/color";
import ColorPickerEditor from "./ColorPickerEditor";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "./ui/popover";
import s from "../styles/settings.module.css";

export function ColorControl() {
  const { t } = useTranslation();

  const [look, setLook] = useAtom(lookAtom);
  const [customColors, addColor] = useAtom(customColorsAtom);
  const setStatus = useSetAtom(statusAtom);
  const store = useStore();
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
        {t("Couleur")}
        <input
          className={s.colorInput}
          aria-label={t("Couleur personnalisée au format hexadécimal")}
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
        <Popover
          open={open}
          onOpenChange={(next) => {
            if (!next) {
              const color = store.get(previewColorAtom);
              if (color) store.set(commitColorAtom, color);
            }
            setOpen(next);
          }}
        >
          <PopoverTrigger
            render={
              <button
                className={s.pickerTrigger}
                aria-label={t("Choisir une couleur personnalisée")}
              >
                <Plus size={12} />
              </button>
            }
          />
          <PopoverContent
            align="start"
            sideOffset={10}
            className={s.colorPopover}
          >
            <PopoverTitle className={s.pickerTitle}>
              {t("Couleur")}
            </PopoverTitle>
            <ColorPickerEditor
              value={look.color}
              onAdd={(color) => {
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
            aria-label={t("Couleur {{color}}", { color })}
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
          {t("Utilise une couleur comme #FF5A1F.")}
        </p>
      )}
    </section>
  );
}
