import { expect, test } from "@playwright/test";

test("opens English credits in a shadcn dialog with attribution and keyboard dismissal", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "À propos", exact: true }).click();
  const trigger = page.getByRole("button", { name: "Credits & licenses" });
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Credits & licenses" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("lang", "en");
  await expect(page).toHaveURL("/");
  const headings = await dialog
    .getByRole("heading", { level: 3 })
    .allTextContents();
  expect(headings.slice(0, 3)).toEqual(["Grok bot", "Bloub", "Beam"]);
  await expect(dialog).toContainText(
    "original character idea and visual inspiration",
  );
  await expect(dialog).toContainText("By Jérémy Perret");
  for (const link of await dialog.getByRole("link").all()) {
    const href = (await link.getAttribute("href"))!;
    if (href.startsWith("/licenses/")) {
      const response = await request.get(href);
      expect(response.ok()).toBe(true);
      expect(await response.text()).not.toContain("<!doctype html>");
    }
  }
  await dialog.getByRole("button", { name: "Close", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect
    .poll(() =>
      dialog.evaluate((element) => element.contains(document.activeElement)),
    )
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await page.getByRole("button", { name: "English", exact: true }).click();
  await trigger.click();
  await expect(dialog).toHaveAttribute("lang", "en");
  await expect(dialog.getByRole("heading", { level: 3 }).first()).toHaveText(
    "Grok bot",
  );
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});

test("keeps credits inside small light and dark viewports with scroll shadows", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "À propos", exact: true }).click();
  for (const theme of ["Thème clair", "Thème sombre"]) {
    await page.getByRole("button", { name: theme, exact: true }).click();
    for (const size of [
      { width: 320, height: 568 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(size);
      await page.getByRole("button", { name: "Credits & licenses" }).click();
      const dialog = page.getByRole("dialog", { name: "Credits & licenses" });
      const body = dialog.getByRole("region", { name: "Credits", exact: true });
      await expect(dialog).toBeVisible();
      const bounds = (await dialog.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(15);
      expect(bounds.y).toBeGreaterThanOrEqual(15);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(size.width - 15);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(size.height - 15);
      expect(
        await dialog.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
      await expect(body).toHaveAttribute("data-bottom", "true");
      await body.hover();
      await page.mouse.wheel(0, 1500);
      await expect(body).toHaveAttribute("data-top", "true");
      await expect(
        dialog.getByRole("link", { name: "Lucide", exact: true }),
      ).toBeInViewport();
      await expect(
        dialog.getByRole("link", { name: "Full notices" }),
      ).toBeInViewport();
      await expect(
        dialog.getByRole("button", { name: "Close", exact: true }),
      ).toBeInViewport();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    }
  }
});
