import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { m } from "motion/react";
import { PreferenceGroup } from "./PreferenceGroup";
import { ThemePicker } from "./ThemePicker";
import { CreditsDialog } from "./CreditsDialog";
import s from "../styles/about.module.css";

export default function About({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  return (
    <m.section
      id="about"
      className={s.about}
      aria-label={t("À propos de Maskot")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className={s.art}>{children}</div>
      <div className={s.content}>
        <h2>Maskot</h2>
        <section className={s.preferences} aria-label={t("Préférences")}>
          <div className={s.language}>
            <h3>{t("Langue")}</h3>
            <PreferenceGroup
              label={t("Langue")}
              value={i18n.resolvedLanguage ?? "en"}
              options={[
                { value: "en", label: "English", lang: "en" },
                { value: "fr", label: "Français", lang: "fr" },
              ]}
              onChange={(value) => void i18n.changeLanguage(value)}
            />
          </div>
          <ThemePicker />
        </section>
        <footer className={s.footer}>
          <div className={s.links}>
            <a
              href="https://github.com/ExtraBinoss/Maskot"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
            >
              <img
                className={s.github}
                src="/github.svg"
                alt=""
                width="22"
                height="22"
              />
            </a>
            <a
              href="https://plinka.eu"
              target="_blank"
              rel="noreferrer"
              aria-label="Plinka"
            >
              <img
                className={s.plinka}
                src="/plinka.svg"
                alt=""
                width="38"
                height="24"
                decoding="async"
              />
            </a>
          </div>
          <CreditsDialog triggerClassName={s.credits} />
        </footer>
      </div>
      <a
        className={s.wordmark}
        href="https://plinka.eu"
        target="_blank"
        rel="noreferrer"
        aria-label={t("Maskot, un projet Plinka")}
      >
        maskot.
      </a>
    </m.section>
  );
}
