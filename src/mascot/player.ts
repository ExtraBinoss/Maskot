// SPDX-License-Identifier: MIT
// Playback adapted from Beam's useMascotPlayer.ts.
import { EXPRESSION_BY_ID } from "./engine/expressions";
import { mixHex } from "./engine/skins";
import { clamp } from "./engine/math";
import type { MotionId } from "./motion-types";
import {
  createMascotEngine,
  timelinePosition,
  MOTION_IDS,
} from "./mascot-catalog";
import {
  activeStepAtom,
  boardAtom,
  durationAtom,
  elapsedAtom,
  followAtom,
  frameAtom,
  paintAtom,
  previewEyeGeometryAtom,
  lookAtom,
  playingAtom,
  presetAtom,
  reducedMotionAtom,
  sequencingAtom,
  speedAtom,
  stateAtom,
  statusAtom,
  timelineAtom,
  viewAtom,
  PRESET_KEY,
  type LabStore,
} from "../state/lab";

export interface PlayerEnvironment {
  requestFrame(callback: FrameRequestCallback): number;
  cancelFrame(id: number): void;
  isHidden(): boolean;
  onVisibility(callback: () => void): () => void;
  onMotion(callback: (reduced: boolean) => void): () => void;
  save(text: string): void;
}

export function browserEnvironment(): PlayerEnvironment {
  return {
    requestFrame: (callback) => requestAnimationFrame(callback),
    cancelFrame: (id) => cancelAnimationFrame(id),
    isHidden: () => document.hidden,
    onVisibility: (callback) => {
      document.addEventListener("visibilitychange", callback);
      return () => document.removeEventListener("visibilitychange", callback);
    },
    onMotion: (callback) => {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      const listener = (event: MediaQueryListEvent) => callback(event.matches);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    },
    save: (text) => localStorage.setItem(PRESET_KEY, text),
  };
}

