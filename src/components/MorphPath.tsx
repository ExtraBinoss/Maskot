import { useLayoutEffect, useRef, type ComponentProps } from "react";
import {
  animate,
  motionValue,
  type AnimationPlaybackControls,
  type MotionValue,
} from "motion";

type Attribute = {
  value: MotionValue<string | number>;
  animation?: AnimationPlaybackControls;
};

// Animate the SVG attributes themselves: projected eye matrices keep their SVG
// coordinate system, and Motion shares one scheduler across all visible paths.
export function MorphPath({
  d,
  fill,
  transform,
  opacity,
  stroke,
  strokeWidth,
  ...props
}: ComponentProps<"path">) {
  const ref = useRef<SVGPathElement>(null);
  const attributes = useRef(new Map<string, Attribute>());
  useLayoutEffect(() => {
    const element = ref.current!;
    const values: Record<string, string | number | undefined> = {
      d,
      fill,
      transform,
      opacity,
      stroke,
      "stroke-width": strokeWidth,
    };
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const active = attributes.current;
    for (const [name, target] of Object.entries(values)) {
      if (target === undefined) {
        active.get(name)?.animation?.stop();
        active.delete(name);
        continue;
      }
      const next = typeof target === "number" ? target : String(target);
      let attribute = active.get(name);
      if (!attribute) {
        attribute = { value: motionValue<string | number>(next) };
        active.set(name, attribute);
        continue;
      }
      if (attribute.value.get() === next) continue;
      attribute.animation?.stop();
      if (reduced || document.hidden) {
        attribute.value.set(next);
        element.setAttribute(name, String(next));
        continue;
      }
      element.setAttribute(name, String(attribute.value.get()));
      attribute.animation = animate(attribute.value, next, {
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (value) => element.setAttribute(name, String(value)),
      });
    }
    return () => {
      for (const attribute of active.values()) attribute.animation?.stop();
    };
  }, [d, fill, transform, opacity, stroke, strokeWidth]);
  return (
    <path
      {...props}
      ref={ref}
      d={d}
      fill={fill}
      transform={transform}
      opacity={opacity}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
}
