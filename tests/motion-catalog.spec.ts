import { test, expect, type Page, type Locator } from "@playwright/test";

const drawing = (tile: Locator) =>
  tile.locator("svg").evaluate((element) => {
    let hash = 2166136261;
    for (const char of element.innerHTML)
      hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    return hash >>> 0;
  });

const openPicker = async (page: Page) => {
  await page
    .getByRole("button", { name: "Ajouter un mouvement", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator('[data-slot="popover-title"]')).toHaveText(
    "Ajouter un mouvement",
  );
  return dialog;
};

test("offers all 29 animations in the panel and the shadcn add popover on desktop and mobile", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mouvement", exact: true }).click();
  await expect(
    page.getByLabel("Mouvements", { exact: true }).getByRole("button"),
  ).toHaveCount(29);
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(viewport);
    const dialog = await openPicker(page);
    await expect(dialog.getByRole("button")).toHaveCount(29);
    await expect(
      dialog
        .getByRole("region", { name: "Mouvements classiques" })
        .getByRole("button"),
    ).toHaveCount(15);
    await expect(
      dialog
        .getByRole("region", { name: "Orbes pensants" })
        .getByRole("button"),
    ).toHaveCount(9);
    await expect(
      dialog
        .getByRole("region", { name: "Symboles animés" })
        .getByRole("button"),
    ).toHaveCount(5);
    await dialog
      .getByRole("button", { name: "Atome", exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      dialog.getByRole("button", { name: "Atome", exact: true }),
    ).toBeInViewport();
    const box = await dialog.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(8);
    expect(box!.y).toBeGreaterThanOrEqual(8);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width - 8);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height - 8);
    expect(
      await dialog.evaluate((el) => getComputedStyle(el).backdropFilter),
    ).toContain("blur");
    expect(
      await dialog.evaluate((el) => getComputedStyle(el).borderTopWidth),
    ).toBe("0px");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Ajouter un mouvement", exact: true }),
    ).toBeFocused();
  }
});

test("plays hovered and focused previews without editing the timeline and stops on exit or reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: "Mouvement", exact: true }).click();
  await page
    .getByRole("button", { name: "Mettre en pause", exact: true })
    .click();
  const main = page.getByRole("img", {
    name: "Aperçu de la mascotte",
    exact: true,
  });
  const mainFrame = await main.innerHTML();
  const saved = await page.evaluate(() =>
    localStorage.getItem("mascotlab.preset.v1"),
  );
  const dialog = await openPicker(page);
  const orb = dialog.getByRole("button", {
    name: "Orbe · Travail",
    exact: true,
  });
  await orb.hover();
  await expect(orb.locator("svg")).toBeVisible();
  const first = await drawing(orb);
  await expect.poll(() => drawing(orb)).not.toBe(first);
  const playing = await drawing(orb);
  await expect.poll(() => drawing(orb)).not.toBe(playing);
  await dialog.locator('[data-slot="popover-title"]').hover();
  await page.waitForTimeout(120);
  const stopped = await drawing(orb);
  await page.waitForTimeout(180);
  expect(await drawing(orb)).toBe(stopped);
  const glyph = dialog.getByRole("button", { name: "Eurêka !", exact: true });
  await glyph.hover();
  const glyphFirst = await drawing(glyph);
  await expect.poll(() => drawing(glyph)).not.toBe(glyphFirst);
  const glyphPlaying = await drawing(glyph);
  await expect.poll(() => drawing(glyph)).not.toBe(glyphPlaying);
  const loading = dialog.getByRole("button", {
    name: "Chargement",
    exact: true,
  });
  await loading.focus();
  await expect(loading.locator("svg")).toBeVisible();
  const focused = await drawing(loading);
  await expect.poll(() => drawing(loading)).not.toBe(focused);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await loading.hover();
  await page.waitForTimeout(120);
  const reduced = await drawing(loading);
  await page.waitForTimeout(180);
  expect(await drawing(loading)).toBe(reduced);
  expect(await main.innerHTML()).toBe(mainFrame);
  expect(
    await page.evaluate(() => localStorage.getItem("mascotlab.preset.v1")),
  ).toBe(saved);
});

test("adds orbs and symbols as real timeline clips, supports undo and restores them after reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mouvement", exact: true }).click();
  const timeline = page.getByRole("region", {
    name: "Chorégraphie",
    exact: true,
  });
  for (const label of ["Orbe · Travail", "Chargement"]) {
    const dialog = await openPicker(page);
    await dialog.getByRole("button", { name: label, exact: true }).click();
    await expect(dialog).toBeHidden();
  }
  await expect(timeline.locator("article")).toHaveCount(6);
  await page
    .getByRole("button", { name: "Annuler la modification", exact: true })
    .click();
  await expect(timeline.locator("article")).toHaveCount(5);
  await page.getByRole("button", { name: "Rétablir", exact: true }).click();
  await expect(timeline.locator("article")).toHaveCount(6);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("mascotlab.preset.v1")!),
  );
  expect(saved.look.shape).toBe("cercle");
  expect(
    saved.timeline.slice(-2).map((step: { state: string }) => step.state),
  ).toEqual(["orb-working", "symbol-loading"]);
  await page.reload();
  await page.getByRole("button", { name: "Mouvement", exact: true }).click();
  await expect(timeline.locator("article")).toHaveCount(6);
  await expect(timeline.locator("article").nth(4)).toContainText(
    "Orbe · Travail",
  );
  await expect(timeline.locator("article").nth(5)).toContainText("Chargement");
  await page
    .getByRole("slider", { name: "Position dans la séquence", exact: true })
    .press("End");
  await expect(
    page
      .getByRole("img", { name: "Aperçu de la mascotte", exact: true })
      .locator(':scope > g[opacity="1"] > g > path'),
  ).toHaveCount(0);
});
