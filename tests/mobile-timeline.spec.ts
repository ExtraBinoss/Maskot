import { expect, test } from "@playwright/test";

test.use({
  hasTouch: true,
  isMobile: true,
  viewport: { width: 390, height: 844 },
});

test("swipes to scroll, holds to reorder without scrolling, and undoes a random montage", async ({
  page,
}) => {
  await page.goto("/");
  const random = page.getByRole("button", {
    name: "Mascotte aléatoire",
    exact: true,
  });
  await random.tap();
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("mascotlab.preset.v1")),
    )
    .not.toBeNull();
  const look = await page.evaluate(
    () => JSON.parse(localStorage.getItem("mascotlab.preset.v1")!).look,
  );
  await random.tap();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("mascotlab.preset.v1")!).look,
      ),
    )
    .not.toEqual(look);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Mouvement", exact: true })
    .tap();
  const track = page.locator("[data-timeline-track]");
  const cards = track.locator("[data-card]");
  const original = await cards.allTextContents();
  const bounds = (await track.boundingBox())!;
  expect(bounds.x).toBe(0);
  expect(bounds.width).toBe(390);
  const transport = page.getByRole("group", { name: "Lecture et historique" });
  await expect(
    transport.getByRole("button", { name: "Annuler la modification" }),
  ).toBeVisible();
  const play = transport.locator(
    'button[aria-label="Mettre en pause"],button[aria-label="Animer la mascotte"]',
  );
  const circle = (await play.boundingBox())!;
  expect(circle.width).toBe(circle.height);
  const session = await page.context().newCDPSession(page);
  try {
    const b = (await cards.nth(1).boundingBox())!;
    const y = b.y + b.height / 2;
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 280, y, id: 1 }],
    });
    for (let i = 1; i <= 8; i++) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 280 - i * 25, y, id: 1 }],
      });
      await page.waitForTimeout(12);
    }
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect
      .poll(() => track.evaluate((node) => node.scrollLeft))
      .toBeGreaterThan(50);
    expect(await cards.allTextContents()).toEqual(original);
    await expect(track.locator('[data-lifted="true"]')).toHaveCount(0);
    await page.waitForTimeout(350);
    await track.evaluate((node) => (node.scrollLeft = 0));
    const first = (await cards.first().boundingBox())!;
    const second = (await cards.nth(1).boundingBox())!;
    const start = {
      x: first.x + first.width / 2,
      y: first.y + first.height / 2,
      id: 1,
    };
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [start],
    });
    await page.waitForTimeout(380);
    await expect(track.locator('[data-lifted="true"]')).toHaveCount(1);
    for (let i = 1; i <= 6; i++) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          {
            ...start,
            x: start.x + ((second.x + second.width / 2 - start.x) * i) / 6,
          },
        ],
      });
      await page.waitForTimeout(16);
    }
    expect(await track.evaluate((node) => node.scrollLeft)).toBeLessThan(2);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect(cards.first()).toHaveText(original[1]);
    await transport
      .getByRole("button", { name: "Annuler la modification" })
      .tap();
    await expect(cards.first()).toHaveText(original[0]);
  } finally {
    await session.detach();
  }
  await page
    .getByRole("button", { name: "Générer 10 mouvements", exact: true })
    .tap();
  await expect(cards).toHaveCount(10);
  const generated = await cards.allTextContents();
  expect(new Set(generated).size).toBe(10);
  await transport
    .getByRole("button", { name: "Annuler la modification" })
    .tap();
  await expect(cards).toHaveCount(4);
  await transport.getByRole("button", { name: "Rétablir" }).tap();
  await expect(cards).toHaveCount(10);
});
