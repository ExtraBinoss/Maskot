import { BotEngine } from "./engine/engine";
import type {
  BotFrame,
  DotRender,
  StateId,
  BotExpression,
} from "./engine/bot-types";
import { SHAPE_BY_ID } from "./engine/skins";
import { clamp, easings, lerp } from "./engine/math";
import { figureFrame, isFigure, type MascotShapeId } from "./figures";

const numbers = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
const mixPath = (from: string, to: string, t: number) => {
  const a = from.match(numbers)!.map(Number);
  let i = 0;
  return to.replace(numbers, (n) =>
    String(Math.round(lerp(a[i++], Number(n), t) * 100) / 100),
  );
};
const zeroDot: DotRender = { x: 0, y: 0, r: 0, opacity: 0 };

// The original face engine remains unchanged. Symbols and vendored orb geometry
// share its clock, deterministic seeking and 64-cubic silhouette transitions.
export class StudioEngine extends BotEngine {
  private figure: MascotShapeId;
  private source: BotFrame | null = null;
  private figureAt = -10;
  constructor(
    scale: number,
    initial: StateId,
    shape: MascotShapeId,
    expression: BotExpression,
  ) {
    super(scale, initial, SHAPE_BY_ID.get(shape)?.radii ?? null, expression);
    this.figure = shape;
  }
  setFigure(shape: MascotShapeId, now: number, clock = now) {
    if (shape === this.figure) return;
    if (
      !isFigure(shape) &&
      !isFigure(this.figure) &&
      (!this.source || now - this.figureAt >= BotEngine.SHAPE_MORPH)
    ) {
      this.source = null;
      this.figure = shape;
      super.setShape(SHAPE_BY_ID.get(shape)!.radii, now);
      return;
    }
    this.source = this.sample(clock, now);
    this.figureAt = now;
    this.figure = shape;
    super.setShape(SHAPE_BY_ID.get(shape)?.radii ?? null, now - 1);
  }
  override sample(
    now: number,
    appearanceNow = now,
    canonicalEyes = false,
  ): BotFrame {
    const target = isFigure(this.figure)
      ? figureFrame(this.figure, now)
      : super.sample(now, appearanceNow, canonicalEyes);
    const k = clamp((appearanceNow - this.figureAt) / BotEngine.SHAPE_MORPH);
    if (!this.source || k >= 1) return target;
    const source = this.source;
    if (k === 0) return source;
    const t = easings.easeOutQuint(k);
    const eyes = target.eyes.length
      ? target.eyes.map((eye) => ({ ...eye, alpha: eye.alpha * t }))
      : source.eyes.map((eye) => ({ ...eye, alpha: eye.alpha * (1 - t) }));
    const dots = Array.from(
      { length: Math.max(source.dots.length, target.dots.length) },
      (_, i) => {
        const a = source.dots[i] ?? zeroDot,
          b = target.dots[i] ?? zeroDot;
        return {
          ...b,
          x: lerp(a.x, b.x, t),
          y: lerp(a.y, b.y, t),
          r: lerp(a.r, b.r, t),
          opacity: lerp(a.opacity, b.opacity, t),
        };
      },
    );
    return {
      ...target,
      bodyPath: mixPath(source.bodyPath, target.bodyPath, t),
      bodyAlpha: lerp(source.bodyAlpha, target.bodyAlpha, t),
      eyes,
      dots,
    };
  }
}
