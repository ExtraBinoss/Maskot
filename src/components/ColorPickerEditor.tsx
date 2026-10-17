import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { m } from "motion/react";
import { Plus } from "lucide-react";
import { commitColorAtom, previewColorAtom } from "../state/lab";
import { normalizeHex } from "../lib/color";
import {
  ColorPicker,
  ColorPickerPanel,
  formatColor,
  useColorPicker,
} from "./ui/color-picker";
import { Button } from "./ui/button";

function AddColor({ onAdd }: { onAdd: (color: string) => void }) {
  const { t } = useTranslation();

  const { value } = useColorPicker();
  const hex = value ? normalizeHex(value) : null;
  return (
    <Button
      className="mt-3 w-full rounded-lg"
      size="sm"
      disabled={!hex}
      aria-label={t("Ajouter cette couleur à la palette")}
      onClick={() => {
        if (hex) onAdd(hex);
      }}
      render={<m.button whileTap={{ scale: 0.98 }} />}
    >
      <Plus size={14} /> {t("Add")}
    </Button>
  );
}

export default function ColorPickerEditor({
  value,
  onAdd,
}: {
  value: string;
  onAdd: (color: string) => void;
}) {
  const { t } = useTranslation();

  const preview = useSetAtom(previewColorAtom);
  const commit = useSetAtom(commitColorAtom);
  useEffect(() => () => preview(null), [preview]);
  return (
    <div>
      <ColorPicker
        defaultValue={value}
        format="hex"
        alpha={false}
        onValueChange={(value) => {
          const hex = value && normalizeHex(value);
          if (hex) preview(hex);
        }}
        onValueCommit={(value) => {
          const hex = value && normalizeHex(value);
          if (hex) commit(hex);
        }}
        i18n={{
          functions: { getColorName: (color) => formatColor(color, "hex") },
          labels: {
            area: t("Couleur"),
            hue: t("Teinte"),
            saturation: t("Saturation"),
            brightness: t("Luminosité"),
            lightness: t("Clarté"),
            chroma: t("Chroma"),
            red: t("Rouge"),
            green: t("Vert"),
            blue: t("Bleu"),
            hex: t("Code hexadécimal"),
            format: t("Format de couleur"),
            eyeDropper: t("Prélever une couleur à l’écran"),
            copy: t("Copier la couleur"),
            copied: t("Couleur copiée"),
            panelLabel: t("Sélecteur de couleur"),
          },
        }}
      >
        <ColorPickerPanel />
        <AddColor
          onAdd={(color) => {
            commit(color);
            onAdd(color);
          }}
        />
      </ColorPicker>
    </div>
  );
}
