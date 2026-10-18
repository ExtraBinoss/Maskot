import { atom, createStore } from "jotai";
import type { EyeGeometry } from "../mascot/engine/bot-types";
import type { MotionId } from "../mascot/motion-types";
import type {
  MascotLook,
  MascotPreset,
  MascotStep,
} from "../mascot/mascot-types";
import { createMascotEngine, timelineDuration } from "../mascot/mascot-catalog";
import {
  defaultPreset,
  parsePreset,
  PRESET_KEY,
} from "../mascot/mascot-storage";

const presetValueAtom = atom<MascotPreset>(defaultPreset());
type TimelineHistory = { past: MascotStep[][]; future: MascotStep[][] };
const timelineHistoryAtom = atom<TimelineHistory>({ past: [], future: [] });
const timelineGestureAtom = atom<MascotStep[] | null>(null);
const sameTimeline = (a: MascotStep[], b: MascotStep[]) =>
  a.length === b.length &&
  a.every(
    (step, i) => step.state === b[i].state && step.duration === b[i].duration,
  );
export const presetAtom = atom(
  (get) => get(presetValueAtom),
  (get, set, preset: MascotPreset) => {
    if (!sameTimeline(get(presetValueAtom).timeline, preset.timeline)) {
      set(timelineHistoryAtom, { past: [], future: [] });
      set(timelineGestureAtom, null);
    }
    set(presetValueAtom, preset);
  },
);
export const lookAtom = atom(
  (get) => get(presetAtom).look,
  (get, set, look: MascotLook) => set(presetAtom, { ...get(presetAtom), look }),
);
export const timelineAtom = atom(
  (get) => get(presetAtom).timeline,
  (get, set, timeline: MascotStep[]) => {
    const preset = get(presetValueAtom);
    if (sameTimeline(preset.timeline, timeline)) return;
    if (!get(timelineGestureAtom)) {
      const { past } = get(timelineHistoryAtom);
      set(timelineHistoryAtom, {
        past: [...past.slice(-99), preset.timeline],
        future: [],
      });
    }
    set(presetValueAtom, { ...preset, timeline });
  },
);
export const beginTimelineEditAtom = atom(null, (get, set) => {
  if (!get(timelineGestureAtom)) set(timelineGestureAtom, get(timelineAtom));
});
export const finishTimelineEditAtom = atom(null, (get, set, cancel = false) => {
  const before = get(timelineGestureAtom);
  if (!before) return;
  set(timelineGestureAtom, null);
  if (cancel)
    set(presetValueAtom, { ...get(presetValueAtom), timeline: before });
  else if (!sameTimeline(before, get(timelineAtom))) {
    const { past } = get(timelineHistoryAtom);
    set(timelineHistoryAtom, {
      past: [...past.slice(-99), before],
      future: [],
    });
  }
});
export const canUndoTimelineAtom = atom(
  (get) => get(timelineHistoryAtom).past.length > 0,
);
export const canRedoTimelineAtom = atom(
  (get) => get(timelineHistoryAtom).future.length > 0,
);
export const undoTimelineAtom = atom(null, (get, set) => {
  if (get(timelineGestureAtom)) return;
  const { past, future } = get(timelineHistoryAtom);
  if (!past.length) return;
  set(timelineHistoryAtom, {
    past: past.slice(0, -1),
    future: [get(timelineAtom), ...future],
  });
  set(presetValueAtom, {
    ...get(presetValueAtom),
    timeline: past[past.length - 1],
  });
});
export const redoTimelineAtom = atom(null, (get, set) => {
  if (get(timelineGestureAtom)) return;
  const { past, future } = get(timelineHistoryAtom);
  if (!future.length) return;
  set(timelineHistoryAtom, {
    past: [...past, get(timelineAtom)],
    future: future.slice(1),
  });
  set(presetValueAtom, { ...get(presetValueAtom), timeline: future[0] });
});
export const durationAtom = atom((get) => timelineDuration(get(timelineAtom)));
export const playingAtom = atom(true);
export const sequencingAtom = atom(false);
export const stateAtom = atom<MotionId>("idle");
export const speedAtom = atom(1);
export const followAtom = atom(false);
export const elapsedAtom = atom(0);
export const activeStepAtom = atom(0);
export const paintAtom = atom({
  color: defaultPreset().look.color,
  blush: Number(defaultPreset().look.blush),
});
// Picker drags preview only the live artwork; catalogs and persistence update
// once the gesture is committed.
export const previewColorAtom = atom<string | null>(null);
export const commitColorAtom = atom(null, (get, set, color: string) => {
  set(paintAtom, { ...get(paintAtom), color });
  const look = get(lookAtom);
  if (look.color !== color) set(lookAtom, { ...look, color });
  set(previewColorAtom, null);
});
// Continuous eye edits bypass the catalog and persistence until release.
export const previewEyeGeometryAtom = atom<EyeGeometry | null>(null);
export const commitEyeGeometryAtom = atom(
  null,
  (get, set, geometry: EyeGeometry) => {
    set(lookAtom, { ...get(lookAtom), eyeGeometry: geometry });
    set(previewEyeGeometryAtom, null);
  },
);
export const frameAtom = atom(
  createMascotEngine(defaultPreset().look).sample(0),
);
export const reducedMotionAtom = atom(false);
export const boardAtom = atom(false);
export const statusAtom = atom<
  string | { key: string; values: Record<string, string | number> }
>("");
export type WorkspaceView = "static" | "motion" | "about";
export const viewAtom = atom<WorkspaceView>("static");
export const motionPanelAtom = atom<"movements" | "sequence">("movements");

export function createLabStore(
  readSaved: () => string | null,
  reducedMotion: boolean,
  view: WorkspaceView = "static",
) {
  const store = createStore();
  restoreLabStore(store, readSaved, reducedMotion);
  store.set(viewAtom, view);
  return store;
}

// The browser calls this only after the deterministic build-time tree hydrates.
// No storage subscription is mounted yet, so restoring never saves defaults.
export function restoreLabStore(
  store: LabStore,
  readSaved: () => string | null,
  reducedMotion: boolean,
) {
  let preset = defaultPreset();
  try {
    const saved = readSaved();
    if (saved) preset = parsePreset(saved);
  } catch {
    store.set(
      statusAtom,
      "Le look enregistré n’a pas pu être relu. Les réglages par défaut sont affichés.",
    );
  }
  store.set(presetAtom, preset);
  store.set(frameAtom, createMascotEngine(preset.look).sample(0));
  store.set(paintAtom, {
    color: preset.look.color,
    blush: Number(preset.look.blush),
  });
  store.set(playingAtom, !reducedMotion);
  store.set(reducedMotionAtom, reducedMotion);
}

export type LabStore = ReturnType<typeof createLabStore>;
export { PRESET_KEY };
