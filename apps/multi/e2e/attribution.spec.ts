import { expect, test } from "@playwright/test";
import { ATLAS, AURORA } from "../playwright.config";

const IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";

/** Spec §6.1: ad creatives point at this route rather than directly at the store. */
test.describe("the /go attribution route", () => {
  // Atlas ships a OneLink and Aurora does not, so between them these cover both destinations
  // the route can choose. The difference is not cosmetic: `pid`, `c` and the `af_*` fields ride
  // on the OneLink URL, and a plain store link carries none of them.

  test("redirects to OneLink with the campaign parameters on iOS", async ({ request }) => {
    const response = await request.get(
      `${ATLAS}/go/summer?utm_source=meta&utm_campaign=summer_sale&utm_medium=stories`,
      { headers: { "user-agent": IOS }, maxRedirects: 0 },
    );

    expect(response.status()).toBe(307);
    const target = new URL(response.headers().location);
    expect(target.hostname).toContain("onelink.me");
    expect(target.searchParams.get("pid")).toBe("meta");
    expect(target.searchParams.get("c")).toBe("summer_sale");
    expect(target.searchParams.get("af_adset")).toBe("stories");
  });

  test("sends an iPhone to the App Store when there is no OneLink", async ({ request }) => {
    const response = await request.get(`${AURORA}/go/x`, {
      headers: { "user-agent": IOS },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(307);
    const target = new URL(response.headers().location);
    expect(target.hostname).toBe("apps.apple.com");
    // Routing survives without a OneLink; attribution does not. Asserted so that removing a
    // tenant's OneLink is a visible trade rather than a silent loss.
    expect(target.searchParams.get("pid")).toBeNull();
  });

  test("sends an Android device to Play when there is no OneLink", async ({ request }) => {
    const response = await request.get(`${AURORA}/go/x`, {
      headers: { "user-agent": ANDROID },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(307);
    expect(new URL(response.headers().location).hostname).toBe("play.google.com");
  });

  test("desktop redirects to the store as well", async ({ request }) => {
    // A shared link should just work everywhere. The store's web page still lets a desktop
    // visitor read the listing and continue on their phone.
    const response = await request.get(`${ATLAS}/go/desktop_test`, { maxRedirects: 0 });

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
    // Aurora is the tenant with `redirects`; this asserts the rewrite, not the destination.
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
    const response = await request.get(`${ATLAS}/go/influencer/alice/reel1`, {
      headers: { "user-agent": IOS },
      maxRedirects: 0,
    });

    const target = new URL(response.headers().location);
    expect(target.searchParams.get("pid")).toBe("influencer");
    expect(target.searchParams.get("c")).toBe("alice");
    expect(target.searchParams.get("af_ad")).toBe("reel1");
  });

  test("a brand new source needs nothing added anywhere", async ({ request }) => {
    const response = await request.get(`${ATLAS}/go/podcast/joerogan`, {
      headers: { "user-agent": IOS },
      maxRedirects: 0,
    });

    const target = new URL(response.headers().location);
    expect(target.searchParams.get("pid")).toBe("podcast");
    expect(target.searchParams.get("c")).toBe("joerogan");
  });

  test("a registered entry overrides what the path says", async ({ request }) => {
    // Registering is now only for renaming a campaign or hiding a creative code from the URL.
    const response = await request.get(`${ATLAS}/go/podcast/inkfluencer`, {
      headers: { "user-agent": IOS },
      maxRedirects: 0,
    });

    const target = new URL(response.headers().location);
    expect(target.searchParams.get("pid")).toBe("podcast");
    expect(target.searchParams.get("c")).toBe("podcast_ep_42");
    expect(target.searchParams.get("af_ad")).toBe("midroll");
  });

  test("an unregistered link still works with no config entry", async ({ request }) => {
    const response = await request.get(`${ATLAS}/go/some_one_off_link`, {
      headers: { "user-agent": IOS },
      maxRedirects: 0,
    });

    const target = new URL(response.headers().location);
    expect(target.searchParams.get("pid")).toBe("web");
    expect(target.searchParams.get("c")).toBe("some_one_off_link");
  });

  test("the media source can be split per link", async ({ request }) => {
    const response = await request.get(`${ATLAS}/go/alice?utm_source=influencer&utm_content=reel1`, {
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

test.describe("campaign parameters survive the landing page", () => {
  // The common shape of a real funnel: the ad points at the page so people can read it, and
  // they tap a badge afterwards. That is two clicks, and the campaign has to survive the gap
  // between them — otherwise every install from a paid click is recorded as organic.

  test("a badge click carries the utm params the visitor arrived with", async ({ page }) => {
    await page.goto(`${ATLAS}/?utm_source=meta&utm_campaign=summer_sale&utm_content=reel1`);

    const href = await page.getByRole("link", { name: /app store/i }).first().getAttribute("href");
    const forwarded = new URL(href as string, ATLAS).searchParams;

    expect(forwarded.get("utm_source")).toBe("meta");
    expect(forwarded.get("utm_campaign")).toBe("summer_sale");
    expect(forwarded.get("utm_content")).toBe("reel1");
    // The link's own parameter still says which badge was clicked.
    expect(forwarded.get("store")).toBe("ios");
  });

  test("and they reach the OneLink as attribution", async ({ page }) => {
    // End to end: what the ad platform sent, arriving in the fields AppsFlyer reads.
    await page.goto(`${ATLAS}/?utm_source=meta&utm_campaign=summer_sale`);
    const href = await page.getByRole("link", { name: /app store/i }).first().getAttribute("href");

    const response = await page.request.get(new URL(href as string, ATLAS).toString(), {
      headers: { "user-agent": IOS },
      maxRedirects: 0,
    });

    const target = new URL(response.headers().location);
    expect(target.searchParams.get("pid")).toBe("meta");
    expect(target.searchParams.get("c")).toBe("summer_sale");
  });

  test("an unrelated query parameter is not forwarded", async ({ page }) => {
    // The destination is a third party's URL. Forwarding anything a stranger can put in a link
    // would let them write into someone else's attribution data.
    await page.goto(`${ATLAS}/?utm_source=meta&evil=payload`);

    const href = await page.getByRole("link", { name: /app store/i }).first().getAttribute("href");
    expect(href).not.toContain("evil");
  });

  test("the badge still works with JavaScript disabled", async ({ browser }) => {
    // Forwarding is an enhancement. Without it the click must still reach the right store.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${ATLAS}/?utm_source=meta`);

    const href = await page.getByRole("link", { name: /app store/i }).first().getAttribute("href");
    expect(href).toContain("/go/");
    expect(href).toContain("store=ios");

    await context.close();
  });
});
