import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const output = new URL("../public/", import.meta.url);
await mkdir(new URL("social/", output), { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
  });
  await page.goto(
    new URL("../artwork/social/index.html", import.meta.url).href,
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
  });
  await page.screenshot({
    path: fileURLToPath(new URL("social/maskot.png", output)),
  });
  const favicon = await readFile(new URL("favicon.svg", output), "utf8");
  for (const [name, size, background] of [
    ["favicon-48.png", 48, null],
    ["apple-touch-icon.png", 180, "#fffaf3"],
  ] as const) {
    const bytes = await page.evaluate(
      async ({ svg, size, background }) => {
        const image = new Image();
        image.src = "data:image/svg+xml," + encodeURIComponent(svg);
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        if (background) {
          ctx.fillStyle = background;
          ctx.fillRect(0, 0, size, size);
        }
        const inset = background ? 12 : 0;
        ctx.drawImage(image, inset, inset, size - inset * 2, size - inset * 2);
        return canvas.toDataURL("image/png").split(",")[1];
      },
      { svg: favicon, size, background },
    );
    await writeFile(new URL(name, output), Buffer.from(bytes, "base64"));
  }
} finally {
  await browser.close();
}
console.log("Rendered the 1200 × 630 social card and the browser/touch icons.");
