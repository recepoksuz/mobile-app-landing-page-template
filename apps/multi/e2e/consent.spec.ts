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

test.describe("conversion events", () => {
  // The click that matters is the one leaving for the store. It has to be reported to the ad
  // platforms — otherwise a campaign optimises on "opened the page" — without ever becoming a
  // way around the consent gate.
  //
  // Calls are recorded through an exposed binding rather than a variable on `window`, because
  // the click navigates away: anything kept in the page would be torn down with it, and the
  // assertion would pass because the evidence vanished rather than because nothing happened.

  async function recordPixelCalls(page: import("@playwright/test").Page) {
    const calls: unknown[][] = [];
    await page.exposeFunction("__record", (args: unknown[]) => {
      calls.push(args);
    });
    await page.addInitScript(() => {
      (window as unknown as { fbq: unknown }).fbq = (...args: unknown[]) =>
        (window as unknown as { __record: (a: unknown[]) => void }).__record(args);
    });
    return calls;
  }

  test("nothing is reported when consent has not been granted", async ({ page }) => {
    const calls = await recordPixelCalls(page);

    await page.goto(AURORA);
    await page.getByRole("link", { name: /app store/i }).first().click({ noWaitAfter: true });
    await page.waitForURL(/\/go\//);

    expect(calls).toHaveLength(0);
  });

  test("the store click is reported once consent is granted", async ({ page }) => {
    const calls = await recordPixelCalls(page);

    await page.goto(AURORA);
    await page.getByRole("button", { name: /accept/i }).click();

    await page.getByRole("link", { name: /app store/i }).first().click({ noWaitAfter: true });
    await page.waitForURL(/\/go\//);

    // Picked out of the calls rather than assumed to be the only one: once consent is granted
    // the real pixel script runs too, and its `init` and `PageView` come through the same stub.
    const conversions = calls.filter(([verb, event]) => verb === "track" && event !== "PageView");

    // The configured event, and which store was chosen — the two things an ad platform needs to
    // tell a conversion from a bounce.
    expect(conversions).toHaveLength(1);
    expect(conversions[0]?.[1]).toBe("Lead");
    expect(conversions[0]?.[2]).toMatchObject({ content_name: "ios", content_type: "app" });
  });

  test("the store click still navigates when no pixel is configured", async ({ page }) => {
    // Reporting is an add-on. It must never be able to swallow the click itself.
    await page.goto(ATLAS);
    await page.getByRole("link", { name: /app store/i }).first().click({ noWaitAfter: true });

    await page.waitForURL(/\/go\//);
    expect(page.url()).toContain("/go/");
  });
});
