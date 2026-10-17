import { lazy, Suspense, useEffect, useRef } from "react";
import { useAtomValue, useStore } from "jotai";
import { m } from "motion/react";
import { boardAtom, playingAtom, statusAtom, viewAtom } from "../state/lab";
import { Sidebar } from "./Sidebar";
import { Canvas } from "./Canvas";
import StaticPanel from "./StaticPanel";
import { WorkspaceActions } from "./WorkspaceActions";
import s from "../styles/workspace.module.css";

const MotionPanel = lazy(() => import("./MotionPanel"));
const About = lazy(() => import("./About"));
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
    <main className={s.workspace} data-view={view}>
      <h1 className="sr-only">Maskot — A little character studio</h1>
      <a
        className={s.skipLink}
        href={view === "about" ? "#about" : "#settings"}
      >
        Aller aux réglages
      </a>
      <Canvas svgRef={svgRef} />
      <Sidebar />
      {view === "about" ? (
        <Suspense fallback={<p className={s.loading}>Un petit instant…</p>}>
          <About />
        </Suspense>
      ) : view === "motion" ? (
        <Suspense fallback={<p className={s.loading}>Un petit instant…</p>}>
          <MotionPanel svgRef={svgRef} />
        </Suspense>
      ) : (
        <aside
          className={s.inspector}
          id="settings"
          aria-label="Réglages de Maskot"
        >
          <div className={s.panelScroll} ref={panelRef}>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <StaticPanel />
            </m.div>
          </div>
          <WorkspaceActions svgRef={svgRef} />
        </aside>
      )}
      <Feedback />
    </main>
  );
}
