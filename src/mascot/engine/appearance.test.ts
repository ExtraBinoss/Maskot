import { describe, expect, it } from "vitest";
import { createMascotEngine } from "../mascot-catalog";
import { defaultPreset } from "../mascot-storage";
import { SHAPE_BY_ID, SHAPES } from "./skins";
import { liveliness } from "./face";
import { PROFILE_SAMPLES } from "./profiles";

describe("studio appearance morphs", () => {
  it("offers 32 unique silhouettes with the same morph topology", () => {
    expect(SHAPES).toHaveLength(32);
    expect(new Set(SHAPES.map((s) => s.id)).size).toBe(32);
    expect(new Set(SHAPES.map((s) => JSON.stringify(s.radii))).size).toBe(32);
    for (const shape of SHAPES) {
      expect(shape.radii).toHaveLength(PROFILE_SAMPLES);
      expect(shape.radii.every((r) => Number.isFinite(r) && r > 0)).toBe(true);
    }
  });
  it("retargets a body morph from the displayed outline", () => {
    const engine = createMascotEngine(defaultPreset().look);
    engine.setShape(SHAPE_BY_ID.get("nuage")!.radii, 1);
    const middle = engine.sample(1.12);
    engine.setShape(SHAPE_BY_ID.get("triangle")!.radii, 1.12);
    expect(engine.sample(1.12).bodyPath).toBe(middle.bodyPath);
    expect(engine.sample(1.12).eyes.map((e) => e.matrix)).toEqual(
      middle.eyes.map((e) => e.matrix),
    );
    expect(engine.sample(1.5).bodyPath).not.toBe(middle.bodyPath);
  });
  it("retargets eyes without jumping to the previous target", () => {
    const engine = createMascotEngine(defaultPreset().look);
    engine.setEyes("heart", 1);
    const middle = engine.sample(1.08).eyes[0].d;
    engine.setEyes("star8", 1.08);
    expect(engine.sample(1.08).eyes[0].d).toBe(middle);
    expect(engine.sample(1.6).eyes[0].d).not.toBe(middle);
  });
  it("animates geometry against a separate appearance clock while a pose stays frozen", () => {
    const engine = createMascotEngine(defaultPreset().look);
    const before = engine.sample(0, 1);
    engine.setEyeGeometry(
      { ...defaultPreset().look.eyeGeometry, size: 1.5 },
      1,
    );
    expect(engine.sample(0, 1)).toEqual(before);
    expect(engine.sample(0, 1.15).eyes[0].d).not.toBe(before.eyes[0].d);
    expect(engine.sample(0, 1.15).bodyPath).toBe(before.bodyPath);
  });
  it("keeps natural blinking after fifteen minutes", () => {
    expect(liveliness(1.48).lid).toBeLessThan(0.1);
    expect(liveliness(901.48).lid).toBeCloseTo(liveliness(1.48).lid, 8);
  });
});
