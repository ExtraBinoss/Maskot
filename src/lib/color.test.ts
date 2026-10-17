import { describe, expect, it } from "vitest";
import { hexToHsv, hsvToHex, normalizeHex } from "./color";

describe("color picker conversions", () => {
  it.each([
    "#000000",
    "#ffffff",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#2563eb",
    "#123456",
    "#888888",
  ])("round trips %s without losing a channel", (color) => {
    expect(hsvToHex(hexToHsv(color))).toBe(color);
  });
  it("wraps hue and clamps the saturation and brightness endpoints", () => {
    expect(hsvToHex({ h: 360, s: 1, v: 1 })).toBe("#ff0000");
    expect(hsvToHex({ h: -120, s: 1, v: 1 })).toBe("#0000ff");
    expect(hsvToHex({ h: 0, s: -1, v: 2 })).toBe("#ffffff");
    expect(hsvToHex({ h: 0, s: 2, v: -1 })).toBe("#000000");
  });
  it("accepts a full hex value and rejects incomplete or non-hex colors", () => {
    expect(normalizeHex("  12ABef ")).toBe("#12abef");
    expect(normalizeHex("#2563EB")).toBe("#2563eb");
    for (const invalid of [
      "",
      "#fff",
      "red",
      "#12345z",
      "#12345678",
      "##123456",
    ]) {
      expect(normalizeHex(invalid)).toBeNull();
    }
  });
});
