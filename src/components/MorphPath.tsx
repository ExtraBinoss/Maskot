import { useLayoutEffect, useRef, type ComponentProps } from "react";
import { animate, type AnimationPlaybackControls } from "motion";
import { svgInterpolator } from "../lib/svg-morph";

type Attribute = {
  value: string | number;
  animation?: AnimationPlaybackControls;
};

// One numeric progress tween per attribute uses Motion's shared scheduler.
// Coordinates never pass through its general CSS complex-string parser.
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
      let attribute = active.get(name);
      if (!attribute) {
        attribute = { value: target };
        active.set(name, attribute);
        continue;
      }
      if (attribute.value === target) continue;
      attribute.animation?.stop();
      const interpolate = svgInterpolator(name, attribute.value, target);
      if (reduced || document.hidden || !interpolate) {
        attribute.value = target;
        element.setAttribute(name, String(target));
        continue;
      }
      element.setAttribute(name, String(attribute.value));
      const current = attribute;
      current.animation = animate(0, 1, {
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (progress) => {
          current.value = interpolate(progress);
          element.setAttribute(name, String(current.value));
        },
        onComplete: () => {
          current.value = target;
          element.setAttribute(name, String(target));
        },
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
