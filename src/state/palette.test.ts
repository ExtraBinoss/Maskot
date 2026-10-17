import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStore } from "jotai";
import {
  CUSTOM_COLORS_KEY,
  customColorsAtom,
  parseCustomColors,
} from "./palette";
import { statusAtom } from "./lab";

beforeEach(() => localStorage.clear());

describe("saved color palette", () => {
  it("normalizes, deduplicates and discards default colors and invalid values", () => {
    expect(
      parseCustomColors(
        JSON.stringify([
          "#123ABC",
          "123abc",
          "#2563eb",
          null,
          {},
          42,
          "bad",
          "#987654",
        ]),
      ),
    ).toEqual(["#123abc", "#987654"]);
  });
  it.each([null, "{broken", "{}", "null", "42"])(
    "recovers from invalid storage %s",
    (saved) => {
      expect(parseCustomColors(saved)).toEqual([]);
    },
  );
  it("restores saved colors and persists additions only once", () => {
    localStorage.setItem(CUSTOM_COLORS_KEY, '["#123456"]');
    const store = createStore();
    expect(store.get(customColorsAtom)).toEqual(["#123456"]);
    store.set(customColorsAtom, "#ABCDEF");
    store.set(customColorsAtom, "#abcdef");
    expect(JSON.parse(localStorage.getItem(CUSTOM_COLORS_KEY)!)).toEqual([
      "#123456",
      "#abcdef",
    ]);
    expect(createStore().get(customColorsAtom)).toEqual(["#123456", "#abcdef"]);
  });
  it("keeps the color for the session when browser storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const store = createStore();
    expect(store.get(customColorsAtom)).toEqual([]);
    store.set(customColorsAtom, "#123456");
    expect(store.get(customColorsAtom)).toEqual(["#123456"]);
    expect(store.get(statusAtom)).toContain("cette session");
  });
});
