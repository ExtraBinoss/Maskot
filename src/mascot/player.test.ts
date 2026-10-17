import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  activeStepAtom,
  boardAtom,
  durationAtom,
  elapsedAtom,
  followAtom,
  frameAtom,
  lookAtom,
  playingAtom,
  presetAtom,
  reducedMotionAtom,
  sequencingAtom,
  speedAtom,
  stateAtom,
  statusAtom,
  timelineAtom,
  createLabStore,
} from "../state/lab";
import { createMascotPlayer, type PlayerEnvironment } from "./player";
import { createMascotEngine, DEFAULT_LOOK } from "./mascot-catalog";
import { defaultPreset } from "./mascot-storage";

describe("React/Jotai mascot playback", () => {
  let callbacks: Map<number, FrameRequestCallback>;
  let hidden: boolean;
  let visibility: () => void;
  let motion: (reduced: boolean) => void;
  let env: PlayerEnvironment;
  const removeVisibility = vi.fn();
  const removeMotion = vi.fn();
  beforeEach(() => {
    callbacks = new Map();
    hidden = false;
    let nextId = 0;
    env = {
      requestFrame: (callback) => {
        callbacks.set(++nextId, callback);
        return nextId;
      },
      cancelFrame: (id) => {
        callbacks.delete(id);
      },
      isHidden: () => hidden,
      onVisibility: (callback) => {
        visibility = callback;
        return removeVisibility;
      },
      onMotion: (callback) => {
        motion = callback;
        return removeMotion;
      },
      save: vi.fn(),
    };
  });
  const setup = (reduced = false) => {
    const store = createLabStore(() => null, reduced);
    const player = createMascotPlayer(store, env);
    const unmount = player.mount();
    return { store, player, unmount };
  };
  const tick = (ms: number) => {
    const pending = [...callbacks.values()];
    callbacks.clear();
    pending.forEach((callback) => callback(ms));
  };
  it("owns one loop, freezes on pause and resumes without a time jump", () => {
    const { store } = setup();
    expect(callbacks.size).toBe(1);
    tick(0);
    tick(64);
    store.set(playingAtom, false);
    const paused = store.get(frameAtom);
    expect(callbacks.size).toBe(0);
    tick(128);
    expect(store.get(frameAtom)).toBe(paused);
    store.set(playingAtom, true);
    tick(9999);
    expect(store.get(frameAtom)).toEqual(paused);
    expect(callbacks.size).toBe(1);
  });
  it("releases frames and listeners, including a StrictMode remount", () => {
    const { player, unmount } = setup();
    hidden = true;
    visibility();
    expect(callbacks.size).toBe(0);
    hidden = false;
    visibility();
    expect(callbacks.size).toBe(1);
    unmount();
    expect(callbacks.size).toBe(0);
    expect(removeVisibility).toHaveBeenCalled();
    expect(removeMotion).toHaveBeenCalled();
    const dispose = player.mount();
    expect(callbacks.size).toBe(1);
    dispose();
    expect(callbacks.size).toBe(0);
  });
  it("starts paused for reduced motion, allows manual play and reacts to changes", () => {
    const { store } = setup(true);
    expect(callbacks.size).toBe(0);
    store.set(playingAtom, true);
    expect(callbacks.size).toBe(1);
    motion(true);
    expect(store.get(playingAtom)).toBe(false);
    motion(false);
    expect(store.get(reducedMotionAtom)).toBe(false);
    expect(callbacks.size).toBe(0);
  });
  it("selects real movement frames while paused and cycles the catalogue", () => {
    const { store, player } = setup(true);
    player.choose("thinking");
    expect(store.get(frameAtom).dots.length).toBeGreaterThan(0);
    expect(store.get(sequencingAtom)).toBe(false);
    player.choose("idle");
    player.next(-1);
    expect(store.get(stateAtom)).toBe("comet");
    player.next(1);
    expect(store.get(stateAtom)).toBe("idle");
  });
  it("seeks deterministic frames in either direction and clamps bounds", () => {
    const { store, player } = setup();
    player.seek(4.8);
    const frame = store.get(frameAtom);
    player.seek(0);
    player.seek(4.8);
    expect(store.get(frameAtom)).toEqual(frame);
    expect(store.get(stateAtom)).toBe("orbit");
    player.seek(-1);
    expect(store.get(elapsedAtom)).toBe(0);
    player.seek(100);
    expect(store.get(elapsedAtom)).toBe(store.get(durationAtom));
    player.seek(NaN);
    expect(store.get(frameAtom).bodyPath).not.toContain("NaN");
  });
  it("advances steps and preserves overshoot at the loop seam", () => {
    const { store, player } = setup();
    player.seek(1.98);
    tick(0);
    tick(64);
    expect(store.get(stateAtom)).toBe("thinking");
    expect(store.get(activeStepAtom)).toBe(1);
    player.seek(8.98);
    tick(128);
    expect(store.get(stateAtom)).toBe("idle");
    expect(store.get(elapsedAtom)).toBeCloseTo(0.044);
  });
  it("morphs across the seam with the engine's timestamped transition", () => {
    const { store, player } = setup();
    store.set(timelineAtom, [
      { state: "idle", duration: 1 },
      { state: "comet", duration: 2 },
    ]);
    player.seek(2.99);
    tick(0);
    tick(64);
    const reference = createMascotEngine(DEFAULT_LOOK);
    reference.setState("comet", 1);
    reference.setState("idle", 3);
    expect(store.get(frameAtom)).toEqual(reference.sample(2.99 + 0.064));
    expect(store.get(frameAtom).bodyPath).not.toBe(
      createMascotEngine(DEFAULT_LOOK).sample(0).bodyPath,
    );
  });
  it("caps long deltas and scales playback speed", () => {
    const { store, player } = setup();
    player.seek(0);
    store.set(speedAtom, 2);
    tick(0);
    tick(10000);
    expect(store.get(elapsedAtom)).toBeCloseTo(0.128);
  });
  it("applies appearance and eye geometry immediately while frozen", () => {
    const { store, player } = setup(true);
    const before = store.get(frameAtom);
    store.set(lookAtom, {
      ...store.get(lookAtom),
      shape: "nuage",
      eyes: "star",
      expression: "heureux",
      eyeGeometry: {
        ...store.get(lookAtom).eyeGeometry,
        size: 1.5,
        spacing: 1.3,
      },
    });
    const look = store.get(lookAtom);
    expect(store.get(frameAtom)).not.toEqual(before);
    expect(callbacks.size).toBe(0);
    player.choose("wide");
    expect(store.get(frameAtom)).toEqual(
      createMascotEngine(look, "wide").sample(0),
    );
    player.seek(4.8);
    player.seek(0.8);
    expect(store.get(frameAtom)).toEqual(createMascotEngine(look).sample(0.8));
  });
  it("reconciles timeline edits only when sequencing", () => {
    const { store, player } = setup();
    store.set(timelineAtom, [
      { state: "idle", duration: 1 },
      { state: "orbit", duration: 3 },
    ]);
    expect(store.get(sequencingAtom)).toBe(false);
    player.seek(3);
    store.set(timelineAtom, [{ state: "thinking", duration: 1 }]);
    expect(store.get(elapsedAtom)).toBe(1);
    expect(store.get(activeStepAtom)).toBe(0);
    expect(store.get(stateAtom)).toBe("thinking");
  });
  it("pauses for the board and starts the timeline in the live view", () => {
    const { store, player } = setup();
    store.set(boardAtom, true);
    expect(store.get(playingAtom)).toBe(false);
    expect(callbacks.size).toBe(0);
    player.playSequence();
    expect(store.get(boardAtom)).toBe(false);
    expect(store.get(sequencingAtom)).toBe(true);
    expect(callbacks.size).toBe(1);
  });
  it("follows a mouse, ignores touch and empty boxes, and releases gaze", () => {
    const { store, player } = setup();
    const rect = { x: 0, y: 0, width: 400, height: 400 } as DOMRect;
    const pointer = { clientX: 400, clientY: 0, pointerType: "mouse" };
    tick(0);
    tick(64);
    player.aim(pointer, rect);
    const before = store.get(frameAtom);
    tick(64);
    expect(store.get(frameAtom)).toEqual(before);
    store.set(followAtom, true);
    player.aim(pointer, rect);
    tick(128);
    const aimed = store.get(frameAtom);
    expect(aimed).not.toEqual(before);
    player.aim({ ...pointer, pointerType: "touch" }, rect);
    player.aim(pointer, { ...rect, width: 0 });
    player.aim(pointer, { ...rect, height: 0 });
    player.release();
    tick(192);
    expect(store.get(frameAtom).bodyPath).not.toMatch(/NaN|Infinity/);
    store.set(playingAtom, false);
    player.aim(pointer, rect);
    expect(callbacks.size).toBe(0);
  });
  it("saves presets on edits, reports storage errors and unsubscribes", () => {
    const { store, unmount } = setup();
    store.set(lookAtom, { ...store.get(lookAtom), color: "#abcdef" });
    expect(env.save).toHaveBeenCalledWith(
      JSON.stringify(store.get(presetAtom)),
    );
    env.save = () => {
      throw new Error("quota");
    };
    store.set(presetAtom, defaultPreset());
    expect(store.get(statusAtom)).toContain("ne permet pas de sauvegarder");
    unmount();
    store.set(statusAtom, "");
    store.set(lookAtom, { ...store.get(lookAtom), color: "#000000" });
    expect(store.get(statusAtom)).toBe("");
  });
  it("releases pointer gaze while paused without invalidating the frozen frame", () => {
    const { store, player } = setup(true);
    player.release();
    expect(store.get(frameAtom).bodyPath).not.toMatch(/NaN|Infinity/);
    store.set(playingAtom, true);
    store.set(followAtom, true);
    player.aim({ clientX: 400, clientY: 0, pointerType: "mouse" }, {
      x: 0,
      y: 0,
      width: 400,
      height: 400,
    } as DOMRect);
    tick(0);
    tick(64);
    store.set(playingAtom, false);
    player.release();
    const frame = store.get(frameAtom);
    expect(frame.bodyPath).not.toMatch(/NaN|Infinity/);
    frame.eyes.forEach((eye) => expect(eye.matrix).not.toMatch(/NaN|Infinity/));
    expect(callbacks.size).toBe(0);
  });
  it("restores a valid saved preset and falls back on invalid or denied storage", () => {
    const preset = defaultPreset();
    preset.look.shape = "triangle";
    expect(
      createLabStore(() => JSON.stringify(preset), false).get(presetAtom),
    ).toEqual(preset);
    for (const load of [
      () => "{",
      () => {
        throw new Error("denied");
      },
    ]) {
      const store = createLabStore(load, true);
      expect(store.get(presetAtom)).toEqual(defaultPreset());
      expect(store.get(statusAtom)).toContain("n’a pas pu être relu");
    }
  });
});
