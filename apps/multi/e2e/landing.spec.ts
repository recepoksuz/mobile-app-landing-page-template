import { expect, test } from "@playwright/test";
import { ATLAS, AURORA } from "../playwright.config";

test.describe("the landing page", () => {
  test("both store badges are shown, and neither links straight to a store", async ({ page }) => {
    await page.goto("/");

    // Both badges is a deliberate departure from spec §7/§11. What the spec's reasoning still
    // buys us is kept: every click goes through /go, so a desktop visitor gets the QR page
    // instead of a store link they cannot install from, and attribution never loses a click.
    const storeLinks = page.locator('a[href*="apps.apple.com"], a[href*="play.google.com"]');
    await expect(storeLinks).toHaveCount(0);

    await expect(page.getByRole("link", { name: /App Store/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Google Play/ })).toBeVisible();
  });

  test("each badge names the store it belongs to", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: /App Store/ })).toHaveAttribute(
      "href",
      "/go/hero?store=ios",
    );
    await expect(page.getByRole("link", { name: /Google Play/ })).toHaveAttribute(
      "href",
      "/go/hero?store=android",
    );
  });

  test("the social proof sits directly below the hero", async ({ page }) => {
    await page.goto("/");

    const proof = page.getByRole("region", { name: "Ratings and downloads" });
    await expect(proof).toContainText("4.7");
    await expect(proof).toContainText("12K");
    await expect(proof).toContainText("2M+");
  });

  test("a block is not rendered at all when there is no data", async ({ page }) => {
    // atlas is hero-only: no features, steps or FAQ (spec §9).
    await page.goto(`${ATLAS}/`);

    await expect(page.getByRole("heading", { name: "Everything you need" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "How it works" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /Frequently asked/ })).toHaveCount(0);

    // But the hero and the closing CTA are in place.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("a hero-only tenant emits no FAQPage schema", async ({ page }) => {
    await page.goto("/");

    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = jsonLd.map((raw) => JSON.parse(raw)["@type"]);
    expect(types).toEqual(["SoftwareApplication", "Organization"]);
  });

  test("aggregateRating is not emitted at all when there is no rating", async ({ page }) => {
    await page.goto(`${ATLAS}/`);

    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    const app = JSON.parse(jsonLd[0]!);
    expect(app.aggregateRating).toBeUndefined();
  });

  test("there is a single h1 and it carries the tagline", async ({ page }) => {
    await page.goto("/");

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText("Your day, written in a minute");
  });

  test("the tenant theme carries the accent", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("style", /--tenant-accent:\s*#f63a80/);
  });
});

test.describe("SEO signals", () => {
  test("the Smart App Banner meta tag is present for iOS apps", async ({ page }) => {
    await page.goto("/");
    const content = await page.locator('meta[name="apple-itunes-app"]').getAttribute("content");
    expect(content).toContain("app-id=1111111111");
  });

  test("the sitemap lastmod does not change between requests", async ({ request }) => {
    const read = async () =>
      (await (await request.get(`${AURORA}/sitemap.xml`)).text()).match(/<lastmod>([^<]+)</)?.[1];

    const first = await read();
    await new Promise((resolve) => setTimeout(resolve, 1200));
    expect(await read()).toBe(first);
  });

  test("theme-color carries the tenant's mode", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#000000");
  });
});

test.describe("mobile menu", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("closes itself when a link inside it navigates", async ({ page }) => {
    // `<details>` stays open across a client-side navigation, so the panel used to sit over the
    // page the visitor had just asked for.
    await page.goto("/");
    await page.locator("summary").first().click();
    await expect(page.locator("details").first()).toHaveJSProperty("open", true);

    await page.locator("details nav a", { hasText: "Privacy" }).first().click();

    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.locator("details").first()).toHaveJSProperty("open", false);
  });
});

test.describe("closing CTA", () => {
  test("a hero-only page does not repeat the ask", async ({ page }) => {
    // The badges are still on screen a few hundred pixels up; a second block here would be a
    // second ask without a second reason.
    await page.goto("/");
    await expect(page.locator("#closing-cta")).toHaveCount(0);
  });
});


test.describe("a hero-only page is one screen", () => {
  // Both shared-deploy tenants are hero-only, and the whole point of that layout is that the
  // visitor sees everything at once — footer included — without scrolling.
  //
  // This exists because it regressed. Giving the hero its own viewport height made the page
  // exactly one footer taller than the screen: the layout is already a `min-h-dvh` flex column
  // of header, `flex-1` main and footer, so any height set inside main is added on top of the
  // two, not shared with them. The rule is that the layout owns the height and the hero does
  // not, and the only way to keep that true is to measure it.
  const viewports = [
    { name: "phone", width: 390, height: 844 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "laptop", width: 1440, height: 900 },
  ];

  for (const { name, width, height } of viewports) {
    test(`fits the viewport on a ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto(AURORA);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollHeight - window.innerHeight,
      );

      // A pixel of slack: sub-pixel layout rounding is not a scrollbar.
      expect(overflow, `page overflows by ${overflow}px`).toBeLessThanOrEqual(1);
    });
  }

  test("still shows the footer", async ({ page }) => {
    // A page that fits by dropping content is not the fix being asked for.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(AURORA);

    await expect(page.locator("footer")).toBeInViewport();
  });
});
