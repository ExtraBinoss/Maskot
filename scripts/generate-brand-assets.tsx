import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { BeamySvg } from "../src/mascot/BeamySvg";
import { createMascotEngine, DEFAULT_LOOK } from "../src/mascot/mascot-catalog";
import type { MascotLook } from "../src/mascot/mascot-types";
import { REST_GAZE } from "../src/mascot/engine/face";

const assets = new URL("../artwork/social/assets/", import.meta.url);
await mkdir(assets, { recursive: true });

const variants: [string, Partial<MascotLook>][] = [
  ["hero", { color: "#ff5a1f" }],
  ["bubble", { expression: "heureux", eyes: "capsule" }],
  ["star", { shape: "etoile5", color: "#f0b429", eyes: "star" }],
  ["cloud", { shape: "nuage", color: "#8b5cf6", expression: "complice" }],
  ["mochi", { shape: "capsule", color: "#2fbfa0", eyes: "round" }],
  ["flower", { shape: "fleur5", color: "#e152b0", eyes: "heart" }],
  ["pebble", { shape: "galet", color: "#2563eb", expression: "curieux" }],
];
for (const [name, variant] of variants) {
  const look = { ...DEFAULT_LOOK, ...variant };
  const engine = createMascotEngine(look);
  const gaze = name === "hero" ? REST_GAZE : { yaw: 0, pitch: 0 };
  engine.setLook(
    { yaw: gaze.yaw, pitch: gaze.pitch, mix: 1, spin: 0, wander: 0 },
    -1,
  );
  const frame = engine.sample(0);
  const svg = renderToStaticMarkup(
    <BeamySvg frame={frame} color={look.color} paper="#fffaf3" portrait />,
  );
  await writeFile(new URL(`${name}.svg`, assets), svg + "\n");
  if (name === "hero") {
    const eyes = frame.eyes
      .map((eye) => `<path d="${eye.d}" transform="${eye.matrix}"/>`)
      .join("");
    await writeFile(
      new URL("../public/favicon.svg", import.meta.url),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-108 -108 216 216"><defs><clipPath id="body"><circle r="100"/></clipPath></defs><circle r="100" fill="#ff5a1f"/><g fill="#fffaf3" clip-path="url(#body)">${eyes}</g></svg>\n`,
    );
  }
}
for (const [family, name] of [
  ["space-grotesk", "heading"],
  ["source-sans-3", "body"],
])
  await copyFile(
    new URL(
      `../node_modules/@fontsource-variable/${family}/files/${family}-latin-wght-normal.woff2`,
      import.meta.url,
    ),
    new URL(`${name}.woff2`, assets),
  );
console.log(
  "Generated the orange favicon and the social card’s mascot artwork.",
);
