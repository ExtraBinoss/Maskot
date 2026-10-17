import type { BotFrame, DotRender, ShapeId } from "./engine/bot-types";
import {
  point,
  circlePath as circle,
  polygonPath as contour,
  capsulePath,
  ringPath as ring,
  questionPath,
  crescentPath,
  infinityPath,
} from "./vector-path";
import { MODE_FRAMES } from "./thinking-orbs/engine/registry";
import { resolvePreset } from "./thinking-orbs/presets";
import type { OrbState } from "./thinking-orbs/types";

export const SYMBOLS = [
  { id: "symbol-exclamation", label: "Exclamation" },
  { id: "symbol-question", label: "Question" },
  { id: "symbol-plus", label: "Addition" },
  { id: "symbol-cross", label: "Croix douce" },
  { id: "symbol-bolt", label: "Éclair" },
  { id: "symbol-check", label: "Validation" },
  { id: "symbol-loading", label: "Chargement", animated: true },
  { id: "symbol-ring", label: "Anneau" },
  { id: "symbol-crescent", label: "Croissant" },
  { id: "symbol-infinity", label: "Infini" },
  { id: "symbol-dots", label: "Trois points", animated: true },
  { id: "symbol-equalizer", label: "Égaliseur", animated: true },
  { id: "symbol-wave", label: "Onde", animated: true },
  { id: "symbol-target", label: "Cible" },
  { id: "symbol-atom", label: "Atome", animated: true },
  { id: "symbol-hourglass", label: "Sablier" },
] as const;
export const ANIMATED_SYMBOLS = SYMBOLS.filter(
  (symbol): symbol is Extract<(typeof SYMBOLS)[number], { animated: true }> =>
    "animated" in symbol,
);
export const ORBS = [
  { id: "orb-working", label: "Orbe · Travail", state: "working" },
  { id: "orb-searching", label: "Orbe · Recherche", state: "searching" },
  { id: "orb-solving", label: "Orbe · Résolution", state: "solving" },
  { id: "orb-listening", label: "Orbe · Écoute", state: "listening" },
  { id: "orb-connecting", label: "Orbe · Connexion", state: "connecting" },
  { id: "orb-weaving", label: "Orbe · Tressage", state: "weaving" },
  { id: "orb-composing", label: "Orbe · Composition", state: "composing" },
  { id: "orb-breathing", label: "Orbe · Respiration", state: "breathing" },
  { id: "orb-shaping", label: "Orbe · Métamorphose", state: "shaping" },
] as const satisfies readonly { id: string; label: string; state: OrbState }[];
export type FigureId =
  | (typeof SYMBOLS)[number]["id"]
  | (typeof ORBS)[number]["id"];
export type MascotShapeId = ShapeId | FigureId;
export const FIGURES = [...SYMBOLS, ...ORBS];
const byId = new Map<string, (typeof FIGURES)[number]>(
  FIGURES.map((entry) => [entry.id, entry]),
);
export const isFigure = (id: string): id is FigureId => byId.has(id);
const TAU = Math.PI * 2;
const hiddenBody = circle(0, 0, 0);
const dot = (x: number, y: number, r: number, opacity = 1): DotRender => ({
  x,
  y,
  r,
  opacity,
});

