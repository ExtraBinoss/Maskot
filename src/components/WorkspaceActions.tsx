import { useTranslation } from "react-i18next";
import { useState, type RefObject } from "react";
import { useAtomValue, useStore } from "jotai";
import { ArrowDown, RotateCcw } from "lucide-react";
import { boardAtom, presetAtom, stateAtom, statusAtom } from "../state/lab";
import { defaultPreset } from "../mascot/mascot-storage";
import {
  downloadBlob,
  mascotPng,
  serializeMascot,
} from "../mascot/mascot-export";
import { usePlayer } from "../mascot/PlayerProvider";
import { Button } from "./ui/button";
import s from "../styles/workspace.module.css";

export function WorkspaceActions({
  svgRef,
}: {
  svgRef: RefObject<SVGSVGElement | null>;
}) {
  const { t } = useTranslation();

  const store = useStore();
  const player = usePlayer();
  const [exporting, setExporting] = useState(false);
  const board = useAtomValue(boardAtom);
  const exportImage = async (format: "svg" | "png") => {
    if (!svgRef.current) return;
    setExporting(true);
    try {
      const text = serializeMascot(svgRef.current);
      downloadBlob(
        format === "svg"
          ? new Blob([text], { type: "image/svg+xml" })
          : await mascotPng(text),
        "maskot-" + store.get(stateAtom) + "." + format,
      );
      store.set(statusAtom, {
        key: "{{format}} exporté avec un fond transparent.",
        values: { format: format.toUpperCase() },
      });
    } catch (error) {
      store.set(
        statusAtom,
        error instanceof Error ? error.message : "L’export a échoué.",
      );
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className={s.panelActions}>
      <div className={s.fileActions}>
        <Button
          variant="ghost"
          size="sm"
          title={t("Repartir de zéro")}
          aria-label={t("Repartir de zéro")}
          onClick={() => {
            store.set(presetAtom, defaultPreset());
            player.choose("idle");
            store.set(statusAtom, "Le petit look de départ est de retour.");
          }}
        >
          <RotateCcw size={13} />
          {t("Réinitialiser")}
        </Button>
      </div>
      <div className={s.exportActions}>
        <Button
          variant="outline"
          disabled={board || exporting}
          aria-label={t("Exporter en SVG")}
          onClick={() => void exportImage("svg")}
        >
          <ArrowDown />
          SVG
        </Button>
        <Button
          disabled={board || exporting}
          aria-label={t("Exporter en PNG")}
          onClick={() => void exportImage("png")}
        >
          <ArrowDown />
          PNG
        </Button>
      </div>
    </div>
  );
}
