import { MorphPath } from "./MorphPath";
import { useVisiblePreview } from "./useVisiblePreview";
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
  const { ref, visible } = useVisiblePreview<SVGSVGElement>();
  const geometry = look.eyeGeometry;
  const path = visible
    ? eyeShapePath(
        13 * geometry.size * geometry.width,
        24 * geometry.size * geometry.height,
        style,
        style,
        1,
        true,
      )
    : "";
  return (
    <svg
      ref={ref}
      width="54"
      height="44"
      viewBox="-40 -32 80 64"
      aria-hidden="true"
    >
      {visible && (
        <>
          <MorphPath
            fill={look.color}
            d={path}
            transform={`translate(${-15 * geometry.spacing} ${geometry.offsetY * 20})`}
          />
          <MorphPath
            fill={look.color}
            d={path}
            transform={`translate(${15 * geometry.spacing} ${geometry.offsetY * 20})`}
          />
        </>
      )}
    </svg>
  );
}
