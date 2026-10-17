import { useId } from "react";
import styles from "./controls.module.css";

export function Range({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = "",
  showLabel = true,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  showLabel?: boolean;
}) {
  const id = useId();
  return (
    <div className={styles.range}>
      {showLabel && (
        <label className={styles.rangeLabel} htmlFor={id}>
          {label}
          <output htmlFor={id}>
            {Number(value.toFixed(2))}
            {suffix}
          </output>
        </label>
      )}
      <input
        id={id}
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
      />
    </div>
  );
}
