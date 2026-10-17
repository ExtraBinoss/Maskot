import type { EyeStyle } from "./eye-styles";
import { clamp, lerp } from "./math";
import { PROFILE_SAMPLES } from "./profiles";
import {
  capsulePath,
  closedPath,
  profileFromPolygon,
  radiusAtAngle,
} from "./shape";

const STAR_PROFILE = profileFromPolygon(
  Array.from({ length: 10 }, (_, index) => {
    const angle = (index * Math.PI) / 5 - Math.PI / 2;
    const radius = index % 2 === 0 ? 1 : 0.45;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  }),
  0,
  0,
);

const polygon = (sides: number, inner = 1, rotation = -Math.PI / 2) =>
  profileFromPolygon(
    Array.from({ length: inner === 1 ? sides : sides * 2 }, (_, i) => {
      const angle =
        rotation + (i * Math.PI * 2) / (inner === 1 ? sides : sides * 2);
      const r = inner === 1 || i % 2 === 0 ? 1 : inner;
      return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
    }),
    0,
    0,
  );
const outline = (points: number[][]) =>
  profileFromPolygon(
    points.map(([x, y]) => ({ x, y })),
    0,
    0,
  );
const polygons: Partial<Record<EyeStyle, number[]>> = {
  star: STAR_PROFILE,
  triangle: polygon(3),
  hexagon: polygon(6),
  octagon: polygon(8),
  diamond: polygon(4),
  square: polygon(4, 1, Math.PI / 4),
  star4: polygon(4, 0.3),
  star6: polygon(6, 0.48),
  star8: polygon(8, 0.48),
  star12: polygon(12, 0.65),
  shield: outline([
    [-0.85, -0.8],
    [0.85, -0.8],
    [0.8, 0.25],
    [0, 1],
    [-0.8, 0.25],
  ]),
  chevron: outline([
    [-1, -0.8],
    [0, 0],
    [1, -0.8],
    [1, 0.2],
    [0, 1],
    [-1, 0.2],
  ]),
  kite: outline([
    [0, -1],
    [0.8, 0],
    [0, 1],
    [-0.45, 0],
  ]),
  bolt: outline([
    [0.1, -1],
    [-0.8, 0.2],
    [-0.15, 0.2],
    [-0.1, 1],
    [0.8, -0.2],
    [0.15, -0.2],
  ]),
  plus: outline([
    [-0.3, -1],
    [0.3, -1],
    [0.3, -0.3],
    [1, -0.3],
    [1, 0.3],
    [0.3, 0.3],
    [0.3, 1],
    [-0.3, 1],
    [-0.3, 0.3],
    [-1, 0.3],
    [-1, -0.3],
    [-0.3, -0.3],
  ]),
  cross: polygon(4, 0.36, Math.PI / 4),
  heart: profileFromPolygon(
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
  ),
};
const samples = Array.from({ length: PROFILE_SAMPLES }, (_, i) => {
  const angle = (i / PROFILE_SAMPLES) * Math.PI * 2;
  return { angle, x: Math.cos(angle), y: Math.sin(angle) };
});
function radial(style: EyeStyle, angle: number): number {
  const profile = polygons[style];
  if (profile) return radiusAtAngle(profile, angle);
  const c = Math.abs(Math.cos(angle)),
    s = Math.abs(Math.sin(angle));
  switch (style) {
    case "sparkle":
      return (c ** (2 / 3) + s ** (2 / 3)) ** -1.5;
    case "squircle":
      return (c ** 4 + s ** 4) ** -0.25 / 1.19;
    case "oval":
      return 1 / Math.sqrt((c * c) / 0.64 + s * s);
    case "drop":
      return 0.7 + 0.3 * Math.sin(angle);
    case "leaf":
      return 0.7 + 0.3 * Math.cos(2 * (angle + Math.PI / 4));
    case "arch":
      return Math.sin(angle) > 0 ? 0.65 : 1;
    case "sun":
      return 0.8 + 0.2 * Math.cos(12 * angle);
    case "flower4":
      return 0.76 + 0.24 * Math.cos(4 * angle);
    case "flower5":
      return 0.76 + 0.24 * Math.sin(5 * angle);
    case "flower6":
      return 0.76 + 0.24 * Math.cos(6 * angle);
    case "flower8":
      return 0.84 + 0.16 * Math.cos(8 * angle);
    case "gear":
      return Math.cos(10 * angle) > 0 ? 1 : 0.72;
    case "pebble":
      return 0.76 + 0.16 * Math.cos(angle) + 0.08 * Math.sin(2 * angle);
    default:
      return 1;
  }
}
// Profiles are built once. Every style retains the same 64-point morph topology.
const profiles = new Map<EyeStyle, number[]>();
function profileFor(style: EyeStyle) {
  let profile = profiles.get(style);
  if (!profile) {
    profile = samples.map(({ angle }) => radial(style, angle));
    profiles.set(style, profile);
  }
  return profile;
}
export type EyeStyleMix = ReadonlyArray<{ style: EyeStyle; weight: number }>;
export function blendEyeStyles(
  from: EyeStyle | EyeStyleMix,
  to: EyeStyle,
  mix: number,
): EyeStyle | EyeStyleMix {
  const t = clamp(mix);
  if (t >= 1) return to;
  const weights = new Map<EyeStyle, number>();
  for (const entry of typeof from === "string"
    ? [{ style: from, weight: 1 }]
    : from)
    weights.set(
      entry.style,
      (weights.get(entry.style) ?? 0) + entry.weight * (1 - t),
    );
  weights.set(to, (weights.get(to) ?? 0) + t);
  return [...weights]
    .filter(([, weight]) => weight > 1e-8)
    .map(([style, weight]) => ({ style, weight }));
}
export function eyeShapePath(
  width: number,
  height: number,
  from: EyeStyle | EyeStyleMix,
  to: EyeStyle,
  mix: number,
): string {
  const progress = clamp(mix);
  if (
    (to === "capsule" && progress === 1) ||
    (from === "capsule" && progress === 0)
  )
    return capsulePath(width, height);
  const radius = Math.min(width, height) / 2;
  const extension = Math.abs(width - height) / 2;
  const sources = (
    typeof from === "string" ? [{ style: from, weight: 1 }] : from
  ).map((entry) => ({ ...entry, profile: profileFor(entry.style) }));
  const bProfile = profileFor(to);
  return closedPath(
    samples.map(({ x, y }, i) => {
      const point = (style: EyeStyle, profile: number[]) => {
        if (style !== "capsule")
          return {
            x: (x * profile[i] * width) / 2,
            y: (y * profile[i] * height) / 2,
          };
        const along = Math.abs(width >= height ? x : y);
        const across = Math.abs(width >= height ? y : x);
        const r = across > 0 ? radius / across : Infinity;
        const distance =
          r * along <= extension
            ? r
            : extension * along +
              Math.sqrt(
                Math.max(0, radius ** 2 - extension ** 2 * across ** 2),
              );
        return { x: x * distance, y: y * distance };
      };
      const a = sources.reduce(
        (sum, entry) => {
          const p = point(entry.style, entry.profile);
          return {
            x: sum.x + p.x * entry.weight,
            y: sum.y + p.y * entry.weight,
          };
        },
        { x: 0, y: 0 },
      );
      const b = point(to, bProfile);
      return { x: lerp(a.x, b.x, progress), y: lerp(a.y, b.y, progress) };
    }),
  );
}
