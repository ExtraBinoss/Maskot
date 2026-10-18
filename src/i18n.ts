import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en, fr } from "./locales";
import { getStructuredData, SITE_META } from "./site-meta";

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

void i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, fr: { translation: fr } },
    // The first browser render must match the English static document.
    lng: "en",
    fallbackLng: "en",
    supportedLngs: ["en", "fr"],
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
    initAsync: false,
  })
  .catch((error: unknown) => {
    console.error("Language initialization failed", error);
  });

function synchronizeLanguage(language: string) {
  document.documentElement.lang = language;
  const meta = SITE_META[language === "fr" ? "fr" : "en"];
  document.title = meta.title;
  const schema = document.querySelector('script[type="application/ld+json"]');
  if (schema) schema.textContent = JSON.stringify(getStructuredData(language));
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
let initialized = false;
export function restoreClientLanguage() {
  if (initialized) return;
  initialized = true;
  i18n.on("languageChanged", synchronizeLanguage);
  void i18n.changeLanguage(initialLanguage()).catch((error: unknown) => {
    console.error("Language preference could not be restored", error);
  });
}

export default i18n;
