import { expect, test } from "@playwright/test";
import { ATLAS, AURORA } from "../playwright.config";

/**
 * Acceptance criterion 7: no third-party script is loaded when consent is declined.
 * The reference sites do not do this and they take European traffic — a behaviour to
 * fix, not to copy (spec §6.2).
 */
const THIRD_PARTY_HOSTS = [
  "connect.facebook.net",
  "analytics.tiktok.com",
  "googletagmanager.com",
  "appsflyer.com",
  "onelinksmartscript.appsflyer.com",
];

function trackThirdParty(page: import("@playwright/test").Page): string[] {
  const seen: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (THIRD_PARTY_HOSTS.some((host) => url.includes(host))) seen.push(url);
  });
  return seen;
}

test.describe("consent gate", () => {
  test("no third-party script is loaded before a decision is made", async ({ page }) => {
    const thirdParty = trackThirdParty(page);

    await page.goto("/");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.waitForLoadState("networkidle");

    expect(thirdParty).toEqual([]);
  });

  test("no third-party script is loaded when declined", async ({ page }) => {
    const thirdParty = trackThirdParty(page);

    await page.goto("/");
    await page.getByRole("button", { name: "Decline" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await page.waitForLoadState("networkidle");

    expect(thirdParty).toEqual([]);
  });

  test("the decline decision still holds after the page is reloaded", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Decline" }).click();

    const thirdParty = trackThirdParty(page);
    await page.reload();
    await page.waitForLoadState("networkidle");

    // The banner must not be shown again and still nothing must be loaded.
    await expect(page.getByRole("dialog")).toBeHidden();
    expect(thirdParty).toEqual([]);
  });

  test("the pixels load when accepted", async ({ page }) => {
    const thirdParty = trackThirdParty(page);

    await page.goto("/");
    await page.getByRole("button", { name: "Accept" }).click();
    await page.waitForLoadState("networkidle");

    // The Meta and TikTok pixels are configured in the aurora config.
    expect(thirdParty.length).toBeGreaterThan(0);
  });
});

test.describe("analytics", () => {
  // Analytics is the one measurement that is not consent-gated. That is only defensible while
  // it stays first-party and cookieless, so both properties are asserted rather than trusted:
  // the day Vercel starts serving the script from its own host or setting a cookie, this fails
  // and the decision gets revisited instead of quietly becoming wrong.

  test("is served from the site's own domain, not a third party", async ({ page }) => {
    const offSite: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.hostname !== new URL(ATLAS).hostname) offSite.push(request.url());
    });

    await page.goto(ATLAS);
    await page.waitForLoadState("networkidle");

    expect(offSite, `off-domain requests: ${offSite.join(", ")}`).toHaveLength(0);
    // And it really is loading — an assertion that passes because nothing happened is worthless.
    expect(await page.locator('script[src*="/_vercel/insights"]').count()).toBeGreaterThan(0);
  });

  test("sets no cookie of its own", async ({ page, context }) => {
    await page.goto(ATLAS);
    await page.waitForLoadState("networkidle");

    // The site sets one cookie itself — the visitor's chosen language, written by the proxy.
    // Anything beyond that would mean analytics started identifying people, which is the
    // property the consent exemption rests on.
    const names = (await context.cookies()).map((cookie) => cookie.name);
    expect(names).toEqual(["landing-locale"]);
  });

  test("is off for a tenant that did not ask for it", async ({ page }) => {
    await page.goto(AURORA);
    await page.waitForLoadState("networkidle");

    expect(await page.locator('script[src*="/_vercel/insights"]').count()).toBe(0);
  });
});
