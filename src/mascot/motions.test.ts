import { describe, expect, it } from "vitest";
import {
  createMascotEngine,
  DEFAULT_LOOK,
  MOTION_GROUPS,
  MOTION_IDS,
  MOTION_LABELS,
} from "./mascot-catalog";
import { defaultPreset, parsePreset } from "./mascot-storage";
import { figureFrame } from "./figures";
import {
  createLabStore,
  frameAtom,
  timelineAtom,
  stateAtom,
} from "../state/lab";
import { createMascotPlayer, type PlayerEnvironment } from "./player";

describe("the complete animation catalog", () => {
  it("exposes each classic movement, orb and animated symbol once", () => {
    expect(MOTION_GROUPS.map((group) => group.items.length)).toEqual([
      15, 9, 5,
    ]);
    expect(new Set(MOTION_IDS).size).toBe(29);
    expect(MOTION_IDS).toContain("swirl");
    for (const id of MOTION_IDS) expect(MOTION_LABELS[id]).toBeTruthy();
  });
  it.each(MOTION_IDS)("renders %s deterministically", (id) => {
    const engine = createMascotEngine(DEFAULT_LOOK, id);
    const frame = engine.sample(0.75);
    expect(JSON.stringify(frame)).not.toMatch(/NaN|Infinity/);
    expect(frame.bodyAlpha > 0 || frame.dots.length > 0).toBe(true);
    expect(engine.sample(0.75)).toEqual(frame);
  });
  it("persists the new animation IDs in existing version-one presets", () => {
    const preset = {
      ...defaultPreset(),
      timeline: MOTION_IDS.map((state) => ({ state, duration: 2 })),
    };
    expect(parsePreset(JSON.stringify(preset))).toEqual(preset);
    expect(() =>
      parsePreset(
        JSON.stringify({
          ...preset,
          timeline: [{ state: "symbol-question", duration: 2 }],
        }),
      ),
    ).toThrow();
  });
  it("morphs from the displayed frame and starts figure clocks at their clip boundary", () => {
    const engine = createMascotEngine(DEFAULT_LOOK);
    const before = engine.sample(2);
    engine.setState("orb-working", 2);
    expect(engine.sample(2)).toEqual(before);
    expect(engine.sample(2.5)).toEqual(figureFrame("orb-working", 0.5));
    const orb = engine.sample(3);
    engine.setState("symbol-loading", 3);
    expect(engine.sample(3)).toEqual(orb);
    expect(engine.sample(3.5)).toEqual(figureFrame("symbol-loading", 0.5));
    const symbol = engine.sample(4);
    engine.setState("wink", 4);
    expect(engine.sample(4)).toEqual(symbol);
    expect(engine.sample(4.5).eyes).toHaveLength(2);
    expect(engine.sample(4.5).bodyAlpha).toBe(1);
  });
  it("seeks backward and forward across a mixed timeline without changing the saved look", () => {
    const store = createLabStore(() => null, true, "motion");
    store.set(timelineAtom, [
      { state: "idle", duration: 1 },
      { state: "orb-working", duration: 2 },
      { state: "symbol-loading", duration: 2 },
      { state: "wink", duration: 1 },
    ]);
    const env: PlayerEnvironment = {
      requestFrame: () => 1,
      cancelFrame() {},
      isHidden: () => false,
      onVisibility: () => () => {},
      onMotion: () => () => {},
      save() {},
    };
    const player = createMascotPlayer(store, env);
    player.seek(2);
    const orb = store.get(frameAtom);
    player.seek(4);
    expect(store.get(stateAtom)).toBe("symbol-loading");
    expect(store.get(frameAtom)).toEqual(figureFrame("symbol-loading", 1));
    player.seek(2);
    expect(store.get(frameAtom)).toEqual(orb);
    player.seek(5.9);
    expect(store.get(frameAtom).eyes).toHaveLength(2);
  });
});
