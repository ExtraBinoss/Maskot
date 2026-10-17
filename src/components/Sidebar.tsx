import { useState } from "react";
import { useAtom } from "jotai";
import { AnimatePresence, m } from "motion/react";
import { Clapperboard, Info, Palette } from "lucide-react";
import { viewAtom } from "../state/lab";
import s from "../styles/workspace.module.css";

export function Sidebar() {
  const [view, setView] = useAtom(viewAtom);
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <nav className={`${s.glass} ${s.sidebar}`} aria-label="Navigation Maskot">
      {(
        [
          { id: "static", label: "Static", Icon: Palette },
          { id: "motion", label: "Motion", Icon: Clapperboard },
          { id: "about", label: "About", Icon: Info },
        ] as const
      ).map(({ id, label, Icon }) => (
        <m.button
          key={id}
          aria-label={label}
          aria-current={view === id ? "page" : undefined}
          onClick={() => setView(id)}
          onPointerEnter={() => setHovered(id)}
          onPointerLeave={() => setHovered(null)}
          onPointerDown={() => setHovered(null)}
          onFocus={() => setHovered(id)}
          onBlur={() => setHovered(null)}
          whileTap={{ scale: 0.93 }}
        >
          <Icon size={19} aria-hidden />
          <AnimatePresence>
            {hovered === id && (
              <m.span
                key={id}
                aria-hidden
                className={s.navTooltip}
                initial={{ opacity: 0, x: -6, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -3, scale: 0.96 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              >
                {label}
              </m.span>
            )}
          </AnimatePresence>
        </m.button>
      ))}
    </nav>
  );
}