export function createMascotPlayer(store: LabStore, env: PlayerEnvironment) {
  let engine = createMascotEngine(store.get(lookAtom));
  let clock = 0;
  let appearanceClock = 0;
  let appearanceUntil = -1;
  let paintStart = -10;
  let paintFrom = store.get(paintAtom);
  let appliedLook = store.get(lookAtom);
  let geometryUntil = -1;
  let geometryAnimating = false;
  let sequenceStart = 0;
  let last: number | null = null;
  let raf: number | null = null;
  let mounted = false;
  const draw = (geometry = true) => {
    const look = store.get(lookAtom);
    const k = Math.min(1, Math.max(0, (appearanceClock - paintStart) / 0.45));
    const eased = 1 - (1 - k) ** 5;
    const paint = store.get(paintAtom);
    const color =
      k >= 1 ? look.color : mixHex(paintFrom.color, look.color, eased);
    const blush =
      k >= 1
        ? Number(look.blush)
        : paintFrom.blush + (Number(look.blush) - paintFrom.blush) * eased;
    if (color !== paint.color || blush !== paint.blush)
      store.set(paintAtom, { color, blush });
    if (geometry) store.set(frameAtom, engine.sample(clock, appearanceClock));
  };
  const choose = (id: MotionId) => {
    store.set(sequencingAtom, false);
    store.set(stateAtom, id);
    if (store.get(playingAtom)) engine.setState(id, clock, appearanceClock);
    else {
      engine = createMascotEngine(store.get(lookAtom), id);
      clock = 0;
      appearanceClock = 0;
      appearanceUntil = -1;
      geometryUntil = -1;
      geometryAnimating = false;
      paintStart = -10;
    }
    draw();
  };
  const seek = (time: number) => {
    if (!Number.isFinite(time)) return;
    const steps = store.get(timelineAtom);
    const at = clamp(time, 0, store.get(durationAtom));
    const position = timelinePosition(steps, at);
    engine = createMascotEngine(store.get(lookAtom), steps[0].state);
    let start = 0;
    for (let i = 1; i <= position.index; i++) {
      start += steps[i - 1].duration;
      engine.setState(steps[i].state, start);
    }
    clock = at;
    appearanceClock = at;
    appearanceUntil = -1;
    geometryUntil = -1;
    geometryAnimating = false;
    paintStart = -10;
    sequenceStart = 0;
    store.set(elapsedAtom, at);
    store.set(activeStepAtom, position.index);
    store.set(stateAtom, steps[position.index].state);
    store.set(sequencingAtom, true);
    draw();
  };
  const tick = (ms: number) => {
    raf = null;
    if (
      !mounted ||
      (!store.get(playingAtom) && appearanceClock >= appearanceUntil) ||
      env.isHidden()
    )
      return;
    const delta =
      last === null ? 0 : Math.max(0, Math.min((ms - last) / 1000, 0.064));
    last = ms;
    appearanceClock += delta;
    const playing = store.get(playingAtom);
    if (playing) clock += delta * store.get(speedAtom);
    if (playing && store.get(sequencingAtom)) {
      const steps = store.get(timelineAtom);
      const duration = store.get(durationAtom);
      if (clock - sequenceStart >= duration) {
        sequenceStart += duration;
        engine.setState(steps[0].state, sequenceStart, appearanceClock);
        store.set(activeStepAtom, 0);
        store.set(stateAtom, steps[0].state);
      }
      const elapsed = clock - sequenceStart;
      const position = timelinePosition(steps, elapsed);
      if (position.index !== store.get(activeStepAtom)) {
        store.set(activeStepAtom, position.index);
        store.set(stateAtom, steps[position.index].state);
        engine.setState(
          steps[position.index].state,
          sequenceStart + position.start,
          appearanceClock,
        );
      }
      store.set(elapsedAtom, elapsed);
    }
    draw(playing || geometryAnimating);
    if (appearanceClock >= geometryUntil) geometryAnimating = false;
    if (playing || appearanceClock < appearanceUntil)
      raf = env.requestFrame(tick);
    else last = null;
  };
  const synchronize = () => {
    if (raf !== null) env.cancelFrame(raf);
    raf = null;
    last = null;
    if (
      mounted &&
      (store.get(playingAtom) || appearanceClock < appearanceUntil) &&
      !env.isHidden()
    )
      raf = env.requestFrame(tick);
  };
  const release = () => {
    engine.setLook(
      store.get(viewAtom) === "about"
        ? { yaw: -25, pitch: 0, mix: 1, spin: 0, wander: 0 }
        : null,
      store.get(playingAtom) ? clock : clock - 1,
    );
    draw();
  };
  const applyLook = () => {
    const look = store.get(lookAtom);
    const animated = !store.get(reducedMotionAtom);
    const at = animated ? appearanceClock : appearanceClock - 1;
    let geometryChanged = false;
    if (look.shape !== appliedLook.shape) {
      engine.setFigure(look.shape, at, clock);
      geometryChanged = true;
    }
    if (look.expression !== appliedLook.expression) {
      engine.setExpression(EXPRESSION_BY_ID.get(look.expression)!, at);
      geometryChanged = true;
    }
    if (look.eyes !== appliedLook.eyes) {
      engine.setEyes(look.eyes, at);
      geometryChanged = true;
    }
    if (
      Object.entries(look.eyeGeometry).some(
        ([key, value]) =>
          value !==
          appliedLook.eyeGeometry[key as keyof typeof look.eyeGeometry],
      )
    ) {
      engine.setEyeGeometry(
        look.eyeGeometry,
        store.get(previewEyeGeometryAtom) ? undefined : at,
      );
      geometryChanged = true;
    }
    const paintTargetChanged =
      look.color !== appliedLook.color || look.blush !== appliedLook.blush;
    appliedLook = look;
    const paint = store.get(paintAtom);
    const paintChanged =
      paint.color !== look.color || paint.blush !== Number(look.blush);
    if (paintChanged || paintTargetChanged) {
      paintFrom = paint;
      paintStart = at;
    }
    if (!geometryChanged && !paintChanged) return;
    if (geometryChanged) {
      geometryAnimating = animated && !store.get(previewEyeGeometryAtom);
      geometryUntil = geometryAnimating ? appearanceClock + 0.45 : -1;
    }
    if (animated && (geometryAnimating || paintChanged))
      appearanceUntil = appearanceClock + 0.45;
    draw(geometryChanged);
    // Retarget an active gesture without cancelling its existing frame clock.
    if (raf === null) synchronize();
  };
  const mount = () => {
    if (mounted) throw new Error("Le lecteur est déjà monté.");
    // Saved preferences are restored after hydration, before subscriptions or
    // persistence start. Initialize from that look without an entrance morph.
    if (appliedLook !== store.get(lookAtom)) {
      appliedLook = store.get(lookAtom);
      engine = createMascotEngine(appliedLook);
    }
    mounted = true;
    const cleanups = [
      store.sub(playingAtom, synchronize),
      store.sub(lookAtom, applyLook),
      store.sub(previewEyeGeometryAtom, () => {
        const geometry = store.get(previewEyeGeometryAtom);
        if (!geometry) return;
        engine.setEyeGeometry(geometry);
        draw();
      }),
      store.sub(timelineAtom, () => {
        if (store.get(sequencingAtom))
          seek(Math.min(store.get(elapsedAtom), store.get(durationAtom)));
      }),
      store.sub(followAtom, release),
      store.sub(boardAtom, () => {
        if (store.get(boardAtom)) store.set(playingAtom, false);
      }),
      store.sub(viewAtom, () => {
        const view = store.get(viewAtom);
        store.set(boardAtom, false);
        if (view !== "motion") {
          store.set(playingAtom, !store.get(reducedMotionAtom));
          choose("idle");
          if (view === "about") {
            engine.setLook(
              { yaw: -25, pitch: 0, mix: 1, spin: 0, wander: 0 },
              -1,
            );
            draw();
          } else release();
        } else store.set(playingAtom, false);
      }),
      store.sub(presetAtom, () => {
        try {
          env.save(JSON.stringify(store.get(presetAtom)));
        } catch {
          store.set(
            statusAtom,
            "Le navigateur ne permet pas de sauvegarder tes réglages.",
          );
        }
      }),
      env.onVisibility(synchronize),
      env.onMotion((reduced) => {
        store.set(reducedMotionAtom, reduced);
        if (reduced) {
          appearanceUntil = -1;
          store.set(playingAtom, false);
        } else if (store.get(viewAtom) !== "motion")
          store.set(playingAtom, true);
      }),
    ];
    draw();
    synchronize();
    return () => {
      mounted = false;
      if (raf !== null) env.cancelFrame(raf);
      raf = null;
      last = null;
      cleanups.forEach((cleanup) => cleanup());
    };
  };
  return {
    activateMotion: () => {
      if (store.get(viewAtom) === "motion")
        store.set(playingAtom, !store.get(reducedMotionAtom));
    },
    mount,
    choose,
    seek,
    release,
    next: (direction: number) => {
      const index = MOTION_IDS.indexOf(store.get(stateAtom));
      choose(
        MOTION_IDS[(index + direction + MOTION_IDS.length) % MOTION_IDS.length],
      );
    },
    playSequence: () => {
      seek(0);
      store.set(boardAtom, false);
      store.set(playingAtom, true);
    },
    aim: (
      event: { clientX: number; clientY: number; pointerType: string },
      rect: DOMRect,
    ) => {
      const about = store.get(viewAtom) === "about";
      const playing = store.get(playingAtom);
      if (
        (!store.get(followAtom) && !about) ||
        (!playing && !about) ||
        event.pointerType === "touch" ||
        !rect.width ||
        !rect.height
      )
        return;
      engine.setLook(
        {
          yaw:
            clamp(
              (event.clientX - rect.x - rect.width / 2) / (rect.width / 2),
              -1,
              1,
            ) * 40,
          pitch:
            -clamp(
              (event.clientY - rect.y - rect.height / 2) / (rect.height / 2),
              -1,
              1,
            ) * 30,
          mix: 1,
          spin: 0,
          wander: 0,
        },
        playing ? clock : clock - 1,
      );
      if (!playing) draw();
    },
  };
}

export type MascotPlayer = ReturnType<typeof createMascotPlayer>;
