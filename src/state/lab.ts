import { atom, createStore } from "jotai";
import type { StateId } from "../mascot/engine/bot-types";
import type {
  MascotLook,
  MascotPreset,
  MascotStep,
  PreviewSurface,
} from "../mascot/mascot-types";
import { createMascotEngine, timelineDuration } from "../mascot/mascot-catalog";
import {
  defaultPreset,
  parsePreset,
  PRESET_KEY,
} from "../mascot/mascot-storage";

export const presetAtom = atom<MascotPreset>(defaultPreset());
export const lookAtom = atom(
  (get) => get(presetAtom).look,
  (get, set, look: MascotLook) => set(presetAtom, { ...get(presetAtom), look }),
);
export const timelineAtom = atom(
  (get) => get(presetAtom).timeline,
  (get, set, timeline: MascotStep[]) =>
    set(presetAtom, { ...get(presetAtom), timeline }),
);
export const durationAtom = atom((get) => timelineDuration(get(timelineAtom)));
export const playingAtom = atom(true);
export const sequencingAtom = atom(false);
export const stateAtom = atom<StateId>("idle");
export const speedAtom = atom(1);
export const followAtom = atom(false);
export const elapsedAtom = atom(0);
export const activeStepAtom = atom(0);
export const frameAtom = atom(
  createMascotEngine(defaultPreset().look).sample(0),
);
export const reducedMotionAtom = atom(false);
export const boardAtom = atom(false);
export const surfaceAtom = atom<PreviewSurface>("paper");
export const statusAtom = atom("");
export type WorkspaceView = "static" | "motion" | "about";
export const viewAtom = atom<WorkspaceView>("static");
export const motionPanelAtom = atom<"movements" | "sequence">("movements");

export function createLabStore(
  readSaved: () => string | null,
  reducedMotion: boolean,
  view: WorkspaceView = "static",
) {
  const store = createStore();
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
  store.set(viewAtom, view);
  store.set(playingAtom, view === "motion" && !reducedMotion);
  store.set(reducedMotionAtom, reducedMotion);
  return store;
}

export type LabStore = ReturnType<typeof createLabStore>;
export { PRESET_KEY };
