import { describe, expect, it } from "vitest";
import { normalizeHex } from "./color";

describe("color picker conversions", () => {
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
