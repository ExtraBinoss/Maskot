import { memo, useMemo } from "react";
import { BeamySvg } from "../mascot/BeamySvg";
import { createMascotEngine } from "../mascot/mascot-catalog";
import type { MascotLook } from "../mascot/mascot-types";
import type { MotionId } from "../mascot/motion-types";

// Only geometry invalidates sampling. Color and blush reuse the cached frame.
export const MascotThumbnail = memo(function MascotThumbnail({
  look,
  state = "idle",
  size = 52,
  portrait = true,
  morph = true,
}: {
  look: MascotLook;
  state?: MotionId;
  size?: number;
  portrait?: boolean;
  morph?: boolean;
}) {
  const { shape, expression, eyes, eyeGeometry, color, blush } = look;
  const frame = useMemo(
    () =>
      createMascotEngine(
        {
          shape,
          expression,
          eyes,
          eyeGeometry,
          color: "#000000",
          blush: false,
        },
        state,
      ).sample(0.9, 0.9, true),
    [shape, expression, eyes, eyeGeometry, state],
  );
  return (
    <BeamySvg
      label="Maskot"
      frame={frame}
      morph={morph}
      color={color}
      blush={blush}
      size={size}
      portrait={portrait}
      minDotRadius={
        state.startsWith("orb-") || shape.startsWith("orb-")
          ? ((portrait ? 232 : 316) / size) * 0.45
          : 0
      }
    />
  );
});
