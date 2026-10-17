import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const key = "mascotlab.preset.v1";
const browserErrors = new WeakMap<Page, string[]>();
const preview = (page: Page) =>
  page.getByRole("img", { name: "Aperçu de la mascotte", exact: true });
const artwork = (page: Page) => preview(page).innerHTML();
const setRange = (page: Page, label: string, value: number) =>
  page
    .getByRole("slider", { name: label, exact: true })
    .evaluate((element, value) => {
      const input = element as HTMLInputElement;
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(input, String(value));
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page)).toEqual([]);
});

test("keeps Static still, loads tools on demand and reserves the footer for About", async ({
  page,
}) => {
  await expect(page).toHaveTitle("Maskot — A little character studio");
  const lazyTools = () =>
    page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
        .filter((name) => /\/(MotionPanel|About)-/.test(name)),
    );
  expect(await lazyTools()).toHaveLength(0);
  const still = await artwork(page);
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 550)));
  expect(await artwork(page)).toBe(still);
  await expect(page.locator("footer")).toHaveCount(0);
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  await expect(
    page.getByLabel("Mouvements", { exact: true }).getByRole("button"),
  ).toHaveCount(14);
  expect(await lazyTools()).toEqual(
    expect.arrayContaining([expect.stringMatching(/MotionPanel-/)]),
  );
  await page.getByRole("button", { name: "About", exact: true }).click();
  await expect(page.locator("footer")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: /Grok bot inspired/ }),
  ).toBeVisible();
  await expect(page.locator("footer")).toContainText("Plinka");
  await expect(
    page.getByRole("link", { name: "Maskot, un projet Plinka", exact: true }),
  ).toHaveText("maskot.");
  await page.getByRole("button", { name: "Static", exact: true }).click();
  await expect(page.locator("footer")).toHaveCount(0);
  await expect(preview(page)).toBeVisible();
});

test("opens Motion with autoplay on a slower CPU without starving the controls", async ({
  page,
}) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  await expect(
    page.getByLabel("Mouvements", { exact: true }).getByRole("button"),
  ).toHaveCount(14);
  await expect(
    page.getByRole("button", { name: "Mettre en pause", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Chorégraphie", exact: true })
      .locator("article"),
  ).toHaveCount(4);
  await page.getByRole("button", { name: "Static", exact: true }).click();
  const live = await artwork(page);
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 350)));
  expect(await artwork(page)).not.toBe(live);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await cdp.detach();
});

test("edits the real mascot in pause, persists settings, and restores defaults", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: "Static", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.locator("footer")).toHaveCount(0);
  await expect(
    page.getByLabel("Expressions", { exact: true }).getByRole("button"),
  ).toHaveCount(32);
  const before = await artwork(page);
  await page.getByRole("button", { name: "Nuage", exact: true }).click();
  await expect.poll(() => artwork(page)).not.toBe(before);
  await page.getByRole("button", { name: "Étoiles", exact: true }).click();
  await page
    .getByRole("button", { name: "Couleur #8b5cf6", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Expression Heureux", exact: true })
    .click();
  await page.getByRole("switch", { name: "Petites joues rosées" }).click();
  await page.getByText("Ajuster les yeux", { exact: true }).click();
  await setRange(page, "Taille des yeux", 150);
  await setRange(page, "Écartement des yeux", 130);
  await expect
    .poll(() =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).look, key),
    )
    .toMatchObject({
      shape: "nuage",
      eyes: "star",
      color: "#8b5cf6",
      expression: "heureux",
      blush: true,
      eyeGeometry: { size: 1.5, spacing: 1.3 },
    });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Nuage", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Expression Heureux", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Repartir de zéro", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Bulle", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("status", { name: "Messages de l’atelier", exact: true }),
  ).toContainText("départ");
});

