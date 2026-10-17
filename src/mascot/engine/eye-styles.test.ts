import { describe, expect, it } from "vitest";
import { EYE_STYLES } from "./eye-styles";
import { eyeShapePath } from "./eye-shape";
import { createMascotEngine } from "../mascot-catalog";
import { defaultPreset, parsePreset } from "../mascot-storage";
import { EXPRESSIONS } from "./expressions";

describe("extended eyes and moods", () => {
  it("offers 32 distinct eye outlines and retains the legacy identifiers", () => {
    expect(EYE_STYLES).toHaveLength(32);
    const paths = EYE_STYLES.map(({ id }) => eyeShapePath(30, 45, id, id, 1));
    expect(new Set(paths).size).toBe(32);
    expect(EYE_STYLES.map((s) => s.id)).toEqual(
      expect.arrayContaining(["capsule", "sparkle", "star"]),
    );
  });
  it.each(EYE_STYLES)(
    "round trips $id and morphs through every other eye style",
    ({ id }) => {
      const preset = defaultPreset();
      preset.look.eyes = id;
      expect(parsePreset(JSON.stringify(preset))).toEqual(preset);
      for (const other of EYE_STYLES) {
        const path = eyeShapePath(30, 45, id, other.id, 0.5);
        expect(path).not.toMatch(/NaN|Infinity/);
        expect(path.match(/C/g)).toHaveLength(64);
      }
    },
  );
  it.each(EXPRESSIONS)(
    "renders $id with every eye style without changing the body",
    ({ id }) => {
      const look = { ...defaultPreset().look, expression: id };
      const body = createMascotEngine(look).sample(0.9).bodyPath;
      for (const style of EYE_STYLES) {
        const frame = createMascotEngine({ ...look, eyes: style.id }).sample(
          0.9,
        );
        expect(frame.bodyPath).toBe(body);
        expect(frame.eyes).toHaveLength(2);
        expect(JSON.stringify(frame)).not.toMatch(/NaN|Infinity/);
      }
    },
  );
});
