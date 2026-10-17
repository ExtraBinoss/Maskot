import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { m } from "motion/react";
import { Plus } from "lucide-react";
import { commitColorAtom, previewColorAtom } from "../state/lab";
import { normalizeHex } from "../lib/color";
import {
  ColorPicker,
  ColorPickerPanel,
  useColorPicker,
} from "./ui/color-picker";
import { Button } from "./ui/button";

function AddColor({ onAdd }: { onAdd: (color: string) => void }) {
  const { value } = useColorPicker();
  const hex = value ? normalizeHex(value) : null;
  return (
    <Button
      className="mt-3 w-full rounded-lg"
      size="sm"
      disabled={!hex}
      aria-label="Ajouter cette couleur à la palette"
      onClick={() => {
        if (hex) onAdd(hex);
      }}
      render={<m.button whileTap={{ scale: 0.98 }} />}
    >
      <Plus size={14} /> Add
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
  const preview = useSetAtom(previewColorAtom);
  const commit = useSetAtom(commitColorAtom);
  useEffect(() => () => preview(null), [preview]);
  return (
    <m.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16 }}
    >
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
          labels: {
            area: "Couleur",
            hue: "Teinte",
            saturation: "Saturation",
            brightness: "Luminosité",
            lightness: "Clarté",
            chroma: "Chroma",
            red: "Rouge",
            green: "Vert",
            blue: "Bleu",
            hex: "Code hexadécimal",
            format: "Format de couleur",
            eyeDropper: "Prélever une couleur à l’écran",
            copy: "Copier la couleur",
            copied: "Couleur copiée",
            panelLabel: "Sélecteur de couleur",
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
    </m.div>
  );
}
