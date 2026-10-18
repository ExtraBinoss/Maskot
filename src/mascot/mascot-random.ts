import { EXPRESSIONS } from "./engine/expressions";
import { EYE_STYLES } from "./engine/eye-styles";
import { SHAPES } from "./engine/skins";
import { MOTION_IDS, PALETTE } from "./mascot-catalog";
import type { MascotLook, MascotStep } from "./mascot-types";

export function randomMascotLook(
  previous: MascotLook,
  random = Math.random,
): MascotLook {
  const pick = <T>(items: readonly T[], current: T) => {
    const choices = items.filter((item) => item !== current);
    return choices[Math.floor(random() * choices.length)];
  };
  const between = (min: number, max: number) =>
    Math.round((min + random() * (max - min)) * 100) / 100;
  return {
    shape: pick(
      SHAPES.map((shape) => shape.id),
      previous.shape,
    ),
    expression: pick(
      EXPRESSIONS.map((expression) => expression.id),
      previous.expression,
    ),
    eyes: pick(
      EYE_STYLES.map((eyes) => eyes.id),
      previous.eyes,
    ),
    color: pick(PALETTE, previous.color),
    blush: random() < 0.3,
    eyeGeometry: {
      size: between(0.8, 1.2),
      width: between(0.8, 1.2),
      height: between(0.8, 1.2),
      spacing: between(0.85, 1.15),
      offsetY: between(-0.08, 0.08),
    },
  };
}

export function randomMascotTimeline(random = Math.random): MascotStep[] {
  const pool = [...MOTION_IDS];
  for (let i = pool.length - 1; i > 0; i--) {
    const index = Math.floor(random() * (i + 1));
    [pool[i], pool[index]] = [pool[index], pool[i]];
  }
  return pool.slice(0, 10).map((state) => ({
    state,
    duration: Math.round((1.2 + random() * 2.6) * 10) / 10,
  }));
}
