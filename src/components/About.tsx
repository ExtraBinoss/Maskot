import { useTranslation } from "react-i18next";
import { m } from "motion/react";
import { ButtonGroup } from "./ui/button-group";
import { ThemePicker } from "./ThemePicker";
import s from "../styles/about.module.css";

export default function About() {
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
      <div className={s.content}>
        <h2>Maskot</h2>
        <section className={s.preferences} aria-label={t("Préférences")}>
          <div className={s.language}>
            <h3>{t("Langue")}</h3>
            <ButtonGroup aria-label={t("Langue")} className={s.languagePicker}>
              {(
                [
                  { id: "en", label: "English" },
                  { id: "fr", label: "Français" },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  lang={id}
                  aria-pressed={i18n.resolvedLanguage === id}
                  onClick={() => void i18n.changeLanguage(id)}
                >
                  {label}
                </button>
              ))}
            </ButtonGroup>
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
                src="/plinka.svg"
                alt=""
                width="28"
                height="28"
                decoding="async"
              />
            </a>
          </div>
          <a
            className={s.credits}
            href="/licenses/NOTICE.txt"
            target="_blank"
            rel="noreferrer"
          >
            {t("Crédits & licences")}
          </a>
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
