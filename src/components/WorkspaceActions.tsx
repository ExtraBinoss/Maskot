import { useTranslation } from "react-i18next";
import { useRef, useState, type RefObject } from "react";
import { useAtomValue, useStore } from "jotai";
import { ArrowDown, Download, RotateCcw, Upload } from "lucide-react";
import {
  boardAtom,
  presetAtom,
  stateAtom,
  statusAtom,
  viewAtom,
} from "../state/lab";
import { defaultPreset, parsePreset } from "../mascot/mascot-storage";
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
  const file = useRef<HTMLInputElement>(null);
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
  const exportPreset = () => {
    try {
      downloadBlob(
        new Blob([JSON.stringify(store.get(presetAtom), null, 2)], {
          type: "application/json",
        }),
        "maskot-look.json",
      );
      store.set(statusAtom, "Look et chorégraphie exportés.");
    } catch {
      store.set(
        statusAtom,
        "Impossible d’exporter le look dans ce navigateur.",
      );
    }
  };
  const importPreset = async (input: HTMLInputElement) => {
    const selected = input.files?.[0];
    if (!selected) return;
    try {
      if (selected.size > 65536)
        throw new Error(
          "Ce fichier est trop volumineux pour un réglage de mascotte (64 Ko maximum).",
        );
      store.set(presetAtom, parsePreset(await selected.text()));
      store.set(viewAtom, "static");
      player.choose("idle");
      store.set(statusAtom, "Look et chorégraphie importés.");
    } catch (error) {
      store.set(
        statusAtom,
        error instanceof Error
          ? error.message
          : "Impossible de lire ce fichier.",
      );
    } finally {
      input.value = "";
    }
  };
  return (
    <div className={s.panelActions}>
      <div className={s.fileActions}>
        <button
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
        </button>
        <span />
        <button
          title={t("Importer un look")}
          aria-label={t("Importer un look")}
          onClick={() => file.current?.click()}
        >
          <Upload size={14} />
        </button>
        <button
          title={t("Exporter le look en JSON")}
          aria-label={t("Exporter le look")}
          onClick={exportPreset}
        >
          <Download size={14} />
        </button>
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
          PNG<span className={s.exportSize}>1024px</span>
        </Button>
      </div>
      <input
        ref={file}
        type="file"
        hidden
        accept=".json,application/json"
        aria-label={t("Importer un réglage de mascotte")}
        onChange={(event) => void importPreset(event.currentTarget)}
      />
    </div>
  );
}
