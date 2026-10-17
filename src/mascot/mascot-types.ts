import type { ExpressionId, EyeGeometry, EyeStyle } from "./engine/bot-types";
import type { MascotShapeId } from "./figures";
import type { MotionId } from "./motion-types";

export interface MascotLook {
  shape: MascotShapeId;
  color: string;
  expression: ExpressionId;
  eyes: EyeStyle;
  blush: boolean;
  eyeGeometry: EyeGeometry;
}

export interface MascotStep {
  state: MotionId;
  duration: number;
}

export interface MascotPreset {
  version: 1;
  look: MascotLook;
  timeline: MascotStep[];
}
