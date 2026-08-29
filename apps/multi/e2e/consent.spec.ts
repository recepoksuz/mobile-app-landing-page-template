import { expect, test } from "@playwright/test";

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
