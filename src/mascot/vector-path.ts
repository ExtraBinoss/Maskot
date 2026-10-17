import type { Point } from "./engine/bot-types";

type Cubic = [Point, Point, Point, Point];
const TAU = Math.PI * 2;
export const point = (x: number, y: number): Point => ({ x, y });
const mix = (a: Point, b: Point, t: number) =>
  point(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const at = ([a, b, c, d]: Cubic, t: number) => {
  const u = 1 - t;
  return point(
    u * u * u * a.x +
      3 * u * u * t * b.x +
      3 * u * t * t * c.x +
      t * t * t * d.x,
    u * u * u * a.y +
      3 * u * u * t * b.y +
      3 * u * t * t * c.y +
      t * t * t * d.y,
  );
};
const tangent = ([a, b, c, d]: Cubic, t: number) =>
  point(
    3 *
      ((1 - t) ** 2 * (b.x - a.x) +
        2 * (1 - t) * t * (c.x - b.x) +
        t * t * (d.x - c.x)),
    3 *
      ((1 - t) ** 2 * (b.y - a.y) +
        2 * (1 - t) * t * (c.y - b.y) +
        t * t * (d.y - c.y)),
  );
function slice(curve: Cubic, from: number, to: number): Cubic {
  const a = at(curve, from),
    d = at(curve, to),
    va = tangent(curve, from),
    vd = tangent(curve, to),
    k = (to - from) / 3;
  return [
    a,
    point(a.x + va.x * k, a.y + va.y * k),
    point(d.x - vd.x * k, d.y - vd.y * k),
    d,
  ];
}
const format = (p: Point) =>
  `${Number(p.x.toFixed(4))} ${Number(p.y.toFixed(4))}`;

// Subdivision preserves the designed lines, corners and Bézier curves exactly.
// All outlines still contain 64 cubics, including the annulus's two opposing
// bridges, so the existing SVG morphs retain a common numeric topology.
export class VectorPath {
  readonly segments: Cubic[] = [];
  private current: Point;
  constructor(readonly start: Point) {
    this.current = start;
  }
  line(to: Point) {
    this.segments.push([
      this.current,
      mix(this.current, to, 1 / 3),
      mix(this.current, to, 2 / 3),
      to,
    ]);
    this.current = to;
    return this;
  }
  curve(b: Point, c: Point, d: Point) {
    this.segments.push([this.current, b, c, d]);
    this.current = d;
    return this;
  }
  arc(center: Point, radius: number, from: number, sweep: number) {
    const n = Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI / 2)));
    for (let i = 0; i < n; i++) {
      const a = from + (sweep * i) / n,
        b = from + (sweep * (i + 1)) / n,
        k = (4 / 3) * Math.tan((b - a) / 4);
      this.curve(
        point(
          center.x + radius * (Math.cos(a) - k * Math.sin(a)),
          center.y + radius * (Math.sin(a) + k * Math.cos(a)),
        ),
        point(
          center.x + radius * (Math.cos(b) + k * Math.sin(b)),
          center.y + radius * (Math.sin(b) - k * Math.cos(b)),
        ),
        point(center.x + radius * Math.cos(b), center.y + radius * Math.sin(b)),
      );
    }
    return this;
  }
  close(): string {
    if (distance(this.current, this.start) > 1e-8) this.line(this.start);
    const curves = this.segments;
    if (!curves.length || curves.length > 64)
      throw new Error("Invalid vector outline.");
    const lengths = curves.map(
      (c) => distance(c[0], c[1]) + distance(c[1], c[2]) + distance(c[2], c[3]),
    );
    const total = lengths.reduce((sum, length) => sum + length, 0);
    const shares = lengths.map(
      (length) =>
        (64 - curves.length) * (total ? length / total : 1 / curves.length),
    );
    const counts = shares.map((n) => 1 + Math.floor(n));
    const order = shares
      .map((n, i) => ({ i, fraction: n - Math.floor(n) }))
      .sort((a, b) => b.fraction - a.fraction);
    for (
      let n = 64 - counts.reduce((sum, count) => sum + count, 0), i = 0;
      n > 0;
      n--, i++
    )
      counts[order[i].i]++;
    let result = `M${format(this.start)}`;
    for (let i = 0; i < curves.length; i++)
      for (let j = 0; j < counts[i]; j++) {
        const [, b, c, d] = slice(
          curves[i],
          j / counts[i],
          (j + 1) / counts[i],
        );
        result += `C${format(b)} ${format(c)} ${format(d)}`;
      }
    return result + "Z";
  }
}
export const circlePath = (cx: number, cy: number, r: number) =>
  new VectorPath(point(cx + r, cy)).arc(point(cx, cy), r, 0, TAU).close();

