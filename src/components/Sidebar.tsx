import { useState } from "react";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { m } from "motion/react";
import { Clapperboard, Info, Palette } from "lucide-react";
import { viewAtom } from "../state/lab";
import s from "../styles/workspace.module.css";

export function Sidebar() {
  const { t } = useTranslation();
  const [view, setView] = useAtom(viewAtom);
  const [expanded, setExpanded] = useState(false);
  return (
    <m.nav
      className={`${s.glass} ${s.sidebar}`}
      aria-label={t("Navigation Maskot")}
      data-expanded={expanded}
      initial={false}
      animate={{ width: expanded ? 156 : 54 }}
      transition={{ type: "spring", stiffness: 460, damping: 36, mass: 0.7 }}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") setExpanded(true);
      }}
      onPointerLeave={() => setExpanded(false)}
      onFocusCapture={() => setExpanded(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setExpanded(false);
      }}
    >
      {(
        [
          { id: "static", label: "Static", Icon: Palette },
          { id: "motion", label: "Motion", Icon: Clapperboard },
          { id: "about", label: "About", Icon: Info },
        ] as const
      ).map(({ id, label, Icon }) => (
        <m.button
          key={id}
          aria-label={t(label)}
          aria-current={view === id ? "page" : undefined}
          onClick={() => setView(id)}
          whileTap={{ scale: 0.97 }}
        >
          <span className={s.navIcon}>
            <Icon size={19} aria-hidden />
          </span>
          <m.span
            className={s.navLabel}
            aria-hidden
            initial={false}
            animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -4 }}
            transition={{ duration: 0.15 }}
          >
            {t(label)}
          </m.span>
        </m.button>
      ))}
    </m.nav>
  );
}
