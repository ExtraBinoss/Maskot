import { useAtom } from "jotai";
import { Aperture, ArrowUpRight, Circle, Info, Waves } from "lucide-react";
import { viewAtom } from "../state/lab";
import { ThemePicker } from "./ThemePicker";
import s from "../styles/workspace.module.css";

export function Sidebar() {
  const [view, setView] = useAtom(viewAtom);
  return (
    <aside className={`${s.glass} ${s.sidebar}`} aria-label="Navigation Maskot">
      <a
        href="#static"
        className={s.wordmark}
        aria-label="Maskot, atelier"
        onClick={(event) => {
          event.preventDefault();
          setView("static");
        }}
      >
        <Aperture size={22} strokeWidth={1.8} />
        <span>
          maskot<span className={s.brandDot}>.</span>
        </span>
      </a>
      <nav className={s.navigation} aria-label="Espace de travail">
        {(
          [
            { id: "static", label: "Static", Icon: Circle },
            { id: "motion", label: "Motion", Icon: Waves },
            { id: "about", label: "About", Icon: Info },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            aria-current={view === id ? "page" : undefined}
            onClick={() => setView(id)}
          >
            <Icon size={17} />
            <span>{label}</span>
            <i />
          </button>
        ))}
      </nav>
      <div className={s.sidebarBottom}>
        <span className={s.sidebarNote}>
          A little character.
          <br />A lot of personality.
        </span>
        <ThemePicker />
        <a
          className={s.plinkaLink}
          href="https://plinka.eu"
          target="_blank"
          rel="noreferrer"
        >
          Un petit outil Plinka
          <ArrowUpRight size={12} />
        </a>
      </div>
    </aside>
  );
}
