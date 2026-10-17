import type { StateId } from "./engine/bot-types";
import type { ANIMATED_SYMBOLS, ORBS } from "./figures";

export type MotionId =
  | StateId
  | (typeof ANIMATED_SYMBOLS)[number]["id"]
  | (typeof ORBS)[number]["id"];

export type MotionGroup = {
  label: string;
  items: readonly { id: MotionId; label: string }[];
};
