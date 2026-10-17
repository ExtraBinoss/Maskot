import { useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { reducedMotionAtom } from "../state/lab";
import { BeamySvg } from "../mascot/BeamySvg";
import { createMascotEngine } from "../mascot/mascot-catalog";
import { STATE_BY_ID } from "../mascot/engine/states";
import { isFigure } from "../mascot/figures";
import type { MascotLook } from "../mascot/mascot-types";
import type { MotionId } from "../mascot/motion-types";
import { MascotThumbnail } from "./MascotThumbnail";

type Props = { look: MascotLook; state: MotionId; size: number };

function PlayingPreview({ look, state, size }: Props) {
  const engine = useMemo(() => createMascotEngine(look, state), [look, state]);
  const [frame, setFrame] = useState(() => engine.sample(0.9));
  useEffect(() => {
    let raf = 0,
      last: number | null = null,
      painted = -Infinity,
      elapsed = 0.9;
    // Begin at the poster frame, ease back to idle, then play the complete
    // movement. This also previews entry/exit motion for constant glyph poses.
    engine.setState("idle", elapsed);
    let returning = true,
      changeAt = elapsed + 0.5;
    const duration = isFigure(state)
      ? Infinity
      : STATE_BY_ID.get(state)!.duration;
    const tick = (now: number) => {
      if (document.hidden) return;
      if (last !== null) elapsed += Math.min((now - last) / 1000, 0.064);
      last = now;
      if (elapsed >= changeAt) {
        engine.setState(returning ? state : "idle", changeAt);
        returning = !returning;
        changeAt += returning ? 0.65 : duration;
      }
      // Only the hovered/focused, visible tile samples, at most 30 times/s.
      if (now - painted >= 1000 / 30) {
        setFrame(engine.sample(elapsed));
        painted = now;
      }
      raf = requestAnimationFrame(tick);
    };
    const visibility = () => {
      cancelAnimationFrame(raf);
      last = null;
      if (!document.hidden) raf = requestAnimationFrame(tick);
    };
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [engine, state]);
  return (
    <BeamySvg
      frame={frame}
      color={look.color}
      blush={look.blush}
      size={size}
      label="Maskot"
      minDotRadius={state.startsWith("orb-") ? (316 / size) * 0.45 : 0}
    />
  );
}

export function MotionPreview({
  active,
  ...props
}: Props & { active: boolean }) {
  const reduced = useAtomValue(reducedMotionAtom);
  return active && !reduced ? (
    <PlayingPreview {...props} />
  ) : (
    <MascotThumbnail {...props} portrait={false} />
  );
}
