// React port of Beam's BeamySvg.vue (MPL-2.0). See NOTICE.txt and engine/NOTICE.txt.
import { useId, type Ref } from "react";
import type { BotFrame, DotRender } from "./engine/bot-types";
import { NOTIF_BLUE } from "./engine/decor";
import { mixHex } from "./engine/skins";
import { DEMI_VIEWBOX, RAYON } from "./engine/repere";

interface BeamySvgProps {
  frame: BotFrame;
  color: string;
  size?: number;
  blush?: boolean | number;
  paper?: string;
  label?: string;
  portrait?: boolean;
  eyeColor?: string;
  ref?: Ref<SVGSVGElement>;
}

export function BeamySvg({
  frame,
  color,
  size = 320,
  blush = false,
  paper = "#f9f9f9",
  label = "Mascotte Plinka",
  portrait = false,
  eyeColor,
  ref,
}: BeamySvgProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const dots = frame.dots.map((dot: DotRender, i) => {
    const fill =
      dot.color ??
      (dot.depth === undefined ? color : mixHex(paper, color, dot.depth));
    return dot.d ? (
      <path
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
        r={dot.r}
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
        <mask
          id={`${id}-face`}
          maskUnits="userSpaceOnUse"
          x="-158"
          y="-158"
          width="316"
          height="316"
        >
          <path d={frame.bodyPath} fill="white" />
          {frame.eyes.map((eye, i) => (
            <path
              key={i}
              d={eye.d}
              transform={eye.matrix}
              opacity={eye.alpha}
              fill="black"
            />
          ))}
          {frame.notch && (
            <circle
              cx={frame.notch.x}
              cy={frame.notch.y}
              r={frame.notch.r}
              fill="black"
            />
          )}
        </mask>
        <clipPath id={`${id}-body`}>
          <path d={frame.bodyPath} />
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
          <path
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
        <path d={frame.bodyPath} fill={paper} />
        <path d={frame.bodyPath} fill={color} mask={`url(#${id}-face)`} />
        {blush && (
          <g clipPath={`url(#${id}-body)`}>
            {frame.eyes.map((eye, i) => (
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
            ))}
          </g>
        )}
      </g>
      {eyeColor && (
        <g fill={eyeColor}>
          {frame.eyes.map((eye, i) => (
            <path
              key={i}
              d={eye.d}
              transform={eye.matrix}
              opacity={eye.alpha}
            />
          ))}
        </g>
      )}
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
          <path
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