export function polygonPath(points: Point[], radius = 4) {
  const corners = points.map((p, i) => {
    const before = points[(i + points.length - 1) % points.length],
      after = points[(i + 1) % points.length];
    const cut = Math.min(
      radius,
      distance(p, before) / 3,
      distance(p, after) / 3,
    );
    return {
      corner: p,
      a: mix(p, before, cut / (distance(p, before) || 1)),
      b: mix(p, after, cut / (distance(p, after) || 1)),
    };
  });
  const path = new VectorPath(corners[0].a);
  for (const { corner, a, b } of corners) {
    path.line(a).curve(mix(a, corner, 2 / 3), mix(b, corner, 2 / 3), b);
  }
  return path.close();
}
export function capsulePath(a: Point, b: Point, r: number) {
  const angle = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2;
  const normal = point(Math.cos(angle) * r, Math.sin(angle) * r);
  return new VectorPath(point(a.x + normal.x, a.y + normal.y))
    .line(point(b.x + normal.x, b.y + normal.y))
    .arc(b, r, angle, -Math.PI)
    .line(point(a.x - normal.x, a.y - normal.y))
    .arc(a, r, angle - Math.PI, -Math.PI)
    .close();
}
export function ringPath(
  radius: number,
  thickness: number,
  start = 0,
  sweep = TAU,
) {
  const center = point(0, 0),
    outer = point(Math.cos(start) * radius, Math.sin(start) * radius);
  const path = new VectorPath(outer).arc(center, radius, start, sweep);
  if (Math.abs(sweep - TAU) < 1e-8) {
    path
      .line(
        point(
          Math.cos(start) * (radius - thickness),
          Math.sin(start) * (radius - thickness),
        ),
      )
      .arc(center, radius - thickness, start, -TAU)
      .line(outer);
  } else {
    const end = start + sweep,
      mid = radius - thickness / 2;
    path
      .arc(
        point(Math.cos(end) * mid, Math.sin(end) * mid),
        thickness / 2,
        end,
        Math.PI,
      )
      .arc(center, radius - thickness, end, -sweep)
      .arc(
        point(Math.cos(start) * mid, Math.sin(start) * mid),
        thickness / 2,
        start + Math.PI,
        Math.PI,
      );
  }
  return path.close();
}
export function questionPath() {
  return new VectorPath(point(-68, -54))
    .curve(point(-68, -140), point(82, -140), point(82, -53))
    .curve(point(82, -5), point(17, -10), point(17, 31))
    .arc(point(0, 31), 17, 0, Math.PI)
    .curve(point(-17, -26), point(48, -27), point(48, -53))
    .curve(point(48, -94), point(-34, -94), point(-34, -54))
    .arc(point(-51, -54), 17, 0, Math.PI)
    .close();
}
export function crescentPath() {
  const r = 96,
    inner = 82,
    offset = 45;
  const x = (r * r - inner * inner + offset * offset) / (2 * offset),
    y = Math.sqrt(r * r - x * x);
  const a = Math.atan2(y, x),
    b = Math.atan2(y, x - offset);
  return new VectorPath(point(x, y))
    .arc(point(0, 0), r, a, TAU - 2 * a)
    .arc(point(offset, 0), inner, -b, -(TAU - 2 * b))
    .close();
}
export function infinityPath() {
  const curves: Cubic[] = [
    [point(0, 0), point(-37, -58), point(-93, -58), point(-93, 0)],
    [point(-93, 0), point(-93, 58), point(-37, 58), point(0, 0)],
    [point(0, 0), point(37, -58), point(93, -58), point(93, 0)],
    [point(93, 0), point(93, 58), point(37, 58), point(0, 0)],
  ];
  const left: Point[] = [],
    right: Point[] = [];
  for (let i = 0; i < 30; i++) {
    const k = (i / 30) * curves.length,
      curve = curves[Math.floor(k)],
      t = k % 1,
      p = at(curve, t),
      d = tangent(curve, t),
      length = Math.hypot(d.x, d.y);
    const nx = (-d.y / length) * 12,
      ny = (d.x / length) * 12;
    left.push(point(p.x + nx, p.y + ny));
    right.push(point(p.x - nx, p.y - ny));
  }
  const path = new VectorPath(left[0]);
  const loop = (points: Point[]) => {
    for (let i = 0; i < points.length; i++) {
      const a = points[(i - 1 + points.length) % points.length],
        b = points[i],
        c = points[(i + 1) % points.length],
        d = points[(i + 2) % points.length];
      path.curve(
        point(b.x + (c.x - a.x) / 6, b.y + (c.y - a.y) / 6),
        point(c.x - (d.x - b.x) / 6, c.y - (d.y - b.y) / 6),
        c,
      );
    }
  };
  loop(left);
  path.line(right[0]);
  loop([right[0], ...right.slice(1).reverse()]);
  path.line(left[0]);
  return path.close();
}
