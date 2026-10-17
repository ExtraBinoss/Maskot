import { MascotThumbnail } from "./MascotThumbnail";
import { useVisiblePreview } from "./useVisiblePreview";
import type { MascotLook } from "../mascot/mascot-types";

// The complete catalog remains keyboard-accessible; offscreen SVGs do no work.
export function VisibleMascotThumbnail({
  look,
  size = 47,
}: {
  look: MascotLook;
  size?: number;
}) {
  const { ref, visible } = useVisiblePreview<HTMLSpanElement>();
  return (
    <span
      ref={ref}
      style={{ display: "block", width: size, height: size, flexShrink: 0 }}
    >
      {visible && <MascotThumbnail look={look} size={size} />}
    </span>
  );
}
