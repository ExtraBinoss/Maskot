// SPDX-License-Identifier: MIT
// React port of Beam's BeamySvg.vue. See NOTICE.txt and engine/NOTICE.txt.
import { useId, type Ref } from "react";
import type { BotFrame, DotRender } from "./engine/bot-types";
import { MorphPath } from "../components/MorphPath";
import { NOTIF_BLUE } from "./engine/decor";
import { mixHex } from "./engine/skins";
import { DEMI_VIEWBOX, RAYON } from "./engine/repere";

interface BeamySvgProps {
  frame: BotFrame;
  morph?: boolean;
  color: string;
  size?: number;
  blush?: boolean | number;
  paper?: string;
  label?: string;
  portrait?: boolean;
  eyeColor?: string;
  minDotRadius?: number;
  ref?: Ref<SVGSVGElement>;
}

export function BeamySvg({
  frame,
  morph = false,
  color,
  size = 320,
  blush = false,
  paper = "#f9f9f9",
  label = "Mascotte Plinka",
  portrait = false,
  eyeColor,
  minDotRadius = 0,
  ref,
}: BeamySvgProps) {
  const Path = morph ? MorphPath : "path";
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  // Dense orbs stay vector artwork, with at most twelve painted paths instead
  // of hundreds of React circle nodes changing on every animation frame.
  const buckets = new Map<number, string[]>();
  if (
    frame.dots.length > 64 &&
    frame.dots.every((dot) => !dot.d && !dot.color && dot.depth === undefined)
  ) {
    for (const dot of frame.dots) {
      if (dot.r <= 0 || dot.opacity <= 0.01) continue;
      const opacity = Math.max(1, Math.min(12, Math.round(dot.opacity * 12)));
      const paths = buckets.get(opacity) ?? [];
      const x = Number(dot.x.toFixed(2)),
        y = Number(dot.y.toFixed(2)),
        r = Number(Math.max(dot.r, minDotRadius).toFixed(2));
      paths.push(
        `M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`,
      );
      buckets.set(opacity, paths);
    }
  }
  const dots = buckets.size
    ? [...buckets].map(([opacity, paths]) => (
        <Path
          key={opacity}
          d={paths.join("")}
          fill={color}
          opacity={opacity / 12}
        />
      ))
    : frame.dots.map((dot: DotRender, i) => {
        const fill =
          dot.color ??
          (dot.depth === undefined ? color : mixHex(paper, color, dot.depth));
        return dot.d ? (
          <Path
            key={i}
            d={dot.d}
            fill={fill}
            opacity={dot.opacity}
            transform={`translate(${dot.x} ${dot.y}) rotate(${dot.rot ?? 0}) scale(${RAYON})`}
          />
        ) : (
          <circle
            key={i}
            fill={fill}
            opacity={dot.opacity}
            cx={dot.x}
            cy={dot.y}
            r={dot.r > 0 ? Math.max(dot.r, minDotRadius) : 0}
          />
        );
      });
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox={
        portrait
          ? "-116 -116 232 232"
          : `${-DEMI_VIEWBOX} ${-DEMI_VIEWBOX} ${DEMI_VIEWBOX * 2} ${DEMI_VIEWBOX * 2}`
      }
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
    >
      <defs>
        <clipPath id={`${id}-body`}>
          <Path d={frame.bodyPath} />
        </clipPath>
        {frame.arcs.map((arc) => (
          <linearGradient
            id={`${id}-${arc.id}`}
            key={arc.id}
            gradientUnits="userSpaceOnUse"
            x1={arc.grad.x1}
            y1={arc.grad.y1}
            x2={arc.grad.x2}
            y2={arc.grad.y2}
          >
            {arc.grad.stops.map((stop, i) => (
              <stop
                key={i}
                offset={i / (arc.grad.stops.length - 1)}
                stopColor={stop}
              />
            ))}
          </linearGradient>
        ))}
      </defs>
      <g fill="none" strokeLinecap="round">
        {frame.arcs.map((arc) => (
          <Path
            key={arc.id}
            d={arc.back}
            stroke={`url(#${id}-${arc.id})`}
            strokeWidth={arc.width}
            opacity={arc.opacity}
          />
        ))}
      </g>
      {frame.dotsBehind && <g>{dots}</g>}
      <g opacity={frame.bodyAlpha}>
        <Path d={frame.bodyPath} fill={color} />
        <g clipPath={`url(#${id}-body)`} fill={eyeColor ?? paper}>
          {frame.eyes.map((eye, i) => (
            <Path
              key={i}
              d={eye.d}
              transform={eye.matrix}
              opacity={eye.alpha}
            />
          ))}
          {frame.notch && (
            <circle cx={frame.notch.x} cy={frame.notch.y} r={frame.notch.r} />
          )}
        </g>
        {(blush || morph) && (
          <g clipPath={`url(#${id}-body)`}>
            {frame.eyes.map((eye, i) =>
              morph ? (
                <MorphPath
                  key={i}
                  d="M -12 29 A 12 5 0 1 0 12 29 A 12 5 0 1 0 -12 29 Z"
                  transform={eye.matrix}
                  fill="#fffaf3"
                  opacity={eye.alpha * 0.22 * Number(blush)}
                />
              ) : (
                <ellipse
                  key={i}
                  cx="0"
                  cy="29"
                  rx="12"
                  ry="5"
                  transform={eye.matrix}
                  fill="#fffaf3"
                  opacity={eye.alpha * 0.22 * Number(blush)}
                />
              ),
            )}
          </g>
        )}
      </g>
      {!frame.dotsBehind && <g>{dots}</g>}
      {frame.notif && (
        <circle
          cx={frame.notif.x}
          cy={frame.notif.y}
          r={frame.notif.r}
          fill={NOTIF_BLUE}
        />
      )}
      <g fill="none" strokeLinecap="round">
        {frame.arcs.map((arc) => (
          <Path
            key={arc.id}
            d={arc.front}
            stroke={`url(#${id}-${arc.id})`}
            strokeWidth={arc.width}
            opacity={arc.opacity}
          />
        ))}
      </g>
    </svg>
  );
}
