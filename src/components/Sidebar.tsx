import { useState } from "react";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { m, useReducedMotion } from "motion/react";
import { Clapperboard, Info, Palette } from "lucide-react";
import { viewAtom } from "../state/lab";
import s from "../styles/workspace.module.css";

export function Sidebar() {
  const { t } = useTranslation();
  const [view, setView] = useAtom(viewAtom);
  const [expanded, setExpanded] = useState(false);
  const reduced = useReducedMotion();
  return (
    <m.nav
      className={`${s.glass} ${s.sidebar}`}
      aria-label={t("Navigation Maskot")}
      data-expanded={expanded}
      initial={false}
      layout="size"
      style={{ width: expanded ? 156 : 54, y: "-50%", originX: 0 }}
      transition={{ duration: reduced ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
      onPointerEnter={(event) => {
        if (
          event.pointerType !== "touch" &&
          matchMedia("(min-width: 761px)").matches
        )
          setExpanded(true);
      }}
      onPointerLeave={() => setExpanded(false)}
      onFocusCapture={() => {
        if (matchMedia("(min-width: 761px)").matches) setExpanded(true);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setExpanded(false);
      }}
    >
      <m.span
        className={s.navIndicator}
        aria-hidden
        initial={false}
        animate={{
          "--nav-position": ["static", "motion", "about"].indexOf(view),
        }}
        transition={
          reduced
            ? { duration: 0 }
            : { type: "spring", stiffness: 400, damping: 32 }
        }
      />
      {(
        [
          { id: "static", label: "Static", Icon: Palette },
          { id: "motion", label: "Motion", Icon: Clapperboard },
          { id: "about", label: "About", Icon: Info },
        ] as const
      ).map(({ id, label, Icon }) => (
        <m.button
          key={id}
          layout="position"
          aria-label={t(label)}
          aria-current={view === id ? "page" : undefined}
          onTap={(event) => {
            if ("pointerType" in event && event.pointerType === "touch")
              setView(id);
          }}
          onClick={() => setView(id)}
          whileTap={{ scale: 0.97 }}
        >
          <span className={s.navIcon}>
            <Icon size={19} aria-hidden />
          </span>
          <m.span
            className={s.navLabel}
            style={{ visibility: expanded ? "visible" : "hidden" }}
            aria-hidden
            initial={false}
            animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -4 }}
            transition={{
              duration: reduced ? 0 : expanded ? 0.14 : 0.07,
              delay: expanded && !reduced ? 0.065 : 0,
            }}
          >
            {t(label)}
          </m.span>
        </m.button>
      ))}
    </m.nav>
  );
}
