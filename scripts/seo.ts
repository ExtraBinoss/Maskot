import type { HtmlTagDescriptor, Plugin } from "vite";
import { SITE_META, SITE_URL, SOCIAL_IMAGE } from "../src/site-meta.ts";

export function seo(): Plugin {
  const { title, description, imageAlt, locale, alternateLocale } =
    SITE_META.en;
  return {
    name: "maskot-seo",
    transformIndexHtml() {
      const properties = {
        "og:type": "website",
        "og:site_name": "Maskot",
        "og:title": title,
        "og:description": description,
        "og:url": `${SITE_URL}/`,
        "og:locale": locale,
        "og:locale:alternate": alternateLocale,
        "og:image": SOCIAL_IMAGE,
        "og:image:type": "image/png",
        "og:image:width": "1200",
        "og:image:height": "630",
        "og:image:alt": imageAlt,
      };
      const names = {
        description,
        robots: "index, follow, max-image-preview:large",
        "twitter:card": "summary_large_image",
        "twitter:title": title,
        "twitter:description": description,
        "twitter:image": SOCIAL_IMAGE,
        "twitter:image:alt": imageAlt,
      };
      const tags: HtmlTagDescriptor[] = [
        { tag: "title", children: title },
        { tag: "link", attrs: { rel: "canonical", href: `${SITE_URL}/` } },
        ...Object.entries(properties).map(([property, content]) => ({
          tag: "meta",
          attrs: { property, content },
        })),
        ...Object.entries(names).map(([name, content]) => ({
          tag: "meta",
          attrs: { name, content },
        })),
        {
          tag: "script",
          attrs: { type: "application/ld+json" },
          children: JSON.stringify({
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
          }),
        },
      ];
      return tags.map((tag) => ({ ...tag, injectTo: "head" }));
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
      });
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE_URL}/</loc></url></urlset>\n`,
      });
    },
  };
}
