import { mkdir, writeFile } from "node:fs/promises";
import { cpus } from "node:os";
import {
  createMascotEngine,
  DEFAULT_LOOK,
  MOTION_IDS,
} from "../src/mascot/mascot-catalog";
import { SHAPES } from "../src/mascot/engine/skins";

function measure(name: string, run: (index: number) => void, count: number) {
  for (let index = 0; index < Math.min(count, 30); index++) run(index);
  const samples: number[] = [];
  for (let index = 0; index < count; index++) {
    const start = performance.now();
    run(index);
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  const percentile = (p: number) =>
    samples[Math.min(samples.length - 1, Math.floor(samples.length * p))];
  return {
    name,
    samples: count,
    medianMs: percentile(0.5),
    p95Ms: percentile(0.95),
    maxMs: samples.at(-1)!,
  };
}

const engines = MOTION_IDS.map((motion) =>
  createMascotEngine(DEFAULT_LOOK, motion),
);
const morph = createMascotEngine(DEFAULT_LOOK);
let clock = 0;
const results = [
  measure(
    "Construct a mascot across all silhouettes",
    (index) => {
      createMascotEngine({
        ...DEFAULT_LOOK,
        shape: SHAPES[index % SHAPES.length].id,
      }).sample(0);
    },
    1000,
  ),
  measure(
    "Sample a frame across all motion presets",
    (index) => {
      engines[index % engines.length].sample(index / 60);
    },
    3000,
  ),
  measure(
    "Retarget silhouette and sample an interrupted morph",
    (index) => {
      clock += 1 / 60;
      morph.setFigure(SHAPES[index % SHAPES.length].id, clock, clock);
      morph.sample(clock + 1 / 120, clock + 1 / 120);
    },
    1000,
  ),
];
const report = {
  measuredAt: new Date().toISOString(),
  runtime: `Bun ${process.versions.bun ?? "unknown"}`,
  cpu: cpus()[0]?.model,
  scope:
    "CPU geometry only; excludes React, DOM, paint, and GPU presentation. Warm-up runs precede each scenario.",
  results,
};
await mkdir("artifacts", { recursive: true });
await writeFile(
  "artifacts/engine-performance.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.table(results);
