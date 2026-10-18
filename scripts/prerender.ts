import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const entry: { render: () => Promise<string> } = await import(
  pathToFileURL(resolve("artifacts/ssr/entry-server.js")).href
);
const markup = await entry.render();
if (!markup.includes("<h1") || !markup.includes("<svg"))
  throw new Error("Prerender must include the studio heading and mascot SVG.");
const html = await readFile("dist/index.html", "utf8");
const target = '<div id="root"></div>';
if (!html.includes(target)) throw new Error("Prerender root is missing.");
await writeFile(
  "dist/index.html",
  html.replace(
    target,
    () => `<div id="root" data-prerendered="true">${markup}</div>`,
  ),
);
console.log(`Prerendered Maskot studio (${Buffer.byteLength(markup)} bytes).`);