export function figureFrame(id: FigureId, time: number): BotFrame {
  let bodyPath = hiddenBody;
  let bodyAlpha = 1;
  let dots: DotRender[] = [];
  if (id.startsWith("orb-")) {
    const entry = ORBS.find((orb) => orb.id === id)!;
    const { mode, speed, opts } = resolvePreset(entry.state, 64);
    const frame = MODE_FRAMES[mode](220, time * speed, opts);
    bodyAlpha = 0;
    dots = frame.dots.map((d) =>
      dot(d.x - 110, d.y - 110, d.r, (d.a ?? 1) * (1 - d.white * 0.75)),
    );
    // Preserve the connecting mode's web as short dot strokes in the SVG.
    for (const line of frame.lines) {
      const n = Math.max(
        2,
        Math.ceil(Math.hypot(line.x2 - line.x1, line.y2 - line.y1) / 3),
      );
      for (let i = 0; i < n; i++) {
        const k = i / (n - 1);
        dots.push(
          dot(
            line.x1 + (line.x2 - line.x1) * k - 110,
            line.y1 + (line.y2 - line.y1) * k - 110,
            line.w / 2,
            (line.a ?? 1) * (1 - line.white * 0.75),
          ),
        );
      }
    }
  } else {
    switch (id) {
      case "symbol-exclamation":
        bodyPath = capsulePath(point(0, -87), point(0, 25), 18);
        dots = [dot(0, 77, 20)];
        break;
      case "symbol-question":
        bodyPath = questionPath();
        dots = [dot(0, 77, 17)];
        break;
      case "symbol-plus":
      case "symbol-cross": {
        const points = [
          [-20, -94],
          [20, -94],
          [20, -20],
          [94, -20],
          [94, 20],
          [20, 20],
          [20, 94],
          [-20, 94],
          [-20, 20],
          [-94, 20],
          [-94, -20],
          [-20, -20],
        ];
        const a = id === "symbol-cross" ? Math.PI / 4 : 0;
        bodyPath = contour(
          points.map(([x, y]) =>
            point(
              x * Math.cos(a) - y * Math.sin(a),
              x * Math.sin(a) + y * Math.cos(a),
            ),
          ),
        );
        break;
      }
      case "symbol-bolt":
        bodyPath = contour(
          [
            [-5, -105],
            [-76, 16],
            [-14, 16],
            [-34, 105],
            [80, -22],
            [15, -22],
            [37, -105],
          ].map(([x, y]) => point(x, y)),
        );
        break;
      case "symbol-check":
        bodyPath = contour(
          [
            [-96, -2],
            [-74, -25],
            [-20, 28],
            [78, -82],
            [102, -60],
            [-19, 81],
          ].map(([x, y]) => point(x, y)),
          4,
        );
        break;
      case "symbol-loading":
        bodyPath = ring(91, 20, time * 2, Math.PI * 1.45);
        break;
      case "symbol-ring":
        bodyPath = ring(94, 25);
        break;
      case "symbol-crescent":
        bodyPath = crescentPath();
        break;
      case "symbol-infinity":
        bodyPath = infinityPath();
        break;
      case "symbol-dots":
        bodyAlpha = 0;
        dots = [-65, 0, 65].map((x, i) =>
          dot(x, -Math.sin(time * 3 - i * 0.7) * 13, 19),
        );
        break;
      case "symbol-equalizer":
      case "symbol-wave": {
        bodyAlpha = 0;
        for (let i = 0; i < 7; i++) {
          const height =
            18 +
            (id === "symbol-wave"
              ? Math.sin(time * 3 + i * 0.9) * 0.5 + 0.5
              : Math.abs(Math.sin(time * 2 + i * 1.6))) *
              63;
          const x = (i - 3) * 27;
          dots.push({
            ...dot(0, 0, 0),
            d: capsulePath(
              point(x / 100, -height / 100),
              point(x / 100, height / 100),
              0.065,
            ),
          });
        }
        break;
      }
      case "symbol-target":
        bodyPath = ring(96, 14);
        dots = [{ ...dot(0, 0, 0), d: ring(0.61, 0.14) }, dot(0, 0, 20)];
        break;
      case "symbol-atom": {
        bodyPath = circle(0, 0, 16);
        for (let orbit = 0; orbit < 3; orbit++)
          for (let i = 0; i < 96; i++) {
            const a = (i / 96) * TAU,
              tilt = (orbit / 3) * Math.PI + time * 0.15;
            const x = Math.cos(a) * 100,
              y = Math.sin(a) * 35;
            dots.push(
              dot(
                x * Math.cos(tilt) - y * Math.sin(tilt),
                x * Math.sin(tilt) + y * Math.cos(tilt),
                1.8,
              ),
            );
          }
        break;
      }
      case "symbol-hourglass":
        bodyPath = contour(
          [
            [-65, -93],
            [65, -93],
            [65, -64],
            [17, 0],
            [65, 64],
            [65, 93],
            [-65, 93],
            [-65, 64],
            [-17, 0],
            [-65, -64],
          ].map(([x, y]) => point(x, y)),
        );
        break;
    }
  }
  return {
    bodyPath,
    bodyAlpha,
    eyes: [],
    dots,
    dotsBehind: false,
    arcs: [],
    notif: null,
    notch: null,
  };
}
