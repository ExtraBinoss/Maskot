import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { useStore } from "jotai";
import { ArrowDownToLine, X } from "lucide-react";
import { playingAtom, presetAtom, statusAtom } from "../state/lab";
import { downloadBlob } from "../mascot/mascot-export";
import { timelineDuration } from "../mascot/mascot-catalog";
import s from "../styles/motion.module.css";

export function VideoExport() {
  const { t, i18n } = useTranslation();

  const store = useStore();
  const dialog = useRef<HTMLDialogElement>(null);
  const controller = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [background, setBackground] = useState("#f9f9f9");
  useEffect(() => () => controller.current?.abort(), []);
  const close = () => {
    if (controller.current) controller.current.abort();
    else dialog.current?.close();
  };
  const exportVideo = async () => {
    if (controller.current) return;
    const control = new AbortController();
    controller.current = control;
    const preset = structuredClone(store.get(presetAtom));
    store.set(playingAtom, false);
    setError("");
    setProgress(0);
    try {
      const { mascotWebm } = await import("../mascot/mascot-video");
      const blob = await mascotWebm(
        preset,
        background,
        control.signal,
        setProgress,
      );
      control.signal.throwIfAborted();
      downloadBlob(blob, "maskot-montage.webm");
      store.set(
        statusAtom,
        "Montage WebM exporté en 1024 × 1024 à 30 images/s.",
      );
      dialog.current?.close();
    } catch (error) {
      if (control.signal.aborted) dialog.current?.close();
      else
        setError(
          error instanceof Error ? error.message : "L’export vidéo a échoué.",
        );
    } finally {
      controller.current = null;
      setProgress(null);
    }
  };
  return (
    <>
      <button
        className={s.exportVideo}
        onClick={() => {
          setError("");
          dialog.current?.showModal();
        }}
      >
        <ArrowDownToLine size={15} />
        {t("Exporter le montage")}
      </button>
      <dialog
        ref={dialog}
        className={s.exportDialog}
        aria-labelledby="video-title"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
      >
        <header>
          <h2 id="video-title">{t("Emporte le mouvement.")}</h2>
          <button aria-label={t("Fermer l’export vidéo")} onClick={close}>
            <X size={18} />
          </button>
        </header>
        <p>
          {t("WebM · 1024 × 1024 · 30 images/s")}
          <br />
          {timelineDuration(store.get(presetAtom).timeline).toLocaleString(
            i18n.resolvedLanguage,
            { minimumFractionDigits: 1, maximumFractionDigits: 1 },
          )}{" "}
          {t("secondes, du début à la fin du montage.")}
        </p>
        <fieldset disabled={progress !== null}>
          <legend>{t("Fond de la vidéo")}</legend>
          {[
            { value: "#f9f9f9", label: t("Clair") },
            { value: "#1c1c20", label: t("Sombre") },
          ].map((option) => (
            <label key={option.value}>
              <input
                type="radio"
                name="video-background"
                checked={background === option.value}
                onChange={() => setBackground(option.value)}
              />
              <span style={{ background: option.value }} />
              {option.label}
            </label>
          ))}
        </fieldset>
        {error && (
          <p role="alert" className={s.exportError}>
            {t(error)}
          </p>
        )}
        {progress !== null ? (
          <>
            <progress
              aria-label={t("Progression de l’export vidéo")}
              max={1}
              value={progress}
            />
            <div className={s.progressRow}>
              <span>
                {t("Création de la vidéo…")}
                {Math.round(progress * 100)} %
              </span>
              <button onClick={close}>{t("Annuler")}</button>
            </div>
          </>
        ) : (
          <button
            className={s.exportConfirm}
            onClick={() => void exportVideo()}
          >
            <ArrowDownToLine size={16} />
            {t("Exporter en WebM")}
          </button>
        )}
      </dialog>
    </>
  );
}
