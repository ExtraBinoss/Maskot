import { useTranslation } from "react-i18next";
import { useEffect, useRef } from "react";
import { useAtomValue, useStore } from "jotai";
import { m } from "motion/react";
import { ResponsiveInspector } from "./ResponsiveInspector";
import {
  boardAtom,
  playingAtom,
  statusAtom,
  viewAtom,
  undoTimelineAtom,
  redoTimelineAtom,
} from "../state/lab";
import { RandomizeButton } from "./RandomizeButton";
import { Sidebar } from "./Sidebar";
import { Canvas } from "./Canvas";
import StaticPanel from "./StaticPanel";
import MotionPanel from "./MotionPanel";
import About from "./About";
import { WorkspaceActions } from "./WorkspaceActions";
import s from "../styles/workspace.module.css";

function Feedback() {
  const { t } = useTranslation();

  const status = useAtomValue(statusAtom);
  const invalidField =
    typeof status === "string"
      ? status.match(/^Réglage des yeux invalide : (\w+)\.$/)?.[1]
      : undefined;
  const store = useStore();
  useEffect(() => {
    if (!status) return;
    const timeout = setTimeout(() => {
      if (store.get(statusAtom) === status) store.set(statusAtom, "");
    }, 6500);
    return () => clearTimeout(timeout);
  }, [status, store]);
  return (
    <p
      className={s.toast}
      data-active={!!status}
      role="status"
      aria-label={t("Messages de l’atelier")}
      aria-live="polite"
      aria-atomic="true"
    >
      {invalidField
        ? t("Réglage des yeux invalide : {{field}}.", { field: invalidField })
        : typeof status === "string"
          ? t(status)
          : t(status.key, status.values)}
    </p>
  );
}

export function Workspace() {
  const { t } = useTranslation();

  const view = useAtomValue(viewAtom);
  const store = useStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0;
  }, [view]);
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (
        store.get(viewAtom) === "motion" &&
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        !event.defaultPrevented &&
        !event.repeat &&
        !(
          event.target instanceof Element &&
          event.target.closest(
            'input, textarea, [contenteditable]:not([contenteditable="false"])',
          )
        )
      ) {
        const key = event.key.toLowerCase();
        if (key === "z" || (key === "y" && !event.shiftKey)) {
          event.preventDefault();
          store.set(
            key === "y" || event.shiftKey ? redoTimelineAtom : undoTimelineAtom,
          );
          return;
        }
      }
      if (
        event.code !== "Space" ||
        event.defaultPrevented ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        store.get(boardAtom) ||
        store.get(viewAtom) !== "motion"
      )
        return;
      if (
        event.target instanceof Element &&
        event.target.closest(
          'button, a, input, select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [role="switch"], [role="slider"], [role="combobox"], [role="listbox"], [role="textbox"]',
        )
      )
        return;
      event.preventDefault();
      store.set(playingAtom, !store.get(playingAtom));
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [store]);
  return (
    <main className={s.workspace} data-view={view}>
      <h1 className="sr-only">{t("Maskot — A little character studio")}</h1>
      <p className="sr-only">
        {t(
          "Crée une mascotte inspirée du Grok bot. Formes, yeux, humeurs et mouvements. Un outil libre par Plinka.",
        )}
      </p>
      <a
        className={s.skipLink}
        href={view === "about" ? "#about" : "#settings"}
      >
        {t("Aller aux réglages")}
      </a>
      {view !== "about" && <Canvas svgRef={svgRef} />}
      <Sidebar />
      <RandomizeButton />
      {view !== "about" && <WorkspaceActions svgRef={svgRef} compact />}
      {view === "about" ? (
        <About>
          <Canvas svgRef={svgRef} />
        </About>
      ) : view === "motion" ? (
        <MotionPanel svgRef={svgRef} />
      ) : (
        <ResponsiveInspector
          triggerLabel={t("Réglages")}
          title={t("Réglages de Maskot")}
          closeLabel={t("Fermer les réglages")}
        >
          <aside
            data-inspector=""
            className={s.inspector}
            id="settings"
            aria-label={t("Réglages de Maskot")}
          >
            <div className={s.panelScroll} ref={panelRef}>
              <m.div
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <StaticPanel />
              </m.div>
            </div>
            <WorkspaceActions svgRef={svgRef} />
          </aside>
        </ResponsiveInspector>
      )}
      <Feedback />
    </main>
  );
}
