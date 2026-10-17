import { memo, useMemo } from "react";
import { BeamySvg } from "../mascot/BeamySvg";
import { createMascotEngine } from "../mascot/mascot-catalog";
import type { MascotLook } from "../mascot/mascot-types";
import type { StateId } from "../mascot/engine/bot-types";

// Only geometry invalidates sampling. Color and blush reuse the cached frame.
export const MascotThumbnail = memo(function MascotThumbnail({
  look,
  state = "idle",
  size = 52,
  portrait = true,
}: {
  look: MascotLook;
  state?: StateId;
  size?: number;
  portrait?: boolean;
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
      ).sample(0.9),
    [shape, expression, eyes, eyeGeometry, state],
  );
  return (
    <BeamySvg
      frame={frame}
      color={color}
      blush={blush}
      size={size}
      portrait={portrait}
    />
  );
});
