import { createInstance } from "i18next";
import { describe, expect, it } from "vitest";
import { en, fr } from "./locales";
import {
  SHAPE_LABELS,
  EXPRESSION_LABELS,
  STATE_LABELS,
} from "./mascot/mascot-catalog";
import { EYE_STYLES } from "./mascot/engine/eye-styles";
import { FIGURES } from "./mascot/figures";

describe("studio translations", () => {
  it("covers the entire shape, eye, mood and motion catalogs in both languages", () => {
    const labels = [
      ...Object.values(SHAPE_LABELS),
      ...Object.values(EXPRESSION_LABELS),
      ...Object.values(STATE_LABELS),
      ...EYE_STYLES.map((eye) => eye.label),
      ...FIGURES.map((figure) => figure.label),
    ];
    for (const label of labels) {
      expect(en[label], label).toBeTruthy();
      expect(fr[label], label).toBeTruthy();
    }
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort());
  });
  it("translates names, counts and feedback without changing stored mascot IDs", async () => {
    const language = createInstance();
    await language.init({
      resources: { en: { translation: en }, fr: { translation: fr } },
      lng: "en",
      fallbackLng: "en",
      keySeparator: false,
      nsSeparator: false,
      initAsync: false,
    });
    expect(
      language.t("Expression {{label}}", { label: language.t("Heureux") }),
    ).toBe("Expression: Happy");
    expect(language.t("{{count}} formes", { count: 32 })).toBe("32 shapes");
    expect(
      language.t("{{format}} exporté avec un fond transparent.", {
        format: "SVG",
      }),
    ).toBe("SVG exported with a transparent background.");
    await language.changeLanguage("fr");
    expect(
      language.t("Expression {{label}}", { label: language.t("Heureux") }),
    ).toBe("Expression Heureux");
    expect(language.t("{{count}} formes", { count: 32 })).toBe("32 formes");
  });
  it("keeps navigation, motion groups and video backgrounds localized", () => {
    expect(en.Motion).toBe("Motion");
    expect(fr.Motion).toBe("Mouvement");
    expect(en.Transparent).toBe("Transparent");
    expect(en.Blanc).toBe("White");
    expect(en.Noir).toBe("Black");
    expect(fr.Transparent).toBe("Transparent");
    expect(fr.Blanc).toBe("Blanc");
    expect(fr.Noir).toBe("Noir");
    expect(fr["Thinking orbs"]).toBe("Orbes pensants");
    expect(en["Choisir une couleur"]).toBe("Choose color");
    expect(en["Opacité"]).toBe("Opacity");
    expect(en["Palette de couleurs"]).toBe("Color palette");
    expect(fr["Choisir une couleur"]).toBe("Choisir une couleur");
    expect(fr["Ouvrir le sélecteur de couleur"]).toBe(
      "Ouvrir le sélecteur de couleur",
    );
    expect(fr["Opacité"]).toBe("Opacité");
    expect(fr.Effacer).toBe("Effacer");
    expect(fr["Palette de couleurs"]).toBe("Palette de couleurs");
  });
});
