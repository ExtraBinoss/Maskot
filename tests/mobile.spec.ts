import { expect, test, type Page, type Locator } from "@playwright/test";

test.use({ hasTouch: true, isMobile: true });

async function dismissWithTouch(page: Page, handle: Locator, direction = 1) {
  const box = (await handle.boundingBox())!;
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  const session = await page.context().newCDPSession(page);
  try {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y, id: 1 }],
    });
    for (let i = 1; i <= 12; i++) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          {
            x,
            y:
              y +
              (direction *
                (i * Math.max(280, page.viewportSize()!.height * 0.55))) /
                12,
            id: 1,
          },
        ],
      });
      if (i === 4 && direction === 1)
        await expect
          .poll(() =>
            handle.evaluate(
              (node) => getComputedStyle(node, "::after").opacity,
            ),
          )
          .toBe("1");
      await page.waitForTimeout(12);
    }
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } finally {
    await session.detach();
  }
}

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
]) {
  test(`mobile modes, touch controls and draggable properties at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const rail = page.getByRole("navigation");
    for (const label of ["Statique", "Mouvement", "À propos"]) {
      const button = rail.getByRole("button", { name: label, exact: true });
      await expect(button).toBeVisible();
      await expect(button.locator("span").last()).toHaveCSS("opacity", "1");
    }
    const nav = (await rail.boundingBox())!;
    expect(nav.y).toBeGreaterThan(viewport.height - 100);
    expect(nav.y + nav.height).toBeLessThanOrEqual(viewport.height);
    const trigger = page.getByRole("button", {
      name: "Réglages de Maskot",
      exact: true,
    });
    const entry = (await trigger.boundingBox())!;
    expect(entry.y).toBeGreaterThan(viewport.height - 150);
    expect(entry.y + entry.height).toBeLessThan(nav.y);
    const exporter = (await page
      .getByRole("button", { name: "Exporter", exact: true })
      .boundingBox())!;
    await expect(
      page.getByRole("button", { name: "Exporter", exact: true }),
    ).toHaveText(/Export/);
    expect(exporter.y).toBeLessThan(65);
    expect(exporter.x + exporter.width).toBeGreaterThan(viewport.width - 20);
    await page.screenshot({
      path: `artifacts/mobile-editor-${viewport.width}.png`,
    });
    await trigger.tap();
    const sheet = page.getByRole("dialog", {
      name: "Réglages de Maskot",
      exact: true,
    });
    await expect(sheet).toBeVisible();
    await expect(
      sheet
        .getByRole("button", { name: "Fermer les réglages", exact: true })
        .locator("svg"),
    ).toHaveCount(0);
    const bounds = (await sheet.boundingBox())!;
    expect(bounds.x).toBe(0);
    expect(bounds.width).toBe(viewport.width);
    expect(bounds.y).toBeGreaterThan(0);
    await page.screenshot({
      path: `artifacts/mobile-properties-${viewport.width}.png`,
    });
    const triangle = sheet.getByRole("button", {
      name: "Triangle",
      exact: true,
    });
    await triangle.tap();
    await expect(triangle).toHaveAttribute("aria-pressed", "true");
    await dismissWithTouch(
      page,
      sheet.locator('[data-slot="drawer-swipe-handle"]'),
    );
    await expect(sheet).toBeHidden();
    await trigger.tap();
    await expect(triangle).toHaveAttribute("aria-pressed", "true");
    await sheet
      .getByRole("button", { name: "Fermer les réglages", exact: true })
      .tap();
    await expect(sheet).toBeHidden();
    await rail.getByRole("button", { name: "Mouvement", exact: true }).tap();
    await expect(
      page.getByRole("button", { name: "Ajouter un mouvement", exact: true }),
    ).toBeVisible();
    const timeline = page.locator("[data-timeline-track]");
    await expect(timeline).toHaveAttribute("data-bottom", "true");
    await timeline.hover();
    await page.mouse.wheel(1500, 0);
    await expect(timeline).toHaveAttribute("data-top", "true");
    await expect(timeline).toHaveAttribute("data-bottom", "false");
    await page.mouse.wheel(-1500, 0);
    await expect(timeline).toHaveAttribute("data-top", "false");
    await expect(
      page.getByRole("slider", { name: "Zoom de la timeline", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Exporter", exact: true }).tap();
    await expect(
      page.getByRole("button", { name: "Exporter en SVG", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Exporter en PNG", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Exporter le montage", exact: true })
      .tap();
    await expect(
      page.getByRole("dialog", { name: "Emporte le mouvement.", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await trigger.tap();
    await expect(
      sheet.getByLabel("Mouvements", { exact: true }).getByRole("button"),
    ).toHaveCount(29);
    await sheet
      .getByRole("button", { name: "Fermer les réglages", exact: true })
      .tap();
    await rail.getByRole("button", { name: "À propos", exact: true }).tap();
    await expect(
      page.getByRole("link", { name: "Plinka", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(viewport.width);
    await page.waitForTimeout(400);
    const about = page.locator("#about");
    const heading = (await about
      .getByRole("heading", { level: 2 })
      .boundingBox())!;
    expect(
      Math.abs(heading.x + heading.width / 2 - viewport.width / 2),
    ).toBeLessThan(1);
    const links = (await page
      .getByRole("link", { name: "Plinka", exact: true })
      .boundingBox())!;
    expect(links.y + links.height).toBeLessThan(nav.y - 8);
    const preferences = about.locator('[data-slot="toggle-group"]');
    for (const group of await preferences.all()) {
      const box = (await group.boundingBox())!;
      expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThan(
        1,
      );
      expect(box.width).toBeGreaterThan(viewport.width - 100);
    }
    expect(
      await about.evaluate((node) => node.scrollHeight),
    ).toBeLessThanOrEqual(viewport.height);
    await page.screenshot({
      path: `artifacts/mobile-about-${viewport.width}.png`,
    });
  });
}
