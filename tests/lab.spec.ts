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
  await page.getByRole("button", { name: "Séquence", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "Chorégraphie", exact: true })
      .locator("article"),
  ).toHaveCount(4);
  await page.getByRole("button", { name: "Static", exact: true }).click();
  const paused = await artwork(page);
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 350)));
  expect(await artwork(page)).toBe(paused);
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
  ).toHaveCount(16);
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
      blush: false,
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
    page.getByRole("button", { name: "Galet", exact: true }),
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
  await page.getByRole("button", { name: "Séquence", exact: true }).click();
  const timeline = page.getByRole("region", {
    name: "Chorégraphie",
    exact: true,
  });
  await page
    .getByLabel("Ajouter un mouvement", { exact: true })
    .selectOption("burst");
  await expect(timeline.locator("article")).toHaveCount(5);
  await setRange(page, "Durée du mouvement 5", 0.6);
  await page
    .getByRole("button", {
      name: "Déplacer le mouvement 5 à gauche",
      exact: true,
    })
    .click();
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
  expect(preset.timeline).toHaveLength(4);
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
  await page.getByRole("button", { name: "Séquence", exact: true }).click();
  await expect(
    page.getByLabel("Ajouter un mouvement", { exact: true }),
  ).toBeDisabled();
  await importJson(JSON.stringify(preset));
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  await page.getByRole("button", { name: "Séquence", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Retirer le mouvement 1", exact: true }),
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
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
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
  await page.getByRole("button", { name: "Thème clair", exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "artifacts/desktop-light.png",
    fullPage: true,
  });
});
