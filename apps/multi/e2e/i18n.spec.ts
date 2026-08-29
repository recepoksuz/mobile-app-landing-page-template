import { expect, test } from "@playwright/test";
import { ATLAS, AURORA } from "../playwright.config";

/**
 * Localisation. The default locale stays unprefixed, which is what keeps every URL already
 * filed with the App Store or printed on a flyer valid after a language is added.
 */
test.describe("locales", () => {
  test("the default locale is served without a prefix", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Your day, written in a minute",
    );
  });

  test("a prefixed locale renders its own copy", async ({ page }) => {
    await page.goto("/tr");
    await expect(page.locator("html")).toHaveAttribute("lang", "tr");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Günün, bir dakikada yazılmış",
    );
  });

  test("interface chrome follows the locale, not just the config copy", async ({ page }) => {
    await page.goto("/tr");

    // Chrome strings come from the kit's dictionary, not the tenant config.
    await expect(page.getByRole("link", { name: "Gizlilik" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Reddet" })).toBeVisible();
    await expect(page.getByText("Tüm hakları saklıdır", { exact: false })).toBeVisible();
  });

  test("internal links keep the visitor inside their language", async ({ page }) => {
    await page.goto("/tr");
    await page.getByRole("navigation", { name: "Ana menü" }).getByRole("link", { name: "Gizlilik" }).click();

    await expect(page).toHaveURL(/\/tr\/privacy$/);
  });

  test("spelling out the default locale redirects to the canonical URL", async ({ request }) => {
    // `/en/privacy` and `/privacy` would otherwise be two URLs for one page.
    const response = await request.get(`${AURORA}/en/privacy`, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("/privacy");
  });

  test("an unconfigured locale is not a route", async ({ request }) => {
    expect((await request.get(`${AURORA}/de`)).status()).toBe(404);
  });

  test("a single-language tenant has no prefixed routes", async ({ request }) => {
    expect((await request.get(`${ATLAS}/tr`)).status()).toBe(404);
  });

  test("hreflang lists every locale plus x-default", async ({ page }) => {
    await page.goto("/");

    const alternates = page.locator('link[rel="alternate"]');
    await expect(alternates.filter({ has: page.locator(':scope') })).toHaveCount(3);
    await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
      "href",
      "https://aurora.example",
    );
    await expect(page.locator('link[hreflang="tr"]')).toHaveAttribute(
      "href",
      "https://aurora.example/tr",
    );
    await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute(
      "href",
      "https://aurora.example",
    );
  });

  test("og:locale reflects the rendered language", async ({ page }) => {
    await page.goto("/tr");
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "tr_TR");
  });

  test("the OG image is rendered per locale", async ({ request }) => {
    const response = await request.get(`${AURORA}/tr/og`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
  });

  test("the sitemap lists every locale with alternates", async ({ request }) => {
    const body = await (await request.get(`${AURORA}/sitemap.xml`)).text();

    expect(body).toContain("<loc>https://aurora.example/privacy</loc>");
    expect(body).toContain("<loc>https://aurora.example/tr/privacy</loc>");
    expect(body).toContain('hreflang="tr"');
  });

  test("a single-language tenant's sitemap stays single-language", async ({ request }) => {
    const body = await (await request.get(`${ATLAS}/sitemap.xml`)).text();
    expect(body).not.toContain("/tr");
  });
});

test.describe("untranslated legal documents", () => {
  test("fall back to the default language with a notice", async ({ page }) => {
    // Store review accepts English legal text, so a missing translation must not block a
    // language — but the visitor is told which language they are reading.
    await page.goto("/tr/privacy");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy Policy");
    await expect(
      page.getByText("Bu belge şu anda yalnızca İngilizce olarak sunulmaktadır."),
    ).toBeVisible();
  });

  test("do not claim an hreflang they cannot deliver", async ({ page }) => {
    // Pointing hreflang="tr" at English prose is worse than having no alternate at all.
    await page.goto("/tr/privacy");
    await expect(page.locator('link[hreflang="tr"]')).toHaveCount(0);
    await expect(page.locator('link[hreflang="en"]')).toHaveCount(1);
  });

  test("mark the untranslated body with its real language", async ({ page }) => {
    await page.goto("/tr/privacy");
    await expect(page.locator("article")).toHaveAttribute("lang", "en");
  });
});

test.describe("blog", () => {
  test("stays closed for a hero-only tenant", async ({ request }) => {
    // Both shared-deploy tenants are hero-only: a tenant earns its blocks by having something
    // to put in them, and content growing past a few pages is the signal to graduate (spec §10).
    expect((await request.get(`${AURORA}/blog`)).status()).toBe(404);
    expect((await request.get(`${ATLAS}/blog`)).status()).toBe(404);
  });

  test("blog URLs stay out of the sitemap when the flag is off", async ({ request }) => {
    const body = await (await request.get(`${AURORA}/sitemap.xml`)).text();
    expect(body).not.toContain("/blog");
  });
});
