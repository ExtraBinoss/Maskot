import { StudioEngine } from "./studio-engine";
import { EXPRESSION_BY_ID } from "./engine/expressions";
import { RAYON } from "./engine/repere";
import { DEFAULT_EYE_GEOMETRY } from "./engine/eye-geometry";
import type { ExpressionId, ShapeId, StateId } from "./engine/bot-types";
import type { MascotLook, MascotStep } from "./mascot-types";

export const DEFAULT_LOOK: MascotLook = {
  shape: "cercle",
  color: "#2563eb",
  expression: "neutre",
  eyes: "capsule",
  blush: false,
  eyeGeometry: { ...DEFAULT_EYE_GEOMETRY },
};
export const DEFAULT_TIMELINE: MascotStep[] = [
  { state: "idle", duration: 2 },
  { state: "thinking", duration: 2 },
  { state: "orbit", duration: 3 },
  { state: "wink", duration: 2 },
];
export const STATE_LABELS: Record<StateId, string> = {
  idle: "Au repos",
  thinking: "Réflexion",
  wink: "Clin d’œil",
  wide: "Émerveillement",
  alert: "Attention",
  notify: "Notification",
  exclaim: "Eurêka !",
  sleep: "Sommeil",
  egg: "Petit œuf",
  hexagon: "Hexagone",
  play: "Lecture",
  orbit: "En orbite",
  burst: "Confettis",
  comet: "Comète",
  swirl: "Tourbillon",
};
export const SHAPE_LABELS: Record<ShapeId, string> = {
  cercle: "Bulle",
  galet: "Galet",
  squircle: "Coussin",
  capsule: "Mochi",
  triangle: "Triangle",
  hexagone: "Hexagone",
  nuage: "Nuage",
  goutte: "Goutte",
  ovale: "Ovale",
  oeuf: "Œuf",
  coussin: "Doudou",
  rectangle: "Rectangle",
  losange: "Losange",
  pentagone: "Pentagone",
  heptagone: "Heptagone",
  octogone: "Octogone",
  nonagone: "Nonagone",
  decagone: "Décagone",
  coeur: "Cœur",
  etoile4: "Étoile douce",
  etoile5: "Astro",
  etoile6: "Cristal",
  etoile8: "Éclat",
  fleur4: "Trèfle",
  fleur5: "Fleur",
  fleur6: "Pivoine",
  fleur8: "Dahlia",
  haricot: "Haricot",
  cacahuete: "Cacahuète",
  fantome: "Fantôme",
  montagne: "Montagne",
  vague: "Vague",
};
export const EXPRESSION_LABELS: Record<ExpressionId, string> = {
  neutre: "Neutre",
  attentif: "Attentif",
  surpris: "Émerveillé",
  excite: "Excité",
  heureux: "Heureux",
  hilare: "Hilare",
  colere: "Fâché",
  triste: "Triste",
  effraye: "Effrayé",
  mefiant: "Méfiant",
  confus: "Confus",
  curieux: "Curieux",
  fier: "Fier",
  timide: "Timide",
  blase: "Blasé",
  somnolent: "Endormi",
  amuse: "Amusé",
  complice: "Complice",
  charmeur: "Charmeur",
  determine: "Déterminé",
  concentre: "Concentré",
  reveur: "Rêveur",
  inquiet: "Inquiet",
  sceptique: "Sceptique",
  impatient: "Impatient",
  epuise: "Épuisé",
  paisible: "Paisible",
  boudeur: "Boudeur",
  ebloui: "Ébloui",
  malicieux: "Malicieux",
  intrigue: "Intrigué",
  nostalgique: "Nostalgique",
};
export const PALETTE = [
  "#ff5a1f",
  "#f0b429",
  "#e8483f",
  "#e152b0",
  "#8b5cf6",
  "#2563eb",
  "#2fbfa0",
  "#3ecf8e",
  "#8b5e3c",
  "#a3a3a3",
  "#f1efe9",
  "#0a0a0c",
];

export function createMascotEngine(
  look: MascotLook,
  state: StateId = "idle",
): StudioEngine {
  const engine = new StudioEngine(
    RAYON,
    state,
    look.shape,
    EXPRESSION_BY_ID.get(look.expression)!,
  );
  engine.setEyes(look.eyes, -1);
  engine.setEyeGeometry(look.eyeGeometry);
  return engine;
}

export function timelineDuration(steps: MascotStep[]): number {
  return steps.reduce((total, step) => total + step.duration, 0);
}

export function timelinePosition(
  steps: MascotStep[],
  time: number,
): { index: number; offset: number; start: number } {
  let start = 0;
  for (let index = 0; index < steps.length; index++) {
    const step = steps[index]!;
    if (time < start + step.duration || index === steps.length - 1) {
      return { index, offset: Math.max(0, time - start), start };
    }
    start += step.duration;
  }
  return { index: -1, offset: 0, start: 0 };
}