test("plays, pauses, changes speed and protects interactive controls from Space", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  await expect(
    page.getByLabel("Mouvements", { exact: true }).getByRole("button"),
  ).toHaveCount(14);
  await preview(page).click();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Mettre en pause", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Vitesse de lecture").selectOption("2");
  await page.getByRole("switch", { name: "Suivre le curseur" }).click();
  const stage = page.getByRole("region", { name: "Aperçu", exact: true });
  const box = await stage.boundingBox();
  await page.mouse.move(box!.x + box!.width - 20, box!.y + 70);
  await page
    .getByRole("button", { name: "Mettre en pause", exact: true })
    .click();
  const paused = await artwork(page);
  await expect.poll(() => artwork(page)).toBe(paused);
  await page
    .getByRole("button", { name: "Mouvement suivant", exact: true })
    .click();
  await expect(
    page
      .getByLabel("Mouvements", { exact: true })
      .getByRole("button", { name: "Réflexion", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Static", exact: true }).click();
  const color = page.getByLabel("Couleur personnalisée au format hexadécimal");
  await color.fill("#12");
  await color.focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Animer la mascotte", exact: true }),
  ).toHaveCount(0);
  await expect(color).toHaveAttribute("aria-invalid", "true");
  await color.fill("#12");
  await expect(
    page.getByText("Utilise une couleur comme #FF5A1F."),
  ).toBeVisible();
  await color.fill("#123456");
  await expect(color).toHaveAttribute("aria-invalid", "false");
  await page.getByRole("switch", { name: "Petites joues rosées" }).focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  await page.getByRole("switch", { name: "Suivre le curseur" }).focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Animer la mascotte", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Animer la mascotte", exact: true })
    .focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Mettre en pause", exact: true }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.getByRole("button", { name: "Animer la mascotte", exact: true }),
  ).toBeVisible();
});

test("composes, reorders, seeks backward and forward, then plays the timeline", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  const timeline = page.getByRole("region", {
    name: "Chorégraphie",
    exact: true,
  });
  await page
    .getByLabel("Ajouter un mouvement", { exact: true })
    .selectOption("burst");
  await expect(timeline.locator("article")).toHaveCount(5);
  await page
    .getByRole("slider", { name: "Durée du mouvement 5", exact: true })
    .press("Home");
  await page
    .getByRole("button", {
      name: "Aller au mouvement 5 : Confettis",
      exact: true,
    })
    .press("Alt+ArrowLeft");
  await expect(timeline.locator("article").nth(3)).toContainText("Confettis");
  await page
    .getByRole("button", { name: "Retirer le mouvement 4", exact: true })
    .click();
  await expect(timeline.locator("article")).toHaveCount(4);
  await setRange(page, "Position dans la séquence", 4.8);
  const at = await artwork(page);
  await expect(timeline.locator('[aria-current="step"]')).toContainText(
    "En orbite",
  );
  await setRange(page, "Position dans la séquence", 0);
  await setRange(page, "Position dans la séquence", 4.8);
  expect(await artwork(page)).toBe(at);
  await page
    .getByRole("button", { name: "Jouer la séquence", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Mettre en pause", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .getByRole("slider", { name: "Position dans la séquence", exact: true })
        .inputValue(),
    )
    .not.toBe("0");
  await page
    .getByRole("button", { name: "Mettre en pause", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Planche des mouvements", exact: true })
    .click();
  await expect(
    page.getByLabel("Planche des mouvements", { exact: true }).getByRole("img"),
  ).toHaveCount(14);
  await expect(
    page.getByRole("button", { name: "Exporter en SVG", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Vue mascotte", exact: true }).click();
  await expect(preview(page)).toBeVisible();
});

test("downloads standalone SVG, transparent 1024px PNG and compatible JSON", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  // Export a particle/orbit state to check local paint references in the actual file.
  await page
    .getByLabel("Mouvements", { exact: true })
    .getByRole("button", { name: "En orbite", exact: true })
    .click();
  const getDownload = async (name: string) => {
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name, exact: true }).click();
    const download = await pending;
    return {
      name: download.suggestedFilename(),
      bytes: await readFile((await download.path())!),
    };
  };
  const svg = await getDownload("Exporter en SVG");
  expect(svg.name).toBe("maskot-orbit.svg");
  const validation = await page.evaluate((text) => {
    const svg = new DOMParser().parseFromString(text, "image/svg+xml");
    return {
      error: !!svg.querySelector("parsererror"),
      external: /(?:https?:\/\/[^\s"']+\.(?:png|svg)|var\(--)/.test(text),
      missing: [...text.matchAll(/url\(#([^)]+)\)/g)].filter(
        ([, id]) => !svg.getElementById(id),
      ).length,
    };
  }, svg.bytes.toString());
  expect(validation).toEqual({ error: false, external: false, missing: 0 });
  const png = await getDownload("Exporter en PNG");
  expect(png.bytes.subarray(1, 4).toString()).toBe("PNG");
  expect(png.bytes.readUInt32BE(16)).toBe(1024);
  expect(png.bytes.readUInt32BE(20)).toBe(1024);
  const pixels = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, 1024, 1024).data;
    return {
      corner: data[3],
      visible: data.some((value, index) => index % 4 === 3 && value > 100),
    };
  }, png.bytes.toString("base64"));
  expect(pixels).toEqual({ corner: 0, visible: true });
  const json = await getDownload("Exporter le look");
  const preset = JSON.parse(json.bytes.toString());
  expect(preset.version).toBe(1);
  expect(preset.timeline).toHaveLength(5);
  expect(preset.look.eyeGeometry.size).toBe(1);
});

test("imports legacy presets and rejects malformed, invalid and oversized files", async ({
  page,
}) => {
  const input = page.getByLabel("Importer un réglage de mascotte", {
    exact: true,
  });
  const importJson = async (value: string) =>
    input.setInputFiles({
      name: "look.json",
      mimeType: "application/json",
      buffer: Buffer.from(value),
    });
  const preset = {
    version: 1,
    look: {
      shape: "triangle",
      color: "#ABCDEF",
      expression: "curieux",
      eyes: "capsule",
      blush: false,
    },
    timeline: [{ state: "orbit", duration: 0.6 }],
  };
  await importJson(JSON.stringify(preset));
  await expect(
    page.getByRole("status", { name: "Messages de l’atelier", exact: true }),
  ).toContainText("importés");
  await expect(
    page.getByRole("button", { name: "Triangle", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).look.eyeGeometry.size,
      key,
    ),
  ).toBe(1);
  await importJson("{");
  await expect(
    page.getByRole("status", { name: "Messages de l’atelier", exact: true }),
  ).toContainText("JSON valide");
  await importJson(
    JSON.stringify({
      ...preset,
      timeline: [{ state: "orbit", duration: 0.5 }],
    }),
  );
  await expect(
    page.getByRole("status", { name: "Messages de l’atelier", exact: true }),
  ).toContainText("séquence valides");
  await importJson(" ".repeat(65537));
  await expect(
    page.getByRole("status", { name: "Messages de l’atelier", exact: true }),
  ).toContainText("trop volumineux");
  await expect(
    page.getByRole("button", { name: "Triangle", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await importJson(
    JSON.stringify({
      ...preset,
      timeline: Array.from({ length: 32 }, () => ({
        state: "idle",
        duration: 0.6,
      })),
    }),
  );
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  await expect(
    page.getByLabel("Ajouter un mouvement", { exact: true }),
  ).toBeDisabled();
  await importJson(JSON.stringify(preset));
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Retirer le mouvement 1",
      exact: true,
      includeHidden: true,
    }),
  ).toBeDisabled();
});

test("handles denied local storage and continues to support editing and exports", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("storage denied");
    };
    Storage.prototype.setItem = () => {
      throw new Error("quota exceeded");
    };
  });
  await page.reload();
  await expect(
    page.getByRole("status", { name: "Messages de l’atelier", exact: true }),
  ).toContainText("n’a pas pu être relu");
  await page.getByRole("button", { name: "Nuage", exact: true }).click();
  await expect(
    page.getByRole("status", { name: "Messages de l’atelier", exact: true }),
  ).toContainText("ne permet pas de sauvegarder");
  await expect(preview(page)).toBeVisible();
});

