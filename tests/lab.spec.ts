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

test("keeps Static still, opens tools immediately and reserves the footer for About", async ({
  page,
}) => {
  await expect(page).toHaveTitle("Maskot — Créateur de mascottes SVG");
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
  ).toHaveCount(29);
  expect(await lazyTools()).toHaveLength(0);
  await page.getByRole("button", { name: "À propos", exact: true }).click();
  await expect(page.locator("footer")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Maskot", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Plinka", exact: true }),
  ).toHaveAttribute("href", "https://plinka.eu");
  await expect(
    page.getByRole("link", { name: "Maskot, un projet Plinka", exact: true }),
  ).toHaveText("maskot.");
  await page.getByRole("button", { name: "Statique", exact: true }).click();
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
  ).toHaveCount(29);
  await expect(
    page.getByRole("button", { name: "Mettre en pause", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Chorégraphie", exact: true })
      .locator("article"),
  ).toHaveCount(4);
  await page.getByRole("button", { name: "Statique", exact: true }).click();
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
    page.getByRole("button", { name: "Statique", exact: true }),
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
  ).toHaveCount(29);
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
  await page.getByRole("button", { name: "Statique", exact: true }).click();
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
    .getByRole("button", { name: "Ajouter un mouvement", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confettis", exact: true })
    .click();
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
    .getByRole("button", { name: "Animer la mascotte", exact: true })
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
  ).toHaveCount(29);
  await expect(
    page.getByRole("button", { name: "Exporter en SVG", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Vue mascotte", exact: true }).click();
  await expect(preview(page)).toBeVisible();
});

test("downloads standalone SVG and transparent 1024px PNG", async ({
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
});

test("restores legacy saved presets, validates saved data and enforces montage limits", async ({
  page,
}) => {
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
  const restore = async (value: string) => {
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
      key,
      value,
    });
    await page.reload();
  };
  await restore(JSON.stringify(preset));
  await expect(
    page.getByRole("button", { name: "Triangle", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Retirer le mouvement 1",
      exact: true,
      includeHidden: true,
    }),
  ).toBeDisabled();
  await restore(
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
    page.getByRole("button", { name: "Ajouter un mouvement", exact: true }),
  ).toBeDisabled();
  await restore("{");
  await expect(
    page.getByRole("status", { name: "Messages de l’atelier", exact: true }),
  ).toContainText("n’a pas pu être relu");
  await expect(
    page.getByRole("button", { name: "Bulle", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
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
  await page.getByRole("button", { name: "À propos", exact: true }).click();
  await page.getByRole("button", { name: "Thème sombre", exact: true }).click();
  await expect(page.locator("html")).toHaveClass("dark");
  await page.reload();
  await expect(page.locator("html")).toHaveClass("dark");
  await expect(preview(page)).toBeVisible();
  await page.screenshot({ path: "artifacts/mobile-dark.png", fullPage: true });
  await expect(page.getByText("Fond du canevas", { exact: true })).toHaveCount(
    0,
  );
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
  await page.getByRole("button", { name: "À propos", exact: true }).click();
  await page.getByRole("button", { name: "Thème clair", exact: true }).click();
  await page.getByRole("button", { name: "Statique", exact: true }).click();
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
  await page.getByRole("button", { name: "À propos", exact: true }).click();
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
    page.getByRole("link", { name: "Plinka", exact: true }),
  ).toHaveAttribute("href", "https://plinka.eu");
  await page.screenshot({ path: "artifacts/about-desktop.png" });
  await page.getByRole("button", { name: "Statique", exact: true }).click();
  await expect
    .poll(async () =>
      Math.abs((await preview(page).boundingBox())!.x - before!.x),
    )
    .toBeLessThan(2);
  const live = await artwork(page);
  await page.waitForTimeout(250);
  expect(await artwork(page)).not.toBe(live);
});

test("keeps About on one screen and follows the pointer without enabling Motion tracking", async ({
  page,
}) => {
  await page.getByRole("button", { name: "À propos", exact: true }).click();
  const about = page.getByRole("region", { name: "À propos de Maskot" });
  for (const size of [
    { width: 1440, height: 900 },
    { width: 844, height: 390 },
    { width: 768, height: 700 },
    { width: 390, height: 700 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(size);
    await expect
      .poll(() =>
        about.evaluate((el) => ({
          height: el.clientHeight,
          scroll: el.scrollHeight,
          width: el.clientWidth,
          scrollWidth: el.scrollWidth,
        })),
      )
      .toEqual({
        height: size.height,
        scroll: size.height,
        width: size.width,
        scrollWidth: size.width,
      });
    await expect(
      about.getByRole("button", { name: "English", exact: true }),
    ).toBeInViewport();
    await expect(
      about.getByRole("button", { name: "Thème clair", exact: true }),
    ).toBeInViewport();
    await expect(
      about.getByRole("link", { name: "Plinka", exact: true }),
    ).toBeInViewport();
    await expect(about.locator('img[src="/plinka.svg"]')).toBeVisible();
  }
  await expect(about).not.toContainText(
    /Grok bot inspired|Made to be yours|Créé avec|ExtraBinoss/,
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  const eyes = () =>
    preview(page)
      .locator("g[clip-path] > path[transform]")
      .first()
      .getAttribute("transform");
  await page.mouse.move(100, 200);
  const left = await eyes();
  await page.mouse.move(1400, 700);
  await expect.poll(eyes).not.toBe(left);
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  await expect(
    page.getByRole("switch", { name: "Suivre le curseur" }),
  ).toHaveAttribute("aria-checked", "false");
});

test("expands the navigation itself with all labels and supports keyboard focus", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const nav = page.getByRole("navigation", { name: "Navigation Maskot" });
  const compact = (await nav.boundingBox())!;
  await nav.hover();
  await expect(nav).toHaveAttribute("data-expanded", "true");
  await expect
    .poll(async () => (await nav.boundingBox())!.width)
    .toBeGreaterThan(150);
  for (const name of ["Statique", "Motion", "À propos"]) {
    await expect(
      nav.getByRole("button", { name, exact: true }).locator("span").last(),
    ).toHaveCSS("opacity", "1");
  }
  expect(
    Math.abs((await nav.boundingBox())!.y + compact.height / 2 - 500),
  ).toBeLessThan(1);
  await page.mouse.move(700, 30);
  await expect
    .poll(async () => (await nav.boundingBox())!.width)
    .toBeLessThan(55);
  await nav.getByRole("button", { name: "Statique", exact: true }).focus();
  await expect(nav).toHaveAttribute("data-expanded", "true");
  await expect
    .poll(async () => (await nav.boundingBox())!.width)
    .toBeGreaterThan(150);
});

test("switches the whole studio between French and English and remembers the language", async ({
  page,
}) => {
  await page.getByRole("button", { name: "À propos", exact: true }).click();
  const original = await preview(page).elementHandle();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle("Maskot — Free SVG Mascot Creator");
  await expect(
    page.getByRole("button", { name: "System theme", exact: true }),
  ).toBeVisible();
  expect(
    await original!.evaluate(
      (node) => node === document.querySelector("[data-mascot-preview] > svg"),
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Static", exact: true }).click();
  await page.getByRole("button", { name: "Cloud", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Eye style 32 looks", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Expression: Happy", exact: true }),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Choose a custom color", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog", { name: "Color", exact: true })
      .getByRole("textbox", { name: "Hex code" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Export timeline", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("switch", { name: "Follow cursor", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("button", { name: "Cloud", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "About", exact: true }).click();
  await page.getByRole("button", { name: "Français", exact: true }).click();
  await page.getByRole("button", { name: "Statique", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Nuage", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
});

test("animates theme changes and respects reduced motion", async ({ page }) => {
  await page.emulateMedia({
    reducedMotion: "no-preference",
    colorScheme: "light",
  });
  await page.reload();
  await page.getByRole("button", { name: "À propos", exact: true }).click();
  await page.evaluate(() => {
    const native = document.startViewTransition.bind(document);
    const state = window as typeof window & { themeTransitions: number };
    state.themeTransitions = 0;
    document.startViewTransition = (
      ...args: Parameters<Document["startViewTransition"]>
    ) => {
      state.themeTransitions++;
      return native(...args);
    };
  });
  await page.getByRole("button", { name: "Thème sombre", exact: true }).click();
  await expect(page.locator("html")).toHaveClass("dark");
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { themeTransitions: number })
          .themeTransitions,
    ),
  ).toBe(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Thème clair", exact: true }).click();
  await expect(page.locator("html")).not.toHaveClass("dark");
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { themeTransitions: number })
          .themeTransitions,
    ),
  ).toBe(1);
});

test("scrolls the complete eye and mood catalogs and persists the new styles", async ({
  page,
}) => {
  await expect(
    page.getByLabel("Silhouettes", { exact: true }).getByRole("button"),
  ).toHaveCount(57);
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
  await page.evaluate(
    (key) =>
      localStorage.setItem(
        key,
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
            { state: "orb-working", duration: 0.6 },
            { state: "symbol-loading", duration: 0.6 },
          ],
        }),
      ),
    key,
  );
  await page.reload();
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  expect(
    (await resourceNames()).some((name) => /mascot-video-/.test(name)),
  ).toBe(false);
  await page
    .getByRole("button", { name: "Exporter le montage", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("1,2 secondes");
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
          "[data-mascot-preview] g[clip-path] > path[transform]",
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
      body: svg.querySelector("g[opacity] > path")!.getAttribute("d"),
      eye: svg
        .querySelector("g[clip-path] > path[transform]")!
        .getAttribute("d"),
      color: svg.querySelector("g[opacity] > path")!.getAttribute("fill"),
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
  await expect(motion.locator("span").last()).toHaveText("Motion");
  await expect(motion.locator("span").last()).toHaveCSS("opacity", "1");
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
    const body = svg.querySelector("g[opacity] > path")!;
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
    const eye = button.querySelector("g[clip-path] > path[transform]")!;
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
    const painted = button.querySelector("g[opacity] > path")!;
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
    const cheek = button.querySelector('g[clip-path] path[fill="#fffaf3"]')!;
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
  test(`opens the complete picker in its final position without loading at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.reload();
    const trigger = page.getByRole("button", {
      name: "Choisir une couleur personnalisée",
      exact: true,
    });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.evaluate((button) => {
      const panel = button.closest("#settings")!.querySelector("div")!;
      panel.scrollTop +=
        button.getBoundingClientRect().top - (window.innerHeight - 180);
    });
    // Once the studio is ready, opening this control needs no additional code.
    await page.route("**/*.js", (route) => route.abort());
    await page.evaluate(() => {
      type Frame = {
        x: number;
        y: number;
        height: number;
        side: string | null;
        complete: boolean;
      };
      const state = window as typeof window & {
        pickerOpening: { raf: number; frames: Frame[] };
      };
      state.pickerOpening = { raf: 0, frames: [] };
      const sample = () => {
        const popup = document.querySelector<HTMLElement>(
          '[data-slot="popover-content"][data-open]',
        );
        const positioner = popup?.closest<HTMLElement>('[role="presentation"]');
        if (
          popup &&
          positioner &&
          Number(getComputedStyle(positioner).opacity) > 0 &&
          Number(getComputedStyle(popup).opacity) > 0
        ) {
          const rect = popup.getBoundingClientRect();
          state.pickerOpening.frames.push({
            x: rect.x,
            y: rect.y,
            height: rect.height,
            side: popup.getAttribute("data-side"),
            complete:
              !!popup.querySelector('[data-slot="color-picker-area"]') &&
              !popup.textContent?.includes("Un petit instant"),
          });
        }
        state.pickerOpening.raf = requestAnimationFrame(sample);
      };
      sample();
    });
    await trigger.click();
    const popup = page.getByRole("dialog", { name: "Couleur", exact: true });
    await expect(
      popup.getByRole("slider", { name: "Couleur", exact: true }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as typeof window & { pickerOpening: { frames: unknown[] } })
              .pickerOpening.frames.length,
        ),
      )
      .toBeGreaterThan(10);
    const frames = await page.evaluate(() => {
      const state = (
        window as typeof window & {
          pickerOpening: {
            raf: number;
            frames: {
              x: number;
              y: number;
              height: number;
              side: string | null;
              complete: boolean;
            }[];
          };
        }
      ).pickerOpening;
      cancelAnimationFrame(state.raf);
      return state.frames;
    });
    expect(frames.every((frame) => frame.complete)).toBe(true);
    expect([...new Set(frames.map((frame) => frame.side))]).toEqual(["top"]);
    for (const dimension of ["x", "y", "height"] as const) {
      const values = frames.map((frame) => frame[dimension]);
      expect(Math.max(...values) - Math.min(...values)).toBeLessThan(1);
    }
  });

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
    const popup = page.getByRole("dialog", { name: "Couleur", exact: true });
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
  const popup = page.getByRole("dialog", { name: "Couleur", exact: true });
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
  const paint = preview(page).locator("g[opacity] > path");
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

test("uses a glass add popover, centered playback, styled zoom and timeline undo/redo", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  const timeline = page.getByRole("region", {
    name: "Chorégraphie",
    exact: true,
  });
  const play = page.getByRole("button", {
    name: "Animer la mascotte",
    exact: true,
  });
  const [playBox, mascotBox] = await Promise.all([
    play.boundingBox(),
    preview(page).boundingBox(),
  ]);
  expect(
    Math.abs(
      playBox!.x + playBox!.width / 2 - mascotBox!.x - mascotBox!.width / 2,
    ),
  ).toBeLessThan(1);
  const undo = page.getByRole("button", {
    name: "Annuler la modification",
    exact: true,
  });
  const redo = page.getByRole("button", { name: "Rétablir", exact: true });
  await expect(undo).toBeDisabled();
  await page
    .getByRole("button", { name: "Ajouter un mouvement", exact: true })
    .click();
  const popover = page.getByRole("dialog");
  await expect(popover.locator('[data-slot="popover-title"]')).toHaveText(
    "Ajouter un mouvement",
  );
  expect(
    await popover.evaluate((el) => getComputedStyle(el).backdropFilter),
  ).toContain("blur");
  await expect(popover.locator("select")).toHaveCount(0);
  await popover.getByRole("button", { name: "Confettis", exact: true }).click();
  await expect(popover).toBeHidden();
  await expect(timeline.locator("article")).toHaveCount(5);
  await undo.click();
  await expect(timeline.locator("article")).toHaveCount(4);
  await page.keyboard.press("Control+Shift+z");
  await expect(timeline.locator("article")).toHaveCount(5);
  const duration = page.getByRole("slider", {
    name: "Durée du mouvement 5",
    exact: true,
  });
  const box = (await duration.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 48, box.y + box.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
  await expect(duration).toHaveAttribute("aria-valuenow", "3");
  await page.keyboard.press("Control+z");
  await expect(duration).toHaveAttribute("aria-valuenow", "2");
  await redo.click();
  await expect(duration).toHaveAttribute("aria-valuenow", "3");
  const zoom = page.getByRole("textbox", {
    name: "Valeur — Zoom de la timeline",
    exact: true,
  });
  await zoom.fill("150");
  await zoom.press("Enter");
  await expect(
    page.getByRole("slider", { name: "Zoom de la timeline", exact: true }),
  ).toHaveValue("150");
});

test("updates eyes throughout a drag without catalog churn, persistence or a trailing morph", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Ajuster les yeux", exact: true })
    .click();
  const input = page.getByRole("slider", {
    name: "Taille des yeux",
    exact: true,
  });
  const control = input.locator("xpath=../..");
  await control.scrollIntoViewIfNeeded();
  const baseline = await page
    .getByLabel("Styles des yeux", { exact: true })
    .innerHTML();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    (window as typeof window & { presetWrites: number }).presetWrites = 0;
    Storage.prototype.setItem = function (key, value) {
      if (key === "mascotlab.preset.v1")
        (window as typeof window & { presetWrites: number }).presetWrites++;
      return original.call(this, key, value);
    };
  });
  const eye = preview(page).locator("g[clip-path] > path").first();
  const before = await eye.getAttribute("d");
  const box = (await control.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2);
  await page.mouse.down();
  const states: string[] = [];
  for (const fraction of [0.4, 0.55, 0.7, 0.85]) {
    await page.mouse.move(
      box.x + box.width * fraction,
      box.y + box.height / 2,
      { steps: 3 },
    );
    states.push((await eye.getAttribute("d"))!);
  }
  expect(new Set(states).size).toBe(4);
  expect(states[0]).not.toBe(before);
  expect(
    await page.getByLabel("Styles des yeux", { exact: true }).innerHTML(),
  ).toBe(baseline);
  expect(
    await page.evaluate(
      () => (window as typeof window & { presetWrites: number }).presetWrites,
    ),
  ).toBe(0);
  await page.mouse.up();
  const released = await eye.getAttribute("d");
  await page.waitForTimeout(160);
  expect(await eye.getAttribute("d")).toBe(released);
  expect(
    await page.evaluate(
      () => (window as typeof window & { presetWrites: number }).presetWrites,
    ),
  ).toBe(1);
  const reset = page.getByRole("button", {
    name: "Réinitialiser les yeux",
    exact: true,
  });
  const resting = await reset.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  await reset.hover();
  await expect
    .poll(() => reset.evaluate((el) => getComputedStyle(el).backgroundColor))
    .not.toBe(resting);
});

test("offers 16 symbols and 9 vendored orbs with vector exports and no unused face settings", async ({
  page,
}) => {
  const shapes = page.getByLabel("Silhouettes", { exact: true });
  await shapes
    .getByRole("button", { name: "Exclamation", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Style des yeux/ }),
  ).toHaveCount(0);
  await expect(preview(page).locator("circle")).toHaveCount(1);
  const symbol = await artwork(page);
  await shapes.getByRole("button", { name: "Chargement", exact: true }).click();
  expect(await artwork(page)).not.toBe(symbol);
  await shapes
    .getByRole("button", { name: "Orbe · Recherche", exact: true })
    .click();
  await expect(
    shapes.getByRole("button", { name: "Orbe · Recherche", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(await preview(page).locator("path").count()).toBeLessThan(20);
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exporter en SVG", exact: true })
    .click();
  const svg = (await readFile((await (await pending).path())!)).toString();
  expect(svg).not.toMatch(/canvas|<image|NaN|Infinity/);
  expect(svg).toContain("<path");
  await page.reload();
  await expect(
    shapes.getByRole("button", { name: "Orbe · Recherche", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await shapes.getByRole("button", { name: "Bulle", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Style des yeux 32 regards",
      exact: true,
    }),
  ).toBeVisible();
  const [svgBox, pngBox] = await Promise.all([
    page
      .getByRole("button", { name: "Exporter en SVG", exact: true })
      .boundingBox(),
    page
      .getByRole("button", { name: "Exporter en PNG", exact: true })
      .boundingBox(),
  ]);
  expect(svgBox!.width).toBe(pngBox!.width);
  expect(svgBox!.height).toBe(pngBox!.height);
  await expect(
    page.getByRole("button", { name: "Importer un look", exact: true }),
  ).toHaveCount(0);
});

test("enters on every load and keeps antialiased body edges blue in dark mode", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() =>
    localStorage.setItem("mascotlab-theme", JSON.stringify("dark")),
  );
  await page.reload();
  const arrival = preview(page).locator("..");
  await expect
    .poll(() => arrival.evaluate((el) => Number(getComputedStyle(el).opacity)))
    .toBe(1);
  await expect
    .poll(() => arrival.evaluate((el) => getComputedStyle(el).transform))
    .toMatch(/^none$|^matrix\(1, 0, 0, 1, 0, 0\)$/);
  const pixels = await preview(page).evaluate(async (element) => {
    const image = new Image();
    image.src =
      "data:image/svg+xml," +
      encodeURIComponent(new XMLSerializer().serializeToString(element));
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1024;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0, 1024, 1024);
    const data = context.getImageData(0, 0, 1024, 1024).data;
    let edges = 0,
      pale = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 30 && data[i + 3] < 225) {
        edges++;
        if (data[i] > 90 || data[i + 1] > 140) pale++;
      }
    }
    return { edges, pale };
  });
  expect(pixels.edges).toBeGreaterThan(100);
  expect(pixels.pale).toBe(0);
  await page.getByRole("button", { name: "À propos", exact: true }).click();
  const group = page.getByRole("group", {
    name: "Thème de l’interface",
    exact: true,
  });
  await expect(group).toHaveAttribute("data-slot", "toggle-group");
  const dark = group.getByRole("button", { name: "Thème sombre", exact: true });
  await expect(dark).toHaveAttribute("aria-pressed", "true");
  await expect(group.locator('[data-slot="segmented-indicator"]')).toHaveCSS(
    "background-color",
    "rgb(37, 99, 235)",
  );
  await expect(group.getByRole("button")).toHaveCount(3);
});
