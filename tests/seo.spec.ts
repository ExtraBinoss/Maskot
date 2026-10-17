import { test, expect } from "@playwright/test";
import { SITE_META, SITE_URL, SOCIAL_IMAGE } from "../src/site-meta";

test("serves complete sharing metadata and useful content without JavaScript", async ({
  browser,
  baseURL,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL!);
  await expect(page).toHaveTitle(SITE_META.en.title);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    SITE_META.en.title,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${SITE_URL}/`,
  );
  for (const [property, content] of Object.entries({
    "og:title": SITE_META.en.title,
    "og:description": SITE_META.en.description,
    "og:image": SOCIAL_IMAGE,
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:image:alt": SITE_META.en.imageAlt,
    "og:url": `${SITE_URL}/`,
  }))
    await expect(page.locator(`meta[property="${property}"]`)).toHaveAttribute(
      "content",
      content,
    );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  const schema = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent())!,
  );
  expect(
    schema["@graph"].map((item: { "@type": string }) => item["@type"]),
  ).toEqual(["WebSite", "WebApplication", "Organization"]);
  expect(schema["@graph"][1].offers.price).toBe("0");
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain(`<loc>${SITE_URL}/</loc>`);
  for (const [url, width, height] of [
    ["/social/maskot.png", 1200, 630],
    ["/favicon-48.png", 48, 48],
    ["/apple-touch-icon.png", 180, 180],
  ] as const) {
    const response = await request.get(url);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
    const png = await response.body();
    expect(png.readUInt32BE(16)).toBe(width);
    expect(png.readUInt32BE(20)).toBe(height);
  }
  const icon = await request.get("/favicon.svg");
  expect(await icon.text()).toContain('fill="#ff5a1f"');
  expect(await icon.text()).toContain('<g fill="#fffaf3"><path');
  await context.close();
});

test("keeps search and social descriptions in sync when switching languages", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "À propos", exact: true }).click();
  for (const [language, label] of [
    ["en", "English"],
    ["fr", "Français"],
  ] as const) {
    await page.getByRole("button", { name: label, exact: true }).click();
    const meta = SITE_META[language];
    await expect(page).toHaveTitle(meta.title);
    for (const selector of [
      'meta[name="description"]',
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
    ])
      await expect(page.locator(selector)).toHaveAttribute(
        "content",
        meta.description,
      );
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      "content",
      meta.locale,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${SITE_URL}/`,
    );
  }
});

test("crossfades themes gently while keeping the old image opaque", async ({
  page,
}) => {
  await page.emulateMedia({
    reducedMotion: "no-preference",
    colorScheme: "light",
  });
  await page.goto("/");
  await page.getByRole("button", { name: "À propos", exact: true }).click();
  const transition = await page.evaluate(async () => {
    const native = document.startViewTransition.bind(document);
    let captured!: Promise<{
      duration: number;
      oldOpacity: string;
      clip: string;
      frames: Keyframe[];
    }>;
    document.startViewTransition = (...args) => {
      const transition = native(...args);
      captured = transition.ready.then(() => {
        const root = document.documentElement;
        const style = getComputedStyle(root, "::view-transition-new(root)");
        const animation = root
          .getAnimations({ subtree: true })
          .find(
            (animation) =>
              animation instanceof CSSAnimation &&
              animation.animationName === "themeFadeIn",
          );
        return {
          duration: Number.parseFloat(style.animationDuration),
          oldOpacity: getComputedStyle(root, "::view-transition-old(root)")
            .opacity,
          clip: style.clipPath,
          frames: (animation!.effect as KeyframeEffect).getKeyframes(),
        };
      });
      return transition;
    };
    document
      .querySelector<HTMLButtonElement>('[aria-label="Thème sombre"]')!
      .click();
    await new Promise(requestAnimationFrame);
    return captured;
  });
  expect(transition.duration).toBeGreaterThanOrEqual(0.9);
  expect(transition.oldOpacity).toBe("1");
  expect(transition.clip).toBe("none");
  expect(transition.frames.map((frame) => frame.opacity)).toEqual(["0", "1"]);
});
