import { describe, expect, it } from "vitest";
import { FIGURES, ORBS } from "./figures";
import { createMascotEngine, DEFAULT_LOOK } from "./mascot-catalog";
import { parsePreset, defaultPreset } from "./mascot-storage";

describe("abstract SVG artwork", () => {
  it.each(FIGURES)(
    "renders and restores $id without invalid coordinates",
    ({ id }) => {
      const look = { ...DEFAULT_LOOK, shape: id };
      const engine = createMascotEngine(look);
      const at = engine.sample(1.7);
      expect(at.eyes).toHaveLength(0);
      expect(JSON.stringify(at)).not.toMatch(/NaN|Infinity|null(?=,?\])/);
      expect(at.bodyPath.match(/C/g)).toHaveLength(64);
      expect(at.bodyAlpha > 0 || at.dots.length > 0).toBe(true);
      expect(engine.sample(1.7)).toEqual(at);
      expect(
        parsePreset(JSON.stringify({ ...defaultPreset(), look })).look,
      ).toEqual(look);
    },
  );
  it("retargets solid and particle morphs from the displayed frame", () => {
    const engine = createMascotEngine(DEFAULT_LOOK);
    const before = engine.sample(0, 1);
    engine.setFigure("symbol-exclamation", 1, 0);
    expect(engine.sample(0, 1)).toEqual(before);
    const middle = engine.sample(0, 1.1);
    expect(middle.bodyPath).not.toBe(before.bodyPath);
    engine.setFigure("orb-working", 1.1, 0);
    expect(engine.sample(0, 1.1)).toEqual(middle);
    expect(engine.sample(0, 1.6).dots.length).toBeGreaterThan(100);
    engine.setFigure("triangle", 1.6, 0);
    const returning = engine.sample(0, 1.7);
    engine.setFigure("cercle", 1.7, 0);
    expect(engine.sample(0, 1.7)).toEqual(returning);
    const face = engine.sample(0, 2.2);
    expect(face.eyes).toHaveLength(2);
    expect(face.bodyAlpha).toBe(1);
    expect(face.bodyPath).not.toMatch(/NaN|Infinity/);
  });
  it.each(ORBS)("animates $id on the shared, deterministic clock", ({ id }) => {
    const engine = createMascotEngine({ ...DEFAULT_LOOK, shape: id });
    expect(engine.sample(0).dots).not.toEqual(engine.sample(1).dots);
    expect(engine.sample(0)).toEqual(engine.sample(0));
  });
});