test("renders mobile and dark mode without page overflow or network font dependencies", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth <= innerWidth &&
            document.documentElement.scrollHeight <= innerHeight,
        ),
      )
      .toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "About", exact: true }).click();
  await page.getByRole("button", { name: "Thème sombre", exact: true }).click();
  await expect(page.locator("html")).toHaveClass("dark");
  await page.reload();
  await expect(page.locator("html")).toHaveClass("dark");
  await expect(preview(page)).toBeVisible();
  await page.screenshot({ path: "artifacts/mobile-dark.png", fullPage: true });
  await page.getByRole("button", { name: "Fond sombre", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Fond sombre", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Fond transparent", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Fond transparent", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].map((font) => ({
      family: font.family,
      status: font.status,
    }));
  });
  expect(fonts).toEqual(
    expect.arrayContaining([
      { family: "Source Sans 3 Variable", status: "loaded" },
      { family: "Space Grotesk Variable", status: "loaded" },
    ]),
  );
  await page.getByRole("button", { name: "About", exact: true }).click();
  await page.getByRole("button", { name: "Thème clair", exact: true }).click();
  await page.getByRole("button", { name: "Static", exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "artifacts/desktop-light.png",
    fullPage: true,
  });
});

test("opens About as a page and animates the same mascot to the right", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const nav = page.getByRole("navigation", { name: "Navigation Maskot" });
  await expect(nav.getByRole("button")).toHaveCount(3);
  await expect(nav.getByRole("link")).toHaveCount(0);
  const navBox = await nav.boundingBox();
  expect(Math.abs(navBox!.y + navBox!.height / 2 - 500)).toBeLessThan(2);
  const original = await preview(page).elementHandle();
  const before = await preview(page).boundingBox();
  await page.getByRole("button", { name: "About", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "Réglages de Maskot" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "À propos de Maskot" }),
  ).toBeVisible();
  await expect
    .poll(async () => (await preview(page).boundingBox())!.x)
    .toBeGreaterThan(before!.x + 200);
  expect(
    await original!.evaluate(
      (node) => node === document.querySelector("[data-mascot-preview] > svg"),
    ),
  ).toBe(true);
  await expect(
    page.getByRole("link", { name: "Un petit outil signé Plinka" }),
  ).toHaveAttribute("href", "https://plinka.eu");
  await page.screenshot({ path: "artifacts/about-desktop.png" });
  await page.getByRole("button", { name: "Static", exact: true }).click();
  await expect
    .poll(async () =>
      Math.abs((await preview(page).boundingBox())!.x - before!.x),
    )
    .toBeLessThan(2);
  const live = await artwork(page);
  await page.waitForTimeout(250);
  expect(await artwork(page)).not.toBe(live);
});

