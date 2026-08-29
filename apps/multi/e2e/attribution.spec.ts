import { expect, test } from "@playwright/test";
import { ATLAS, AURORA } from "../playwright.config";

const IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";

/** Spec §6.1: ad creatives point at this route rather than directly at the store. */
test.describe("the /go attribution route", () => {
  test("redirects to OneLink with the campaign parameters on iOS", async ({ request }) => {
    const response = await request.get(
      `${AURORA}/go/summer?utm_source=meta&utm_campaign=summer_sale&utm_medium=stories`,
      { headers: { "user-agent": IOS }, maxRedirects: 0 },
    );

    expect(response.status()).toBe(307);
    const target = new URL(response.headers().location);
    expect(target.hostname).toContain("onelink.me");
    expect(target.searchParams.get("pid")).toBe("meta");
    expect(target.searchParams.get("c")).toBe("summer_sale");
    expect(target.searchParams.get("af_adset")).toBe("stories");
  });

  test("redirects to OneLink on Android too", async ({ request }) => {
    const response = await request.get(`${AURORA}/go/x`, {
      headers: { "user-agent": ANDROID },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain("onelink.me");
  });

  test("falls back to the store directly when there is no OneLink", async ({ request }) => {
    const response = await request.get(`${ATLAS}/go/x`, {
      headers: { "user-agent": IOS },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain("apps.apple.com");
  });

  test("desktop redirects to the store as well", async ({ request }) => {
    // A shared link should just work everywhere. The store's web page still lets a desktop
    // visitor read the listing and continue on their phone.
    const response = await request.get(`${AURORA}/go/desktop_test`, { maxRedirects: 0 });

    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain("onelink.me");
  });

  test("/go is closed to search engines", async ({ request }) => {
    const robots = await (await request.get(`${AURORA}/robots.txt`)).text();
    expect(robots).toContain("Disallow: /go/");
  });
});

test.describe("promo and short links", () => {
  test("a config redirect turns a short path into an attribution link", async ({ request }) => {
    const response = await request.get(`${AURORA}/download`, {
      headers: { "user-agent": IOS },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(307);
    expect(response.headers().location).toBe("/go/download");
  });

  test("the path carries the media source with no config entry and no deploy", async ({
    request,
  }) => {
    // No query string and no registry entry: a new creator is a URL someone types. This is also
    // what survives a link shortener, an Instagram bio field, or being retyped off a slide.
    const response = await request.get(`${AURORA}/go/influencer/alice/reel1`, {
      headers: { "user-agent": IOS },
      maxRedirects: 0,
    });

    const target = new URL(response.headers().location);
    expect(target.searchParams.get("pid")).toBe("influencer");
    expect(target.searchParams.get("c")).toBe("alice");
    expect(target.searchParams.get("af_ad")).toBe("reel1");
  });

  test("a brand new source needs nothing added anywhere", async ({ request }) => {
    const response = await request.get(`${AURORA}/go/podcast/joerogan`, {
      headers: { "user-agent": IOS },
      maxRedirects: 0,
    });

    const target = new URL(response.headers().location);
    expect(target.searchParams.get("pid")).toBe("podcast");
    expect(target.searchParams.get("c")).toBe("joerogan");
  });

  test("a registered entry overrides what the path says", async ({ request }) => {
    // Registering is now only for renaming a campaign or hiding a creative code from the URL.
    const response = await request.get(`${AURORA}/go/podcast/inkfluencer`, {
      headers: { "user-agent": IOS },
      maxRedirects: 0,
    });

    const target = new URL(response.headers().location);
    expect(target.searchParams.get("pid")).toBe("podcast");
    expect(target.searchParams.get("c")).toBe("podcast_ep_42");
    expect(target.searchParams.get("af_ad")).toBe("midroll");
  });

  test("an unregistered link still works with no config entry", async ({ request }) => {
    const response = await request.get(`${AURORA}/go/some_one_off_link`, {
      headers: { "user-agent": IOS },
      maxRedirects: 0,
    });

    const target = new URL(response.headers().location);
    expect(target.searchParams.get("pid")).toBe("web");
    expect(target.searchParams.get("c")).toBe("some_one_off_link");
  });

  test("the media source can be split per link", async ({ request }) => {
    const response = await request.get(`${AURORA}/go/alice?utm_source=influencer&utm_content=reel1`, {
      headers: { "user-agent": IOS },
      maxRedirects: 0,
    });

    const target = new URL(response.headers().location);
    expect(target.searchParams.get("pid")).toBe("influencer");
    expect(target.searchParams.get("c")).toBe("alice");
    expect(target.searchParams.get("af_ad")).toBe("reel1");
  });

  test("a platform the app does not ship on gets an explanation, not a loop", async ({ browser }) => {
    // atlas is iOS-only. Bouncing an Android visitor to the home page would loop them,
    // because the home page CTA points straight back at /go.
    const context = await browser.newContext({ userAgent: ANDROID });
    const page = await context.newPage();

    const response = await page.goto(`${ATLAS}/go/alice`);

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/go\/alice$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/isn.t on Android yet/);
    await expect(page.getByText("iPhone and iPad")).toBeVisible();

    await context.close();
  });
});
