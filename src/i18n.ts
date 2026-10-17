import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en, fr } from "./locales";
import { SITE_META } from "./site-meta";

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
  const meta = SITE_META[language === "fr" ? "fr" : "en"];
  document.title = meta.title;
  for (const [selector, content] of [
    ['meta[name="description"]', meta.description],
    ['meta[property="og:title"]', meta.title],
    ['meta[property="og:description"]', meta.description],
    ['meta[property="og:locale"]', meta.locale],
    ['meta[property="og:locale:alternate"]', meta.alternateLocale],
    ['meta[property="og:image:alt"]', meta.imageAlt],
    ['meta[name="twitter:title"]', meta.title],
    ['meta[name="twitter:description"]', meta.description],
    ['meta[name="twitter:image:alt"]', meta.imageAlt],
  ])
    document.querySelector(selector)?.setAttribute("content", content);
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    /* Keep the session preference. */
  }
}
i18n.on("languageChanged", synchronizeLanguage);
synchronizeLanguage(i18n.resolvedLanguage ?? "en");

export default i18n;