test("scrolls the complete eye and mood catalogs and persists the new styles", async ({
  page,
}) => {
  await expect(
    page.getByLabel("Silhouettes", { exact: true }).getByRole("button"),
  ).toHaveCount(32);
  const shapes = page.getByLabel("Silhouettes", { exact: true });
  await expect.poll(() => shapes.getByRole("img").count()).toBeGreaterThan(0);
  expect(await shapes.getByRole("img").count()).toBeLessThan(32);
  await shapes.getByRole("button", { name: "Vague", exact: true }).click();
  await expect(
    shapes.getByRole("button", { name: "Vague", exact: true }).getByRole("img"),
  ).toBeVisible();
  const eyes = page.getByLabel("Styles des yeux", { exact: true });
  const moods = page.getByLabel("Expressions", { exact: true });
  await expect(eyes.getByRole("button")).toHaveCount(32);
  await expect(moods.getByRole("button")).toHaveCount(32);
  expect(await eyes.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(
    true,
  );
  await eyes.getByRole("button", { name: "Haricots", exact: true }).click();
  await expect(eyes).toHaveAttribute("data-top", "true");
  await expect(eyes).toHaveAttribute("data-bottom", "false");
  await moods
    .getByRole("button", { name: "Expression Nostalgique", exact: true })
    .click();
  await page.reload();
  await expect(
    eyes.getByRole("button", { name: "Haricots", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    moods.getByRole("button", { name: "Expression Nostalgique", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("drags and stretches timeline cards while keeping keyboard editing available", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  const timeline = page.getByRole("region", {
    name: "Chorégraphie",
    exact: true,
  });
  const first = timeline.locator('[data-card="0"]');
  const third = timeline.locator('[data-card="2"]');
  const a = await first.boundingBox(),
    b = await third.boundingBox();
  await page.mouse.move(a!.x + a!.width / 2, a!.y + a!.height / 2);
  await page.mouse.down();
  await page.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
  await expect(timeline.locator('[data-card="2"]')).toHaveAttribute(
    "title",
    /Au repos/,
  );
  const handle = timeline.getByRole("slider", {
    name: "Durée du mouvement 3",
    exact: true,
  });
  const box = await handle.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box!.x + box!.width / 2 + 48,
    box!.y + box!.height / 2,
    { steps: 10 },
  );
  await page.mouse.up();
  await expect(handle).toHaveAttribute("aria-valuenow", "3");
  await handle.press("ArrowLeft");
  await expect(handle).toHaveAttribute("aria-valuenow", "2.9");
  await timeline.locator('[data-card="2"]').press("Alt+ArrowLeft");
  await expect(timeline.locator('[data-card="1"]')).toBeFocused();
  await page.screenshot({ path: "artifacts/motion-desktop.png" });
});

test("exports a real WebM with the complete montage and lazy-loads the encoder", async ({
  page,
}) => {
  test.setTimeout(90000);
  const resourceNames = () =>
    page.evaluate(() =>
      performance.getEntriesByType("resource").map((entry) => entry.name),
    );
  expect(
    (await resourceNames()).some((name) => /mascot-video-/.test(name)),
  ).toBe(false);
  await page
    .getByLabel("Importer un réglage de mascotte", { exact: true })
    .setInputFiles({
      name: "video.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          version: 1,
          look: {
            shape: "cercle",
            color: "#8b5cf6",
            expression: "complice",
            eyes: "heart",
            blush: false,
          },
          timeline: [
            { state: "idle", duration: 0.6 },
            { state: "orbit", duration: 0.6 },
          ],
        }),
      ),
    });
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  expect(
    (await resourceNames()).some((name) => /mascot-video-/.test(name)),
  ).toBe(false);
  await page
    .getByRole("button", { name: "Exporter le montage", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("1.2 secondes");
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exporter en WebM", exact: true })
    .click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("maskot-montage.webm");
  const bytes = await readFile((await download.path())!);
  expect(bytes.subarray(0, 4).toString("hex")).toBe("1a45dfa3");
  expect(bytes.length).toBeGreaterThan(3000);
  expect(
    (await resourceNames()).some((name) => /mascot-video-/.test(name)),
  ).toBe(true);
  const videoInfo = await page.evaluate(async (base64) => {
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "auto";
    const blob = await (await fetch(`data:video/webm;base64,${base64}`)).blob();
    const url = URL.createObjectURL(blob);
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("Cannot decode exported WebM"));
    });
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    const sample = async (time: number) => {
      video.currentTime = time;
      await new Promise<void>((resolve) => (video.onseeked = () => resolve()));
      ctx.drawImage(video, 0, 0, 64, 64);
      return [...ctx.getImageData(0, 0, 64, 64).data];
    };
    const first = await sample(0.1),
      last = await sample(1.1);
    const result = {
      width: video.videoWidth,
      height: video.videoHeight,
      duration: video.duration,
      changed: first.some((value, i) => Math.abs(value - last[i]) > 30),
      corner: first.slice(0, 4),
    };
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
    return result;
  }, bytes.toString("base64"));
  expect(videoInfo.width).toBe(1024);
  expect(videoInfo.height).toBe(1024);
  expect(videoInfo.duration).toBeCloseTo(1.2, 1);
  expect(videoInfo.changed).toBe(true);
  expect(videoInfo.corner[3]).toBe(255);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("status", { name: "Messages de l’atelier" }),
  ).toContainText("WebM exporté");
});

test("cancels video export and reports a missing WebCodecs encoder", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  await page
    .getByRole("button", { name: "Exporter le montage", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Exporter en WebM", exact: true })
    .click();
  await page.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.evaluate(() =>
    Object.defineProperty(globalThis, "VideoEncoder", {
      value: undefined,
      configurable: true,
    }),
  );
  await page
    .getByRole("button", { name: "Exporter le montage", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Exporter en WebM", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("WebCodecs");
  await page
    .getByRole("button", { name: "Fermer l’export vidéo", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("blinks naturally in Static and morphs eyes, silhouette and paint", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  const data = await page.evaluate(async () => {
    const samples: number[] = [];
    const start = performance.now();
    await new Promise<void>((resolve) => {
      function sample() {
        const path = document.querySelector(
          "[data-mascot-preview] mask path[transform]",
        )!;
        const m = path
          .getAttribute("transform")!
          .slice(7, -1)
          .split(",")
          .map(Number);
        samples.push(Math.abs(m[0] * m[3] - m[1] * m[2]));
        if (performance.now() - start > 2200) resolve();
        else requestAnimationFrame(sample);
      }
      sample();
    });
    return { min: Math.min(...samples), max: Math.max(...samples) };
  });
  expect(data.min / data.max).toBeLessThan(0.35);
  const frames = await page.evaluate(async () => {
    const svg = document.querySelector("[data-mascot-preview] > svg")!;
    const read = () => ({
      body: svg.querySelector("mask path")!.getAttribute("d"),
      eye: svg.querySelector("mask path[transform]")!.getAttribute("d"),
      color: svg.querySelector("path[mask]")!.getAttribute("fill"),
    });
    const before = read();
    (
      document.querySelector('[aria-label="Éclats"]') as HTMLButtonElement
    ).click();
    (
      document.querySelector('[aria-label="Nuage"]') as HTMLButtonElement
    ).click();
    (
      document.querySelector(
        '[aria-label="Couleur #8b5cf6"]',
      ) as HTMLButtonElement
    ).click();
    let middle = before;
    const end = performance.now() + 2000;
    while (performance.now() < end) {
      await new Promise(requestAnimationFrame);
      middle = read();
      if (
        middle.eye !== before.eye &&
        middle.body !== before.body &&
        middle.color !== before.color
      )
        break;
    }
    await new Promise((resolve) => setTimeout(resolve, 650));
    return { before, middle, after: read() };
  });
  expect(frames.middle.eye).not.toBe(frames.before.eye);
  expect(frames.middle.eye).not.toBe(frames.after.eye);
  expect(frames.middle.body).not.toBe(frames.before.body);
  expect(frames.middle.color).not.toBe(frames.before.color);
  expect(frames.middle.color).not.toBe("#8b5cf6");
  expect(frames.after.color).toBe("#8b5cf6");
  const motion = page.getByRole("button", { name: "Motion", exact: true });
  await motion.hover();
  await expect(motion.locator("span")).toHaveText("Motion");
  await expect(motion.locator("span")).toHaveCSS("opacity", "1");
});

test("morphs the property thumbnails and eye previews in place", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  const happy = page.getByRole("button", {
    name: "Expression Heureux",
    exact: true,
  });
  await happy.scrollIntoViewIfNeeded();
  await expect(happy.getByRole("img")).toBeVisible();
  const shapeFrames = await happy.evaluate(async (button) => {
    const svg = button.querySelector("svg")!;
    const body = svg.querySelector("mask path")!;
    const before = body.getAttribute("d");
    (
      document.querySelector('[aria-label="Nuage"]') as HTMLButtonElement
    ).click();
    let middle = before;
    for (let i = 0; i < 60; i++) {
      await new Promise(requestAnimationFrame);
      middle = body.getAttribute("d");
      if (middle !== before) break;
    }
    await new Promise((resolve) => setTimeout(resolve, 550));
    const after = body.getAttribute("d");
    return {
      before,
      middle,
      after,
      sameNode: svg === button.querySelector("svg"),
      finite: !String(after).match(/NaN|Infinity/),
    };
  });
  expect(shapeFrames.middle).not.toBe(shapeFrames.before);
  expect(shapeFrames.middle).not.toBe(shapeFrames.after);
  expect(shapeFrames.sameNode).toBe(true);
  expect(shapeFrames.finite).toBe(true);
  const eyeFrames = await happy.evaluate(async (button) => {
    const eye = button.querySelector("mask path[transform]")!;
    const before = eye.getAttribute("d");
    (
      document.querySelector('[aria-label="Étoiles"]') as HTMLButtonElement
    ).click();
    let middle = before;
    for (let i = 0; i < 60; i++) {
      await new Promise(requestAnimationFrame);
      middle = eye.getAttribute("d");
      if (middle !== before) break;
    }
    await new Promise((resolve) => setTimeout(resolve, 550));
    return { before, middle, after: eye.getAttribute("d") };
  });
  expect(eyeFrames.middle).not.toBe(eyeFrames.before);
  expect(eyeFrames.middle).not.toBe(eyeFrames.after);
  const colorFrames = await happy.evaluate(async (button) => {
    const painted = button.querySelector("path[mask]")!;
    const read = () => getComputedStyle(painted).fill;
    const before = read();
    (
      document.querySelector(
        '[aria-label="Couleur #8b5cf6"]',
      ) as HTMLButtonElement
    ).click();
    let middle = before;
    for (let i = 0; i < 60; i++) {
      await new Promise(requestAnimationFrame);
      middle = read();
      if (middle !== before) break;
    }
    await new Promise((resolve) => setTimeout(resolve, 550));
    return { before, middle, after: read() };
  });
  expect(colorFrames.middle).not.toBe(colorFrames.before);
  expect(colorFrames.middle).not.toBe(colorFrames.after);
  expect(colorFrames.after).toBe("rgb(139, 92, 246)");
  const cheeks = await happy.evaluate(async (button) => {
    const cheek = button.querySelector("g[clip-path] path")!;
    const read = () => Number(cheek.getAttribute("opacity"));
    const before = read();
    (
      document.querySelector(
        '[aria-label="Petites joues rosées"]',
      ) as HTMLButtonElement
    ).click();
    let middle = before;
    for (let i = 0; i < 60; i++) {
      await new Promise(requestAnimationFrame);
      middle = read();
      if (middle !== before) break;
    }
    await new Promise((resolve) => setTimeout(resolve, 550));
    return { before, middle, after: read() };
  });
  expect(cheeks.middle).toBeGreaterThan(cheeks.before);
  expect(cheeks.middle).toBeLessThan(cheeks.after);
  const eyes = page.getByRole("button", { name: "Gélules", exact: true });
  await eyes.scrollIntoViewIfNeeded();
  await page.getByText("Ajuster les yeux", { exact: true }).click();
  const geometry = await eyes.evaluate(async (button) => {
    const path = button.querySelector("path")!;
    const before = path.getAttribute("d");
    const input = document.querySelector(
      '[aria-label="Taille des yeux"]',
    ) as HTMLInputElement;
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, "150");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    let middle = before;
    for (let i = 0; i < 60; i++) {
      await new Promise(requestAnimationFrame);
      middle = path.getAttribute("d");
      if (middle !== before) break;
    }
    await new Promise((resolve) => setTimeout(resolve, 550));
    return { before, middle, after: path.getAttribute("d") };
  });
  expect(geometry.middle).not.toBe(geometry.before);
  expect(geometry.middle).not.toBe(geometry.after);
});

test("hands wheel scrolling to the parent at both ends of a property list", async ({
  page,
}) => {
  const list = page.getByLabel("Expressions", { exact: true });
  await list.scrollIntoViewIfNeeded();
  await list.evaluate((el) => {
    el.scrollTop = 100;
  });
  const initial = await list.evaluate((el) => ({
    inner: el.scrollTop,
    parent: el.parentElement!.parentElement!.parentElement!.scrollTop,
  }));
  await list.hover();
  await page.mouse.wheel(0, 70);
  await expect
    .poll(() => list.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(initial.inner);
  const parentSelector = await list.evaluate((el) => {
    const parent = el.closest("#settings")!.querySelector("div")!;
    parent.setAttribute("data-wheel-parent", "");
    return "[data-wheel-parent]";
  });
  const parent = page.locator(parentSelector);
  await list.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  const atBottom = await parent.evaluate((el) => el.scrollTop);
  await page.mouse.wheel(0, 200);
  await expect
    .poll(() => parent.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(atBottom);
  await list.scrollIntoViewIfNeeded();
  await list.evaluate((el) => {
    el.scrollTop = 0;
  });
  await list.hover();
  const atTop = await parent.evaluate((el) => el.scrollTop);
  expect(atTop).toBeGreaterThan(0);
  await page.mouse.wheel(0, -200);
  await expect
    .poll(() => parent.evaluate((el) => el.scrollTop))
    .toBeLessThan(atTop);
});

test("edits slider values with the input, keyboard and reset controls", async ({
  page,
}) => {
  const accordion = page.getByRole("button", {
    name: "Ajuster les yeux",
    exact: true,
  });
  await accordion.focus();
  await page.keyboard.press("Enter");
  await expect(accordion).toHaveAttribute("aria-expanded", "true");
  const input = page.getByRole("textbox", {
    name: "Valeur — Taille des yeux",
    exact: true,
  });
  const slider = page.getByRole("slider", {
    name: "Taille des yeux",
    exact: true,
  });
  await input.fill("147");
  await input.press("Enter");
  await expect(slider).toHaveValue("147");
  await input.fill("999");
  await input.press("Tab");
  await expect(input).toHaveValue("180");
  await expect(slider).toHaveValue("180");
  await input.fill("invalid");
  await input.press("Enter");
  await expect(input).toHaveValue("180");
  await input.fill("12");
  await input.press("Escape");
  await expect(input).toHaveValue("180");
  await page
    .getByRole("button", { name: "Réinitialiser taille des yeux", exact: true })
    .click();
  await expect(input).toHaveValue("100");
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(input).toHaveValue("101");
  const control = slider.locator("xpath=../..");
  const rect = (await control.boundingBox())!;
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width * 0.7, rect.y + rect.height / 2, {
    steps: 5,
  });
  await expect(control.locator('span[aria-hidden="true"]')).toContainText("%");
  await page.mouse.up();
  await expect(control.locator('span[aria-hidden="true"]')).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).look.eyeGeometry.size,
        key,
      ),
    )
    .toBe(Number(await input.inputValue()) / 100);
  const vertical = page.getByRole("textbox", {
    name: "Valeur — Position verticale",
    exact: true,
  });
  await vertical.fill("-12,5");
  await vertical.press("Tab");
  await expect(vertical).toHaveValue("-12");
  await expect(
    page.getByRole("slider", { name: "Position verticale", exact: true }),
  ).toHaveValue("-12");
  await accordion.click();
  await expect(accordion).toHaveAttribute("aria-expanded", "false");
  await expect(input).toBeHidden();
});

for (const width of [1440, 390]) {
  test(`adds custom colors from the first swatch and restores the palette at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const trigger = page.getByRole("button", {
      name: "Choisir une couleur personnalisée",
      exact: true,
    });
    const palette = trigger.locator("..");
    await expect(palette.getByRole("button").first()).toHaveAccessibleName(
      "Choisir une couleur personnalisée",
    );
    await trigger.click();
    const popup = page.getByRole("dialog", { name: "Une couleur bien à toi" });
    await expect(popup).toBeVisible();
    const box = (await popup.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    const hex = popup.getByRole("textbox", { name: "Code hexadécimal" });
    await hex.fill("#12");
    const add = popup.getByRole("button", {
      name: "Ajouter cette couleur à la palette",
    });
    await hex.press("Tab");
    await expect(hex).toHaveValue("2563EB");
    await hex.fill("#123ABC");
    await expect(add).toBeEnabled();
    await add.click();
    await expect(popup).toBeHidden();
    const swatch = page.getByRole("button", {
      name: "Couleur #123abc",
      exact: true,
    });
    await expect(swatch).toHaveAttribute("aria-pressed", "true");
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("maskot.colors.v1")!),
      ),
    ).toEqual(["#123abc"]);
    await page.reload();
    await expect(swatch).toHaveCount(1);
    await expect(swatch).toHaveAttribute("aria-pressed", "true");
    await trigger.click();
    await popup.getByRole("slider", { name: "Couleur", exact: true }).focus();
    await page.keyboard.press("ArrowLeft");
    const changed = await hex.inputValue();
    expect(changed).not.toBe("123ABC");
    await page.keyboard.press("Escape");
    await expect(popup).toBeHidden();
    await swatch.click();
    await trigger.click();
    await add.click();
    await expect(swatch).toHaveCount(1);
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("maskot.colors.v1")!),
      ),
    ).toEqual(["#123abc"]);
    await page
      .getByRole("button", { name: "Repartir de zéro", exact: true })
      .click();
    await expect(swatch).toHaveCount(1);
  });
}

test("previews a picker drag immediately and commits without repainting the catalogs on every move", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  await page
    .getByRole("button", {
      name: "Choisir une couleur personnalisée",
      exact: true,
    })
    .click();
  const popup = page.getByRole("dialog", { name: "Une couleur bien à toi" });
  const area = popup.getByRole("slider", { name: "Couleur", exact: true });
  await expect(area).toBeVisible();
  await expect(
    popup.getByRole("button", { name: "Prélever une couleur à l’écran" }),
  ).toBeVisible();
  await expect(
    popup.getByRole("button", { name: /Format de couleur/ }),
  ).toBeVisible();
  const catalogMarkup = () =>
    page.evaluate(() =>
      ["Silhouettes", "Styles des yeux", "Expressions"].map(
        (label) => document.querySelector(`[aria-label="${label}"]`)!.innerHTML,
      ),
    );
  await page.evaluate(() => new Promise(requestAnimationFrame));
  const catalogs = await catalogMarkup();
  const storedBefore = await page.evaluate(
    (key) => localStorage.getItem(key),
    key,
  );
  await page.evaluate((key) => {
    const original = Storage.prototype.setItem;
    const state = window as typeof window & { pickerSaves: number };
    state.pickerSaves = 0;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) state.pickerSaves++;
      return original.call(this, name, value);
    };
  }, key);
  const rect = (await area.boundingBox())!;
  const paint = preview(page).locator("path[mask]");
  const before = await paint.getAttribute("fill");
  await page.mouse.move(rect.x + rect.width * 0.2, rect.y + rect.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(
    rect.x + rect.width * 0.75,
    rect.y + rect.height * 0.7,
    { steps: 25 },
  );
  const during = await paint.getAttribute("fill");
  expect(during).not.toBe(before);
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    storedBefore,
  );
  expect(await catalogMarkup()).toEqual(catalogs);
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).look.color,
        key,
      ),
    )
    .toBe(during);
  await expect(paint).toHaveAttribute("fill", during!);
  expect(
    await page.evaluate(
      () => (window as typeof window & { pickerSaves: number }).pickerSaves,
    ),
  ).toBe(1);
  await popup.getByRole("button", { name: /Format de couleur/ }).click();
  await page.getByRole("menuitemradio", { name: /^RGB/ }).click();
  const red = popup.getByRole("spinbutton", { name: "Rouge", exact: true });
  await red.fill("128");
  await red.press("Enter");
  await expect.poll(() => paint.getAttribute("fill")).toMatch(/^#80/i);
});
