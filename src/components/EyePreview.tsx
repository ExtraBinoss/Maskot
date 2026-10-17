import { eyeShapePath } from "../mascot/engine/eye-shape";
import type { EyeStyle } from "../mascot/engine/eye-styles";
import type { MascotLook } from "../mascot/mascot-types";

export function EyePreview({
  look,
  style,
}: {
  look: MascotLook;
  style: EyeStyle;
}) {
  const geometry = look.eyeGeometry;
  const path = eyeShapePath(
    13 * geometry.size * geometry.width,
    24 * geometry.size * geometry.height,
    style,
    style,
    1,
  );
  return (
    <svg
      width="54"
      height="44"
      viewBox="-40 -32 80 64"
      aria-hidden="true"
      fill={look.color}
    >
      <path
        d={path}
        transform={`translate(${-15 * geometry.spacing} ${geometry.offsetY * 20})`}
      />
      <path
        d={path}
        transform={`translate(${15 * geometry.spacing} ${geometry.offsetY * 20})`}
      />
    </svg>
  );
}
