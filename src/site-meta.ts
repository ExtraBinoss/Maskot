export const SITE_URL = "https://maskot.plinka.eu";
export const SOCIAL_IMAGE = `${SITE_URL}/social/maskot.png`;

export const SITE_META = {
  en: {
    title: "Maskot — Free SVG Mascot Creator",
    description:
      "Create your own Grok bot inspired mascot. Explore expressive eyes, playful shapes and smooth animation. Free, open source. Export SVG, PNG and WebM.",
    locale: "en_US",
    alternateLocale: "fr_FR",
    imageAlt:
      "Maskot: an orange mascot beside a collection of colorful faces, with the words Grok bot inspired, made to be yours and maskot.plinka.eu.",
  },
  fr: {
    title: "Maskot — Créateur de mascottes SVG",
    description:
      "Crée ta mascotte inspirée du Grok bot : formes, regards expressifs et animations fluides. Un studio libre et gratuit. Exporte en SVG, PNG et WebM.",
    locale: "fr_FR",
    alternateLocale: "en_US",
    imageAlt:
      "Maskot : une mascotte orange accompagnée de visages colorés, du texte Grok bot inspired, made to be yours et de l’adresse maskot.plinka.eu.",
  },
} as const;

export function getStructuredData(language: string) {
  const { description } = SITE_META[language === "fr" ? "fr" : "en"];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Maskot",
        url: `${SITE_URL}/`,
        inLanguage: ["en", "fr"],
        publisher: { "@id": "https://plinka.eu/#organization" },
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#app`,
        name: "Maskot",
        url: `${SITE_URL}/`,
        description,
        image: SOCIAL_IMAGE,
        applicationCategory: "DesignApplication",
        operatingSystem: "Any",
        inLanguage: ["en", "fr"],
        isAccessibleForFree: true,
        license: `${SITE_URL}/licenses/Maskot-MIT.txt`,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
        },
        featureList: [
          "Custom SVG mascots, shapes and expressive eyes",
          "Animated timelines and smooth morphing",
          "SVG, PNG and WebM exports",
        ],
        publisher: { "@id": "https://plinka.eu/#organization" },
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "Organization",
        "@id": "https://plinka.eu/#organization",
        name: "Plinka",
        url: "https://plinka.eu/",
      },
    ],
  };
}
