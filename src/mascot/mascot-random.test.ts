import { describe, expect, it } from "vitest";
import { randomMascotLook, randomMascotTimeline } from "./mascot-random";
import { DEFAULT_LOOK, MOTION_IDS } from "./mascot-catalog";
import { defaultPreset, parsePreset } from "./mascot-storage";
import {
  createLabStore,
  timelineAtom,
  undoTimelineAtom,
  redoTimelineAtom,
} from "../state/lab";

describe("random mascot and montage", () => {
  it("always changes each visible look choice and creates valid eye geometry", () => {
    for (const sample of [0, 0.25, 0.5, 0.999]) {
      const look = randomMascotLook(DEFAULT_LOOK, () => sample);
      for (const key of ["shape", "eyes", "expression", "color"] as const)
        expect(look[key]).not.toBe(DEFAULT_LOOK[key]);
      expect(
        parsePreset(JSON.stringify({ ...defaultPreset(), look })).look,
      ).toEqual(look);
    }
  });
  it("generates ten distinct valid motions and undo restores the previous montage", () => {
    const store = createLabStore(() => null, true);
    const before = store.get(timelineAtom);
    for (const sample of [0, 0.35, 0.999]) {
      const timeline = randomMascotTimeline(() => sample);
      expect(timeline).toHaveLength(10);
      expect(new Set(timeline.map((step) => step.state)).size).toBe(10);
      expect(timeline.every((step) => MOTION_IDS.includes(step.state))).toBe(
        true,
      );
      expect(
        parsePreset(JSON.stringify({ ...defaultPreset(), timeline })).timeline,
      ).toEqual(timeline);
      store.set(timelineAtom, timeline);
      store.set(undoTimelineAtom);
      expect(store.get(timelineAtom)).toEqual(before);
      store.set(redoTimelineAtom);
      expect(store.get(timelineAtom)).toEqual(timeline);
      store.set(undoTimelineAtom);
    }
  });
});
