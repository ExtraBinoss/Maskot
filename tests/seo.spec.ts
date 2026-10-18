import { test, expect } from "@playwright/test";
import { SITE_META, SITE_URL, SOCIAL_IMAGE } from "../src/site-meta";
import { defaultPreset } from "../src/mascot/mascot-storage";

test("serves complete sharing metadata and useful content without JavaScript", async ({
  browser,
  baseURL,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL!);
  const source = await request.get("/");
  const html = await source.text();
  expect(html).toContain('data-prerendered="true"');
  expect(html).toContain("Create a Grok bot inspired mascot");
  await expect(page.locator("#root main")).toBeVisible();
  await expect(page.locator("[data-mascot-preview] svg")).toBeVisible();
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
  expect(await icon.text()).toContain(
    '<g fill="#fffaf3" clip-path="url(#body)"><path',
  );
  await context.close();
});

test("hydrates the existing SVG and restores preferences without overwriting the preset", async ({
  page,
}) => {
  const preset = defaultPreset();
  preset.look.shape = "triangle";
  preset.look.eyes = "star";
  preset.look.color = "#ab1234";
  const text = JSON.stringify(preset);
  await page.addInitScript((saved) => {
    localStorage.setItem("mascotlab.preset.v1", saved);
    localStorage.setItem("maskot.language.v1", "fr");
    localStorage.setItem("maskot.colors.v1", '["#123456"]');
    localStorage.setItem("mascotlab-theme", '"dark"');
    const writes: string[] = [];
    const original = Storage.prototype.setItem.bind(localStorage);
    Storage.prototype.setItem = function (key, value) {
      writes.push(key);
      return original(key, value);
    };
    Reflect.set(window, "__storageWrites", writes);
  }, text);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  let resume!: () => void;
  const scripts = new Promise<void>((resolve) => {
    resume = resolve;
  });
  await page.route(/\/assets\/index-[^/]+\.js$/, async (route) => {
    await scripts;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "commit" });
  const mascot = page.locator("[data-mascot-preview] svg");
  try {
    await expect(mascot).toBeVisible();
    await page.evaluate(() => {
      Reflect.set(
        window,
        "__serverMascot",
        document.querySelector("[data-mascot-preview] svg"),
      );
    });
  } finally {
    resume();
  }
  await expect(
    page.getByRole("button", { name: "À propos", exact: true }),
  ).toBeVisible();
  await expect(mascot.locator('path[fill="#ab1234"]').first()).toBeAttached();
  await expect(
    page.getByRole("button", { name: "Couleur #123456", exact: true }),
  ).toBeAttached();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(
    await page.evaluate(
      () =>
        Reflect.get(window, "__serverMascot") ===
        document.querySelector("[data-mascot-preview] svg"),
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() => Reflect.get(window, "__storageWrites")),
  ).not.toContain("mascotlab.preset.v1");
  expect(
    await page.evaluate(() => localStorage.getItem("mascotlab.preset.v1")),
  ).toBe(text);
  expect(errors).toEqual([]);
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
    const schema = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent())!,
    );
    const app = schema["@graph"].find(
      (entry: { "@type": string }) => entry["@type"] === "WebApplication",
    );
    expect(app.description).toBe(meta.description);
    expect(app.license).toBe(`${SITE_URL}/licenses/Maskot-MIT.txt`);
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
