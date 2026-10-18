import { useTranslation } from "react-i18next";
import { useState, type RefObject } from "react";
import { useAtomValue, useStore } from "jotai";
import { ArrowDown, RotateCcw } from "lucide-react";
import {
  boardAtom,
  presetAtom,
  stateAtom,
  statusAtom,
  viewAtom,
} from "../state/lab";
import { defaultPreset } from "../mascot/mascot-storage";
import {
  downloadBlob,
  mascotPng,
  serializeMascot,
} from "../mascot/mascot-export";
import { usePlayer } from "../mascot/PlayerProvider";
import { VideoExport } from "./VideoExport";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverTitle,
} from "./ui/popover";
import s from "../styles/workspace.module.css";

export function WorkspaceActions({
  svgRef,
  compact = false,
}: {
  svgRef: RefObject<SVGSVGElement | null>;
  compact?: boolean;
}) {
  const { t } = useTranslation();

  const store = useStore();
  const player = usePlayer();
  const [exporting, setExporting] = useState(false);
  const board = useAtomValue(boardAtom);
  const view = useAtomValue(viewAtom);
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
    }
    setExporting(false);
  };
  if (compact)
    return (
      <div className={s.mobileExport}>
        <Popover>
          <PopoverTrigger
            render={<Button size="sm" />}
            aria-label={t("Exporter")}
          >
            <ArrowDown aria-hidden="true" />
            Export
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={10}
            className="w-48 bg-popover/95 backdrop-blur-xl"
          >
            <PopoverTitle>{t("Exporter")}</PopoverTitle>
            <Button
              variant="outline"
              disabled={board || exporting}
              aria-label={t("Exporter en SVG")}
              onClick={() => void exportImage("svg")}
            >
              <ArrowDown /> SVG
            </Button>
            <Button
              disabled={board || exporting}
              aria-label={t("Exporter en PNG")}
              onClick={() => void exportImage("png")}
            >
              <ArrowDown /> PNG
            </Button>
            {view === "motion" && <VideoExport />}
          </PopoverContent>
        </Popover>
      </div>
    );
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
