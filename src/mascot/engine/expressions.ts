import type { BotExpression, EyeCfg } from "./bot-types";
import { EYE_H, EYE_SPLIT, EYE_W, REST_GAZE } from "./face";
import { lerp } from "./math";

const eye = (w: number, h: number, tilt = 0, open = 1): EyeCfg => ({
  w,
  h,
  tilt,
  open,
});

const pair = (w: number, h: number, tilt = 0, open = 1): [EyeCfg, EyeCfg] => [
  eye(w, h, tilt, open),
  eye(w, h, -tilt, open),
];
export const EXPRESSIONS: BotExpression[] = [
  {
    // la pose relevée image par image sur la vidéo de référence
    id: "neutre",
    gaze: { ...REST_GAZE },
    split: EYE_SPLIT,
    eyes: [eye(EYE_W, EYE_H), eye(EYE_W, EYE_H)],
  },
  {
    id: "attentif",
    gaze: { yaw: 4, pitch: 5, roll: -4 },
    split: 16,
    eyes: pair(0.21, 0.44),
  },
  {
    id: "surpris",
    gaze: { yaw: 3, pitch: -3, roll: 0 },
    split: 19,
    eyes: pair(0.45, 0.47),
  },
  {
    id: "excite",
    gaze: { yaw: 6, pitch: -14, roll: 0 },
    split: 19.5,
    eyes: pair(0.4, 0.56, -10),
  },
  {
    // yeux plissés en arc : les hauts convergent légèrement
    id: "heureux",
    gaze: { yaw: 5, pitch: 9, roll: 0 },
    split: 17,
    eyes: pair(0.27, 0.17, 14),
  },
  {
    id: "hilare",
    gaze: { yaw: 4, pitch: 14, roll: 0 },
    split: 18,
    eyes: pair(0.34, 0.13, 20),
  },
  {
    // hauts des yeux qui convergent fort vers le centre + yeux étrécis
    id: "colere",
    gaze: { yaw: 3, pitch: 7, roll: 0 },
    split: 17,
    eyes: pair(0.34, 0.15, 30),
  },
  {
    // l'inverse : les hauts divergent, et le regard tombe
    id: "triste",
    gaze: { yaw: 3, pitch: -13, roll: 0 },
    split: 16,
    eyes: pair(0.22, 0.4, -28),
  },
  {
    id: "effraye",
    gaze: { yaw: 2, pitch: -20, roll: 0 },
    split: 20.5,
    eyes: pair(0.4, 0.6),
  },
  {
    // un œil franchement plus fermé que l'autre
    id: "mefiant",
    gaze: { yaw: 12, pitch: 6, roll: -6 },
    split: 16,
    eyes: [eye(0.21, 0.4), eye(0.22, 0.15)],
  },
  {
    // asymétrique sur les deux axes : tailles ET inclinaisons dépareillées.
    // L'œil plissé est volontairement plat (rapport 1,6) : à un rapport proche
    // de 1 il serait rond, et son inclinaison ne se verrait pas.
    id: "confus",
    gaze: { yaw: -14, pitch: 3, roll: 8 },
    split: 16.5,
    eyes: [eye(0.2, 0.44, -18), eye(0.28, 0.17, 14)],
  },
  {
    // la tête penche : c'est le roulis qui porte la curiosité
    id: "curieux",
    gaze: { yaw: 16, pitch: -9, roll: -15 },
    split: 16.5,
    eyes: [eye(0.24, 0.46, -8), eye(0.2, 0.38, -8)],
  },
  {
    id: "fier",
    gaze: { yaw: 5, pitch: 17, roll: 0 },
    split: 17,
    eyes: pair(0.3, 0.15, 18),
  },
  {
    id: "timide",
    gaze: { yaw: -19, pitch: -14, roll: -7 },
    split: 14,
    eyes: pair(0.17, 0.3),
  },
  {
    // fentes horizontales et regard qui part sur le côté
    id: "blase",
    gaze: { yaw: -22, pitch: 2, roll: 0 },
    split: 16,
    eyes: pair(0.3, 0.12),
  },
  {
    // paupières à moitié tombées : on passe par `open`, donc l'écrasement
    // vertical à l'écran, le même mécanisme que le clignement
    id: "somnolent",
    gaze: { yaw: 6, pitch: -9, roll: -3 },
    split: 16,
    eyes: pair(0.2, 0.42, 0, 0.42),
  },
  {
    id: "amuse",
    gaze: { yaw: 10, pitch: 10, roll: 8 },
    split: 17.5,
    eyes: pair(0.29, 0.21, 12),
  },
  {
    id: "complice",
    gaze: { yaw: 12, pitch: 3, roll: -8 },
    split: 16,
    eyes: [eye(0.23, 0.42), eye(0.3, 0.2, -14, 0.12)],
  },
  {
    id: "charmeur",
    gaze: { yaw: -12, pitch: 6, roll: 10 },
    split: 16,
    eyes: [eye(0.3, 0.2, 14, 0.15), eye(0.23, 0.4, -8)],
  },
  {
    id: "determine",
    gaze: { yaw: 0, pitch: 10, roll: 0 },
    split: 17,
    eyes: pair(0.34, 0.17, 24),
  },
  {
    id: "concentre",
    gaze: { yaw: 0, pitch: -4, roll: -3 },
    split: 14,
    eyes: pair(0.17, 0.3, 5),
  },
  {
    id: "reveur",
    gaze: { yaw: -16, pitch: 18, roll: -12 },
    split: 17,
    eyes: pair(0.23, 0.35, -5, 0.65),
  },
  {
    id: "inquiet",
    gaze: { yaw: 9, pitch: -16, roll: 7 },
    split: 15,
    eyes: [eye(0.2, 0.43, -22), eye(0.21, 0.38, 28)],
  },
  {
    id: "sceptique",
    gaze: { yaw: -14, pitch: 6, roll: 9 },
    split: 17,
    eyes: [eye(0.29, 0.15, 14), eye(0.2, 0.43, -5)],
  },
  {
    id: "impatient",
    gaze: { yaw: 22, pitch: -4, roll: -4 },
    split: 17,
    eyes: pair(0.29, 0.18, 8),
  },
  {
    id: "epuise",
    gaze: { yaw: -4, pitch: -18, roll: 10 },
    split: 16,
    eyes: [eye(0.27, 0.35, -12, 0.28), eye(0.23, 0.4, 8, 0.2)],
  },
  {
    id: "paisible",
    gaze: { yaw: 0, pitch: 7, roll: 3 },
    split: 16,
    eyes: pair(0.2, 0.3, -8, 0.12),
  },
  {
    id: "boudeur",
    gaze: { yaw: -24, pitch: -8, roll: -10 },
    split: 15,
    eyes: pair(0.32, 0.17, 24),
  },
  {
    id: "ebloui",
    gaze: { yaw: 0, pitch: 18, roll: -5 },
    split: 20,
    eyes: pair(0.38, 0.5, -4),
  },
  {
    id: "malicieux",
    gaze: { yaw: 16, pitch: 8, roll: -12 },
    split: 17.5,
    eyes: [eye(0.3, 0.17, 22), eye(0.22, 0.32, -12)],
  },
  {
    id: "intrigue",
    gaze: { yaw: -8, pitch: 12, roll: 18 },
    split: 16,
    eyes: [eye(0.28, 0.46, -6), eye(0.18, 0.34, -14)],
  },
  {
    id: "nostalgique",
    gaze: { yaw: -18, pitch: -6, roll: 9 },
    split: 15,
    eyes: pair(0.21, 0.35, -16, 0.7),
  },
];
export const EXPRESSION_BY_ID = new Map<string, BotExpression>(
  EXPRESSIONS.map((e) => [e.id, e]),
);
export const DEFAULT_EXPRESSION = "neutre";
const lerpEyeCfg = (a: EyeCfg, b: EyeCfg, t: number): EyeCfg => ({
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
  tilt: lerp(a.tilt ?? 0, b.tilt ?? 0, t),
  open: lerp(a.open, b.open, t),
});

export function blendExpression(
  a: BotExpression,
  b: BotExpression,
  t: number,
): BotExpression {
  return {
    id: b.id,
    gaze: {
      yaw: lerp(a.gaze.yaw, b.gaze.yaw, t),
      pitch: lerp(a.gaze.pitch, b.gaze.pitch, t),
      roll: lerp(a.gaze.roll, b.gaze.roll, t),
    },
    split: lerp(a.split, b.split, t),
    eyes: [
      lerpEyeCfg(a.eyes[0], b.eyes[0], t),
      lerpEyeCfg(a.eyes[1], b.eyes[1], t),
    ],
  };
}
