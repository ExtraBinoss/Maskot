import { describe, expect, it } from "vitest";
import {
  capsulePath,
  circlePath,
  point,
  polygonPath,
  questionPath,
  ringPath,
} from "./vector-path";

function samples(path: string) {
  const numbers = path.match(/-?\d*\.?\d+/g)!.map(Number);
  let a = { x: numbers[0], y: numbers[1] };
  const points = [a];
  for (let i = 2; i < numbers.length; i += 6) {
    const [bx, by, cx, cy, dx, dy] = numbers.slice(i, i + 6);
    for (let j = 1; j <= 12; j++) {
      const t = j / 12,
        u = 1 - t;
      points.push(
        point(
          u * u * u * a.x +
            3 * u * u * t * bx +
            3 * u * t * t * cx +
            t * t * t * dx,
          u * u * u * a.y +
            3 * u * u * t * by +
            3 * u * t * t * cy +
            t * t * t * dy,
        ),
      );
    }
    a = point(dx, dy);
  }
  return points;
}
describe("designed symbol contours", () => {
  it("keeps the ring concentric and within its exact radii, including its closure", () => {
    const radii = samples(ringPath(94, 25)).map((p) => Math.hypot(p.x, p.y));
    expect(Math.min(...radii)).toBeGreaterThanOrEqual(69 - 0.001);
    expect(Math.max(...radii)).toBeLessThan(94.03);
    expect(ringPath(94, 25).match(/C/g)).toHaveLength(64);
  });
  it("preserves straight edges and authored corners without spline overshoot", () => {
    const points = samples(
      polygonPath([
        point(-20, -94),
        point(20, -94),
        point(20, 94),
        point(-20, 94),
      ]),
    );
    expect(
      points.every(
        (p) =>
          p.x >= -20.001 && p.x <= 20.001 && p.y >= -94.001 && p.y <= 94.001,
      ),
    ).toBe(true);
    const capsule = samples(capsulePath(point(0, -87), point(0, 25), 18));
    expect(
      capsule.every(
        (p) =>
          p.x >= -18.001 && p.x <= 18.001 && p.y >= -105.001 && p.y <= 43.001,
      ),
    ).toBe(true);
  });
  it("keeps smooth question curves within the designed outline and stable morph topology", () => {
    const points = samples(questionPath());
    expect(
      points.every(
        (p) => p.x >= -68.001 && p.x <= 82.001 && p.y >= -119 && p.y <= 48.001,
      ),
    ).toBe(true);
    expect(questionPath().match(/C/g)).toHaveLength(64);
    expect(circlePath(0, 0, 0).match(/C/g)).toHaveLength(64);
  });
});
