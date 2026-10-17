import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en, fr } from "./locales";

export const LANGUAGE_KEY = "maskot.language.v1";
function initialLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved === "en" || saved === "fr") return saved;
  } catch {
    /* Language switching also works without storage. */
  }
  return navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr } },
  lng: initialLanguage(),
  fallbackLng: "en",
  supportedLngs: ["en", "fr"],
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  initAsync: false,
});

function synchronizeLanguage(language: string) {
  document.documentElement.lang = language;
  document.title = i18n.t("Maskot — A little character studio");
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute(
      "content",
      i18n.t(
        "Crée une mascotte inspirée du Grok bot. Formes, yeux, humeurs et mouvements. Un outil libre par Plinka.",
      ),
    );
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    /* Keep the session preference. */
  }
}
i18n.on("languageChanged", synchronizeLanguage);
synchronizeLanguage(i18n.resolvedLanguage ?? "en");

export default i18n;
