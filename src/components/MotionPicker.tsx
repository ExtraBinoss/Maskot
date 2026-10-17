import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { MOTION_GROUPS } from "../mascot/mascot-catalog";
import type { MascotLook } from "../mascot/mascot-types";
import type { MotionId } from "../mascot/motion-types";
import { MotionPreview } from "./MotionPreview";
import { useVisiblePreview } from "./useVisiblePreview";
import { Button } from "./ui/button";
import s from "../styles/motion-picker.module.css";

function Choice({
  id,
  label,
  look,
  selected,
  onSelect,
}: {
  id: MotionId;
  label: string;
  look: MascotLook;
  selected?: MotionId;
  onSelect: (id: MotionId) => void;
}) {
  const { t } = useTranslation();
  const { ref, visible } = useVisiblePreview<HTMLButtonElement>();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <Button
      ref={ref}
      variant="ghost"
      className={s.choice}
      aria-label={t(label)}
      aria-pressed={selected === undefined ? undefined : selected === id}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onClick={() => onSelect(id)}
    >
      <span className={s.preview}>
        {visible && (
          <MotionPreview
            look={look}
            state={id}
            size={68}
            active={hovered || focused}
          />
        )}
      </span>
      <span className={s.label}>{t(label)}</span>
    </Button>
  );
}

export function MotionPicker({
  look,
  selected,
  onSelect,
}: {
  look: MascotLook;
  selected?: MotionId;
  onSelect: (id: MotionId) => void;
}) {
  const { t } = useTranslation();
  const prefix = useId();
  return (
    <div className={s.catalog}>
      {MOTION_GROUPS.map(({ label, items }, index) => (
        <section key={label} aria-labelledby={`${prefix}-${index}`}>
          <h3 id={`${prefix}-${index}`}>{t(label)}</h3>
          <div className={s.grid}>
            {items.map(({ id, label }) => (
              <Choice
                key={id}
                id={id}
                label={label}
                look={look}
                selected={selected}
                onSelect={onSelect}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
