import type { BotShape, BotColor } from "./bot-types";
import { PROFILE_SAMPLES } from "./profiles";
import {
  hullOfCircles,
  profileFromPolygon,
  regularPolygonProfile,
  superellipseProfile,
  unionOfCirclesProfile,
} from "./shape";

function normalize(radii: number[], max = 1): number[] {
  const peak = Math.max(...radii);
  if (peak <= 0) return radii;
  const k = max / peak;
  return radii.map((r) => r * k);
}
const ANGLES = Array.from(
  { length: PROFILE_SAMPLES },
  (_, i) => (i / PROFILE_SAMPLES) * Math.PI * 2,
);

const pebble = normalize(
  ANGLES.map(
    (a) => 1 + 0.075 * Math.cos(2 * a + 0.5) + 0.035 * Math.cos(3 * a + 2.1),
  ),
  1.02,
);

const cloud = normalize(
  unionOfCirclesProfile([
    { x: -0.44, y: 0.2, r: 0.54 },
    { x: 0.46, y: 0.2, r: 0.5 },
    { x: 0.02, y: 0.3, r: 0.6 },
    { x: -0.24, y: -0.3, r: 0.48 },
    { x: 0.3, y: -0.24, r: 0.44 },
  ]),
  1.02,
);

const droplet = normalize(
  profileFromPolygon(hullOfCircles(0, 0.28, 0.66, 0, -0.96, 0.05), 0, 0),
  1.04,
);

const capsule = profileFromPolygon(
  hullOfCircles(-0.42, 0, 0.62, 0.42, 0, 0.62),
  0,
  0,
);
export const SHAPES: BotShape[] = [
  { id: "cercle", radii: Array.from({ length: PROFILE_SAMPLES }, () => 1) },
  { id: "galet", radii: pebble },
  // 1.15 et pas 1.02 : sur une superellipse le rayon maximal est la diagonale,
  // donc normaliser dessus donne une forme qui parait plus petite que le cercle.
  { id: "squircle", radii: normalize(superellipseProfile(4.2), 1.15) },
  { id: "capsule", radii: capsule },
  // -90deg : un sommet vers le haut de l'ecran (y est oriente vers le bas)
  { id: "triangle", radii: regularPolygonProfile(3, 1.12, 0.34, -90) },
  // 0deg : sommets a gauche et a droite, donc aretes du haut et du bas plates
  { id: "hexagone", radii: regularPolygonProfile(6, 1.04, 0.26, 0) },
  { id: "nuage", radii: cloud },
  { id: "goutte", radii: droplet },
  {
    id: "ovale",
    radii: ANGLES.map(
      (a) =>
        1 / Math.sqrt((Math.cos(a) / 0.82) ** 2 + (Math.sin(a) / 1.12) ** 2),
    ),
  },
  {
    id: "oeuf",
    radii: normalize(
      ANGLES.map((a) => 1 + 0.16 * Math.sin(a) - 0.05 * Math.cos(2 * a)),
      1.1,
    ),
  },
  { id: "coussin", radii: normalize(superellipseProfile(2.8), 1.1) },
  {
    id: "rectangle",
    radii: normalize(
      superellipseProfile(6).map(
        (r, i) => r * (0.85 + 0.15 * Math.abs(Math.cos(ANGLES[i]))),
      ),
      1.17,
    ),
  },
  { id: "losange", radii: regularPolygonProfile(4, 1.12, 0.2, 0) },
  { id: "pentagone", radii: regularPolygonProfile(5, 1.08, 0.2, -90) },
  { id: "heptagone", radii: regularPolygonProfile(7, 1.04, 0.14, -90) },
  { id: "octogone", radii: regularPolygonProfile(8, 1.04, 0.1, 22.5) },
  { id: "nonagone", radii: regularPolygonProfile(9, 1.04, 0.1, -90) },
  { id: "decagone", radii: regularPolygonProfile(10, 1.04, 0.08, 0) },
  {
    id: "coeur",
    radii: normalize(
      profileFromPolygon(
        Array.from({ length: 96 }, (_, i) => {
          const t = (i / 96) * Math.PI * 2;
          return {
            x: Math.sin(t) ** 3,
            y:
              -(
                13 * Math.cos(t) -
                5 * Math.cos(2 * t) -
                2 * Math.cos(3 * t) -
                Math.cos(4 * t)
              ) / 17,
          };
        }),
        0,
        0,
      ).map((r) => 0.15 + 0.85 * r),
      1.14,
    ),
  },
  ...([4, 5, 6, 8] as const).map((n) => ({
    id: `etoile${n}` as "etoile4" | "etoile5" | "etoile6" | "etoile8",
    radii: ANGLES.map((a) => 1 + 0.17 * Math.cos(n * (a + Math.PI / 2))),
  })),
  ...([4, 5, 6, 8] as const).map((n) => ({
    id: `fleur${n}` as "fleur4" | "fleur5" | "fleur6" | "fleur8",
    radii: ANGLES.map((a) => 1 + 0.1 * Math.sin(n * a)),
  })),
  {
    id: "haricot",
    radii: normalize(
      ANGLES.map((a) => 1 + 0.15 * Math.cos(a) + 0.08 * Math.sin(2 * a)),
      1.12,
    ),
  },
  {
    id: "cacahuete",
    radii: normalize(
      ANGLES.map((a) => 1 + 0.2 * Math.cos(2 * a)),
      1.18,
    ),
  },
  {
    id: "fantome",
    radii: normalize(
      ANGLES.map(
        (a) =>
          1 +
          0.08 * Math.sin(a) +
          0.1 * Math.max(0, Math.sin(a)) * Math.cos(5 * a),
      ),
      1.1,
    ),
  },
  { id: "montagne", radii: regularPolygonProfile(3, 1.14, 0.58, -90) },
  {
    id: "vague",
    radii: normalize(
      ANGLES.map(
        (a) => 1 + 0.11 * Math.sin(3 * a + 0.8) + 0.04 * Math.cos(5 * a),
      ),
      1.12,
    ),
  },
];
// Map indexee par `string` et non par `ShapeId` : les appelants interrogent avec
// une valeur relue du localStorage ou d'une prop, donc non validee.
export const SHAPE_BY_ID = new Map<string, BotShape>(
  SHAPES.map((s) => [s.id, s]),
);
export const DEFAULT_SHAPE = "cercle";

export const COLORS: BotColor[] = [
  { id: "encre", hex: "#0a0a0c" },
  { id: "brun", hex: "#8b5e3c" },
  { id: "rouge", hex: "#e8483f" },
  { id: "orange", hex: "#f08a24" },
  { id: "ambre", hex: "#f0b429" },
  { id: "vert", hex: "#3ecf8e" },
  { id: "turquoise", hex: "#2fbfa0" },
  { id: "bleu", hex: "#3b93f0" },
  { id: "violet", hex: "#8b5cf6" },
  { id: "rose", hex: "#e152b0" },
  { id: "gris", hex: "#a3a3a3" },
  { id: "creme", hex: "#f1efe9" },
];
export const COLOR_BY_ID = new Map<string, BotColor>(
  COLORS.map((c) => [c.id, c]),
);
export const DEFAULT_COLOR = "encre";

export function mixHex(from: string, to: string, t: number): string {
  const parse = (h: string) => {
    const v = parseInt(h.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  };
  const a = parse(from);
  const b = parse(to);
  const c = a.map((x, i) => Math.round(x + (b[i]! - x) * t));
  return `#${c.map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
