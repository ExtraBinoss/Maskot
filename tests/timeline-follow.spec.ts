import { expect, test } from "@playwright/test";

test.use({
  hasTouch: true,
  isMobile: true,
  viewport: { width: 390, height: 844 },
});

test("follows playback outside the viewport and fades both horizontal overflow edges", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Mouvement", exact: true })
    .tap();
  await page
    .getByRole("button", { name: "Générer 10 mouvements", exact: true })
    .tap();
  const track = page.locator("[data-timeline-track]");
  await expect(track).toHaveAttribute("data-top", "false");
  await expect(track).toHaveAttribute("data-bottom", "true");
  await expect(track).toHaveCSS("mask-image", /to right/);
  const seek = page.getByRole("slider", { name: "Position dans la séquence" });
  const ruler = (await seek.boundingBox())!;
  // Seek near the visible right edge, then let playback carry it off screen.
  await page.touchscreen.tap(345, ruler.y + ruler.height / 2);
  await expect
    .poll(() => track.evaluate((node) => node.scrollLeft), { timeout: 7000 })
    .toBeGreaterThan(100);
  await expect(track).toHaveAttribute("data-top", "true");
  await expect(track).toHaveAttribute("data-bottom", "true");
  await expect(track).toHaveCSS("mask-image", /to right/);
  await page
    .getByRole("button", { name: "Mettre en pause", exact: true })
    .tap();
  const current = await track.evaluate((node) => node.scrollLeft);
  await page.waitForTimeout(350);
  expect(
    Math.abs((await track.evaluate((node) => node.scrollLeft)) - current),
  ).toBeLessThan(1);
  await track.evaluate((node) => (node.scrollLeft = node.scrollWidth));
  await expect(track).toHaveAttribute("data-bottom", "false");
  await expect(track).toHaveCSS("mask-image", /to right/);
});

test("selects transparent video by default with one full-width background control", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Mouvement", exact: true })
    .tap();
  await page.getByRole("button", { name: "Exporter", exact: true }).tap();
  await page
    .getByRole("button", { name: "Exporter le montage", exact: true })
    .tap();
  const dialog = page.getByRole("dialog", {
    name: "Emporte le mouvement.",
    exact: true,
  });
  const group = dialog.getByRole("group", {
    name: "Fond de la vidéo",
    exact: true,
  });
  await expect(
    group.getByRole("button", { name: "Transparent", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await group.getByRole("button", { name: "Blanc", exact: true }).tap();
  await expect(
    group.getByRole("button", { name: "Blanc", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await group.getByRole("button", { name: "Noir", exact: true }).tap();
  await expect(
    group.getByRole("button", { name: "Noir", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(group.getByRole("button")).toHaveCount(3);
});
