import { useTranslation } from "react-i18next";
import { useId, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Slider } from "./slider";
import { Input } from "./input";
import { Label } from "./label";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import styles from "./controls.module.css";

export function Range({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = "",
  defaultValue,
  showLabel = true,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  defaultValue?: number;
  showLabel?: boolean;
}) {
  const { t } = useTranslation();

  const id = useId();
  const [draft, setDraft] = useState({ source: value, text: String(value) });
  const text = draft.source === value ? draft.text : String(value);
  const commit = () => {
    const parsed = Number(text.trim().replace(",", "."));
    const next =
      text.trim() && Number.isFinite(parsed)
        ? Math.min(
            max,
            Math.max(min, min + Math.round((parsed - min) / step) * step),
          )
        : value;
    const rounded = Number(next.toFixed(8));
    setDraft({ source: rounded, text: String(rounded) });
    onChange(rounded);
  };
  return (
    <div className={styles.range}>
      {showLabel && (
        <div className={styles.rangeHeader}>
          <Label className={styles.rangeLabel} htmlFor={id}>
            {label}
          </Label>
          <div className={styles.rangeActions}>
            {defaultValue !== undefined && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={t("Réinitialiser {{label}}", {
                        label: label.toLocaleLowerCase(),
                      })}
                      className={styles.rangeReset}
                      onClick={() => {
                        setDraft({
                          source: defaultValue,
                          text: String(defaultValue),
                        });
                        onChange(defaultValue);
                      }}
                    >
                      <RotateCcw size={13} />
                    </Button>
                  }
                />
                <TooltipContent>
                  {t("Valeur par défaut :")} {defaultValue}
                  {suffix}
                </TooltipContent>
              </Tooltip>
            )}
            <div className={styles.rangeInputWrap}>
              <Input
                id={id}
                className={styles.rangeInput}
                type="text"
                inputMode="decimal"
                aria-label={t("Valeur — {{label}}", { label })}
                value={text}
                onChange={(event) =>
                  setDraft({ source: value, text: event.currentTarget.value })
                }
                onBlur={commit}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commit();
                    event.currentTarget.blur();
                  }
                  if (event.key === "Escape") {
                    setDraft({ source: value, text: String(value) });
                    event.preventDefault();
                  }
                }}
              />
              {suffix && <span aria-hidden="true">{suffix.trim()}</span>}
            </div>
          </div>
        </div>
      )}
      <Slider
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={(next) => onChange(next as number)}
        showTooltip
        tooltipContent={(next) => `${Number(next.toFixed(2))}${suffix}`}
      />
    </div>
  );
}
