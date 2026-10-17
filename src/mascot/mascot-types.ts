import type {
  ExpressionId,
  EyeGeometry,
  EyeStyle,
  StateId,
} from "./engine/bot-types";
import type { MascotShapeId } from "./figures";

export interface MascotLook {
  shape: MascotShapeId;
  color: string;
  expression: ExpressionId;
  eyes: EyeStyle;
  blush: boolean;
  eyeGeometry: EyeGeometry;
}

export interface MascotStep {
  state: StateId;
  duration: number;
}

export interface MascotPreset {
  version: 1;
  look: MascotLook;
  timeline: MascotStep[];
}
