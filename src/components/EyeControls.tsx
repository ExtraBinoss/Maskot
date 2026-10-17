import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom, useStore } from "jotai";
import { RotateCcw } from "lucide-react";
import {
  commitEyeGeometryAtom,
  lookAtom,
  previewEyeGeometryAtom,
} from "../state/lab";
import {
  DEFAULT_EYE_GEOMETRY,
  EYE_GEOMETRY_LIMITS,
} from "../mascot/engine/eye-geometry";
import type { EyeGeometry } from "../mascot/engine/bot-types";
import { Range } from "./ui/range";
import { Button } from "./ui/button";

const controls: { key: keyof EyeGeometry; label: string }[] = [
  { key: "size", label: "Taille des yeux" },
  { key: "width", label: "Largeur des yeux" },
  { key: "height", label: "Hauteur des yeux" },
  { key: "spacing", label: "Écartement des yeux" },
  { key: "offsetY", label: "Position verticale" },
];

export function EyeControls() {
  const { t } = useTranslation();
  const look = useAtomValue(lookAtom);
  const [preview, setPreview] = useAtom(previewEyeGeometryAtom);
  const commit = useSetAtom(commitEyeGeometryAtom);
  const store = useStore();
  useEffect(
    () => () => {
      const pending = store.get(previewEyeGeometryAtom);
      if (pending) store.set(commitEyeGeometryAtom, pending);
    },
    [store],
  );
  const geometry = preview ?? look.eyeGeometry;
  const update = (key: keyof EyeGeometry, value: number) => ({
    ...(store.get(previewEyeGeometryAtom) ?? store.get(lookAtom).eyeGeometry),
    [key]: value / 100,
  });
  return (
    <>
      {controls.map(({ key, label }) => (
        <Range
          key={key}
          label={t(label)}
          suffix=" %"
          defaultValue={DEFAULT_EYE_GEOMETRY[key] * 100}
          value={Math.round(geometry[key] * 100)}
          min={EYE_GEOMETRY_LIMITS[key][0] * 100}
          max={EYE_GEOMETRY_LIMITS[key][1] * 100}
          onChange={(value) => setPreview(update(key, value))}
          onChangeEnd={(value) => commit(update(key, value))}
        />
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        onClick={() => commit({ ...DEFAULT_EYE_GEOMETRY })}
      >
        <RotateCcw />
        {t("Réinitialiser les yeux")}
      </Button>
    </>
  );
}
