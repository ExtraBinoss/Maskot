import type { BotFrame, DotRender, Point, ShapeId } from "./engine/bot-types";
import { closedPath } from "./engine/shape";
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
  { id: "symbol-loading", label: "Chargement" },
  { id: "symbol-ring", label: "Anneau" },
  { id: "symbol-crescent", label: "Croissant" },
  { id: "symbol-infinity", label: "Infini" },
  { id: "symbol-dots", label: "Trois points" },
  { id: "symbol-equalizer", label: "Égaliseur" },
  { id: "symbol-wave", label: "Onde" },
  { id: "symbol-target", label: "Cible" },
  { id: "symbol-atom", label: "Atome" },
  { id: "symbol-hourglass", label: "Sablier" },
] as const;
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
  (typeof SYMBOLS)[number]["id"] | (typeof ORBS)[number]["id"];
export type MascotShapeId = ShapeId | FigureId;
export const FIGURES = [...SYMBOLS, ...ORBS];
const byId = new Map<string, (typeof FIGURES)[number]>(
  FIGURES.map((entry) => [entry.id, entry]),
);
export const isFigure = (id: string): id is FigureId => byId.has(id);
const TAU = Math.PI * 2;
const point = (x: number, y: number): Point => ({ x, y });

// Every solid outline has the same 64-cubic topology as the mascot body.
// Contours are sampled by arc length so symbols morph as geometry too.
function contour(points: Point[]): string {
  const lengths = points.map((p, i) =>
    Math.hypot(
      p.x - points[(i + 1) % points.length].x,
      p.y - points[(i + 1) % points.length].y,
    ),
  );
  const total = lengths.reduce((sum, length) => sum + length, 0);
  if (!total) return closedPath(Array.from({ length: 64 }, () => point(0, 0)));
  let segment = 0,
    start = 0;
  return closedPath(
    Array.from({ length: 64 }, (_, i) => {
      const distance = (i / 64) * total;
      while (segment < points.length - 1 && start + lengths[segment] < distance)
        start += lengths[segment++];
      const a = points[segment],
        b = points[(segment + 1) % points.length];
      const t = (distance - start) / (lengths[segment] || 1);
      return point(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
    }),
  );
}
const circle = (cx: number, cy: number, r: number) =>
  contour(
    Array.from({ length: 96 }, (_, i) =>
      point(
        cx + Math.cos((i / 96) * TAU) * r,
        cy + Math.sin((i / 96) * TAU) * r,
      ),
    ),
  );
function tube(points: Point[], radius: number): string {
  const normals = points.map((_, i) => {
    const a = points[Math.max(0, i - 1)],
      b = points[Math.min(points.length - 1, i + 1)];
    const angle = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2;
    return point(Math.cos(angle) * radius, Math.sin(angle) * radius);
  });
  return contour([
    ...points.map((p, i) => point(p.x + normals[i].x, p.y + normals[i].y)),
    ...points
      .map((p, i) => point(p.x - normals[i].x, p.y - normals[i].y))
      .reverse(),
  ]);
}
function ring(
  radius: number,
  thickness: number,
  start = 0,
  sweep = TAU - 0.001,
) {
  const arc = (r: number) =>
    Array.from({ length: 96 }, (_, i) =>
      point(
        Math.cos(start + (sweep * i) / 95) * r,
        Math.sin(start + (sweep * i) / 95) * r,
      ),
    );
  return contour([...arc(radius), ...arc(radius - thickness).reverse()]);
}
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
        bodyPath = tube([point(0, -94), point(0, 32)], 20);
        dots = [dot(0, 77, 20)];
        break;
      case "symbol-question":
        bodyPath = tube(
          Array.from({ length: 80 }, (_, i) => {
            const a = -Math.PI + (i / 79) * Math.PI * 1.65;
            return point(Math.cos(a) * 55, -37 + Math.sin(a) * 50);
          }).concat([point(0, 31)]),
          15,
        );
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
        bodyPath = tube([point(-83, 0), point(-20, 64), point(88, -68)], 18);
        break;
      case "symbol-loading":
        bodyPath = ring(91, 20, time * 2, Math.PI * 1.45);
        break;
      case "symbol-ring":
        bodyPath = ring(94, 25);
        break;
      case "symbol-crescent":
        bodyPath = ring(96, 38, -Math.PI * 0.7, Math.PI * 1.4);
        break;
      case "symbol-infinity":
        bodyPath = tube(
          Array.from({ length: 129 }, (_, i) => {
            const a = (i / 128) * TAU;
            return point(91 * Math.cos(a), 47 * Math.sin(2 * a));
          }),
          12,
        );
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
            d: tube(
              [point(x / 100, -height / 100), point(x / 100, height / 100)],
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
