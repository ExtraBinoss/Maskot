import { describe, expect, it } from "vitest";
import {
  createLabStore,
  timelineAtom,
  beginTimelineEditAtom,
  finishTimelineEditAtom,
  canUndoTimelineAtom,
  canRedoTimelineAtom,
  undoTimelineAtom,
  redoTimelineAtom,
  lookAtom,
  presetAtom,
} from "./lab";

describe("timeline history", () => {
  it("undoes additions, ordering and removals without reverting the look", () => {
    const store = createLabStore(() => null, true);
    const original = store.get(timelineAtom);
    const added = [...original, { state: "burst" as const, duration: 2 }];
    store.set(timelineAtom, added);
    const reordered = [...added].reverse();
    store.set(timelineAtom, reordered);
    store.set(timelineAtom, reordered.slice(1));
    store.set(lookAtom, { ...store.get(lookAtom), color: "#123456" });
    for (const expected of [reordered, added, original]) {
      store.set(undoTimelineAtom);
      expect(store.get(timelineAtom)).toEqual(expected);
    }
    expect(store.get(lookAtom).color).toBe("#123456");
    expect(store.get(canUndoTimelineAtom)).toBe(false);
    store.set(redoTimelineAtom);
    expect(store.get(timelineAtom)).toEqual(added);
    store.set(timelineAtom, original.slice(1));
    expect(store.get(canRedoTimelineAtom)).toBe(false);
  });
  it("groups a complete resize gesture into one undo and restores canceled drags", () => {
    const store = createLabStore(() => null, true);
    const original = store.get(timelineAtom);
    store.set(beginTimelineEditAtom);
    for (const duration of [2.1, 2.2, 2.5, 3])
      store.set(
        timelineAtom,
        original.map((step, i) => (i === 0 ? { ...step, duration } : step)),
      );
    store.set(finishTimelineEditAtom);
    store.set(undoTimelineAtom);
    expect(store.get(timelineAtom)).toEqual(original);
    expect(store.get(canUndoTimelineAtom)).toBe(false);
    store.set(redoTimelineAtom);
    const resized = store.get(timelineAtom);
    store.set(beginTimelineEditAtom);
    store.set(timelineAtom, original);
    store.set(finishTimelineEditAtom, true);
    expect(store.get(timelineAtom)).toEqual(resized);
    store.set(presetAtom, { ...store.get(presetAtom), timeline: original });
    expect(store.get(canUndoTimelineAtom)).toBe(false);
    expect(store.get(canRedoTimelineAtom)).toBe(false);
  });
});
