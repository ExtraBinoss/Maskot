import { test, expect } from "@playwright/test";

const preview = (page: import("@playwright/test").Page) =>
  page.getByRole("img", { name: "Aperçu de la mascotte", exact: true });

test("paints the system scheme and saved theme before the application loads", async ({
  browser,
}) => {
  for (const options of [
    { system: "dark", saved: undefined, expected: "dark" },
    { system: "light", saved: undefined, expected: "light" },
    { system: "dark", saved: "light", expected: "light" },
    { system: "light", saved: "dark", expected: "dark" },
  ] as const) {
    const context = await browser.newContext({ colorScheme: options.system });
    const page = await context.newPage();
    if (options.saved)
      await page.addInitScript(
        (value) =>
          localStorage.setItem("mascotlab-theme", JSON.stringify(value)),
        options.saved,
      );
    await page.route(/\.(?:js|css)(?:\?|$)/, (route) => route.abort());
    await page.goto("/");
    await expect(page.locator("#root")).toHaveAttribute(
      "data-prerendered",
      "true",
    );
    await expect(page.locator("#root main")).toHaveCount(1);
    await expect(page.locator("[data-mascot-preview] svg")).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      options.expected,
    );
    await expect(page.locator("html")).toHaveCSS(
      "color-scheme",
      options.expected,
    );
    await expect(page.locator("html")).toHaveCSS(
      "background-color",
      options.expected === "dark" ? "rgb(28, 28, 30)" : "rgb(251, 251, 253)",
    );
    await context.close();
  }
});

test("keeps the properties panel and its scrolling area at their full available height", async ({
  page,
}) => {
  await page.goto("/");
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 1024, height: 700 },
    { width: 768, height: 700 },
    { width: 390, height: 844 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(viewport);
    for (const view of ["Statique", "Mouvement"]) {
      await page.getByRole("button", { name: view, exact: true }).click();
      await expect(async () => {
        const geometry = await page.locator("#settings").evaluate((el) => {
          const root = el.closest("main")!.getBoundingClientRect(),
            panel = el.getBoundingClientRect(),
            scroll = el.firstElementChild!.getBoundingClientRect();
          const styles = getComputedStyle(el);
          const bottomText = styles
            .getPropertyValue("--inspector-bottom")
            .trim();
          const bottom = Number.parseFloat(bottomText);
          return {
            root: root.height,
            top: panel.top - root.top,
            height: panel.height,
            bottom,
            scrollTop: scroll.top - panel.top,
            scrollBottom: scroll.bottom - panel.top,
          };
        });
        expect(
          Math.abs(
            geometry.height - (geometry.root - geometry.top - geometry.bottom),
          ),
        ).toBeLessThan(1);
        expect(geometry.height).toBeGreaterThan(80);
        expect(Math.abs(geometry.scrollTop)).toBeLessThan(1);
        expect(geometry.scrollBottom).toBeLessThanOrEqual(geometry.height + 1);
        if (view === "Statique" && viewport.width > 760)
          expect(
            Math.abs(geometry.scrollBottom - geometry.height),
          ).toBeLessThan(1);
      }).toPass({ timeout: 3000 });
    }
  }
});

test("renders closed rings with no seam in the live SVG and PNG export", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Anneau", exact: true }).click();
  const pixels = await preview(page).evaluate(async (element) => {
    const image = new Image();
    image.src =
      "data:image/svg+xml," +
      encodeURIComponent(new XMLSerializer().serializeToString(element));
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0, 1024, 1024);
    const alpha = (x: number, y: number) =>
      ctx.getImageData(
        Math.round(((x + 158) / 316) * 1024),
        Math.round(((y + 158) / 316) * 1024),
        1,
        1,
      ).data[3];
    return {
      ring: Array.from({ length: 720 }, (_, i) => {
        const a = (i / 720) * Math.PI * 2;
        return alpha(Math.cos(a) * 81.5, Math.sin(a) * 81.5);
      }),
      center: alpha(0, 0),
      outside: alpha(110, 0),
    };
  });
  expect(Math.min(...pixels.ring)).toBe(255);
  expect(pixels.center).toBe(0);
  expect(pixels.outside).toBe(0);
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exporter en PNG", exact: true })
    .click();
  expect((await download).suggestedFilename()).toMatch(/\.png$/);
});

test("uses one primary selection in each shadcn group and remembers it", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "À propos", exact: true }).click();
  const themes = page.locator(
    '[data-slot="toggle-group"][aria-label="Thème de l’interface"]',
  );
  await expect(themes.locator('[data-slot="segmented-indicator"]')).toHaveCount(
    1,
  );
  await expect(themes.locator('[data-slot="segmented-indicator"]')).toHaveCSS(
    "background-color",
    "rgb(37, 99, 235)",
  );
  await themes
    .getByRole("button", { name: "Thème sombre", exact: true })
    .click();
  await expect(themes.locator('[aria-pressed="true"]')).toHaveCount(1);
  await expect(
    themes.getByRole("button", { name: "Thème sombre", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await themes
    .getByRole("button", { name: "Thème sombre", exact: true })
    .click();
  await expect(
    themes.getByRole("button", { name: "Thème sombre", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.setViewportSize({ width: 320, height: 568 });
  expect(
    await themes.evaluate((el) => el.getBoundingClientRect().right),
  ).toBeLessThanOrEqual(320);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("opens Motion with no additional module request and animates the timeline immediately", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: "Mouvement", exact: true }).waitFor();
  const modules: string[] = [];
  page.on("request", (request) => {
    if (/\.js(?:\?|$)/.test(request.url())) modules.push(request.url());
  });
  await page.route(/\.js(?:\?|$)/, (route) => route.abort());
  const frames = await page.evaluate(async () => {
    const button = document.querySelector<HTMLButtonElement>(
      'nav [aria-label="Mouvement"]',
    )!;
    const start = performance.now();
    button.click();
    const samples: { time: number; opacity: number; y: string }[] = [];
    for (let i = 0; i < 24; i++) {
      await new Promise(requestAnimationFrame);
      const timeline = document.querySelector<HTMLElement>(
        '[aria-label="Chorégraphie"]',
      );
      if (timeline)
        samples.push({
          time: performance.now() - start,
          opacity: Number(getComputedStyle(timeline).opacity),
          y: getComputedStyle(timeline).transform,
        });
    }
    return samples;
  });
  expect(frames.length).toBeGreaterThan(15);
  expect(frames[0].time).toBeLessThan(250);
  expect(frames.some((frame) => frame.opacity > 0 && frame.opacity < 1)).toBe(
    true,
  );
  expect(frames.at(-1)!.opacity).toBe(1);
  expect(modules).toEqual([]);
  await expect(
    page.getByText("Un petit instant…", { exact: true }),
  ).toHaveCount(0);
});
