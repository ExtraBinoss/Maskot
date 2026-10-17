import { lazy, Suspense, useEffect, useRef } from "react";
import { useAtomValue, useStore } from "jotai";
import { m } from "motion/react";
import { boardAtom, playingAtom, statusAtom, viewAtom } from "../state/lab";
import { Sidebar } from "./Sidebar";
import { Canvas } from "./Canvas";
import StaticPanel from "./StaticPanel";
import { ThemePicker } from "./ThemePicker";
import { WorkspaceActions } from "./WorkspaceActions";
import s from "../styles/workspace.module.css";

const MotionPanel = lazy(() => import("./MotionPanel"));
const About = lazy(() => import("./About"));
const titles = {
  static: {
    title: "Le petit look",
    description: "Tout commence par un caractère.",
  },
  motion: {
    title: "Un peu de vie",
    description: "De petits gestes, de grandes émotions.",
  },
  about: {
    title: "Meet Maskot",
    description: "Un petit terrain d’expression.",
  },
};

function Feedback() {
  const status = useAtomValue(statusAtom);
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
      aria-label="Messages de l’atelier"
      aria-live="polite"
      aria-atomic="true"
    >
      {status}
    </p>
  );
}

export function Workspace() {
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
    <main className={s.workspace}>
      <a className={s.skipLink} href="#settings">
        Aller aux réglages
      </a>
      <Canvas svgRef={svgRef} />
      <Sidebar />
      <aside
        className={s.inspector + " " + s.glass}
        id="settings"
        aria-label="Réglages de Maskot"
      >
        <header className={s.panelHeader}>
          <div>
            <h2>{titles[view].title}</h2>
            <p>{titles[view].description}</p>
          </div>
          <div className={s.mobileTheme}>
            <ThemePicker />
          </div>
        </header>
        <div className={s.panelScroll} ref={panelRef}>
          <Suspense fallback={<p className={s.loading}>Un petit instant…</p>}>
            <m.div
              key={view}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.16 }}
            >
              {view === "static" ? (
                <StaticPanel />
              ) : view === "motion" ? (
                <MotionPanel />
              ) : (
                <About />
              )}
            </m.div>
          </Suspense>
        </div>
        {view !== "about" && <WorkspaceActions svgRef={svgRef} />}
      </aside>
      <Feedback />
    </main>
  );
}
