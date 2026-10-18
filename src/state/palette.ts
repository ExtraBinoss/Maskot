import { atom } from "jotai";
import { PALETTE } from "../mascot/mascot-catalog";
import { normalizeHex } from "../lib/color";
import { statusAtom } from "./lab";

export const CUSTOM_COLORS_KEY = "maskot.colors.v1";

export function parseCustomColors(saved: string | null): string[] {
  try {
    const values: unknown = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(values)) return [];
    const colors = values.flatMap((value: unknown) => {
      const color = typeof value === "string" ? normalizeHex(value) : null;
      return color && !PALETTE.includes(color) ? [color] : [];
    });
    return [...new Set(colors)];
  } catch {
    return [];
  }
}

function readCustomColors(): string[] {
  try {
    return parseCustomColors(localStorage.getItem(CUSTOM_COLORS_KEY));
  } catch {
    return [];
  }
}

const savedColorsAtom = atom<string[]>([]);
export const restoreCustomColorsAtom = atom(null, (_get, set) => {
  set(savedColorsAtom, readCustomColors());
});
export const customColorsAtom = atom(
  (get) => get(savedColorsAtom),
  (get, set, color: string) => {
    const colors = parseCustomColors(
      JSON.stringify([...get(customColorsAtom), color]),
    );
    set(savedColorsAtom, colors);
    try {
      localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(colors));
      set(statusAtom, "Couleur ajoutée à ta palette.");
    } catch {
      set(
        statusAtom,
        "Couleur ajoutée pour cette session. Le stockage local est indisponible.",
      );
    }
  },
);
