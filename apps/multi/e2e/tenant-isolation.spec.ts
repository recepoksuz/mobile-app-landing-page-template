import { expect, test } from "@playwright/test";
import { ATLAS, AURORA } from "../playwright.config";

/** Acceptance criterion 3: no tenant leaks another tenant's host or content. */
test.describe("tenant isolation", () => {
  test("robots.txt contains only its own host", async ({ request }) => {
    const aurora = await (await request.get(`${AURORA}/robots.txt`)).text();
    const atlas = await (await request.get(`${ATLAS}/robots.txt`)).text();

    expect(aurora).toContain("Sitemap: https://aurora.example/sitemap.xml");
    expect(aurora).not.toContain("atlas.example");

    expect(atlas).toContain("Sitemap: https://atlas.example/sitemap.xml");
    expect(atlas).not.toContain("aurora.example");
  });

  test("sitemap.xml produces the right host and the right route set", async ({ request }) => {
    const aurora = await (await request.get(`${AURORA}/sitemap.xml`)).text();
    const atlas = await (await request.get(`${ATLAS}/sitemap.xml`)).text();

    expect(aurora).toContain("<loc>https://aurora.example/delete-account</loc>");
    expect(aurora).toContain("<loc>https://aurora.example/refund-policy</loc>");
    expect(aurora).not.toContain("atlas.example");

    // atlas has no accounts and no subscriptions; these two routes must not be in
    // its sitemap either.
    expect(atlas).not.toContain("/delete-account");
    expect(atlas).not.toContain("/refund-policy");
    expect(atlas).not.toContain("aurora.example");
  });

  test("an internal tenant path returns 404 when requested from outside", async ({ request }) => {
    expect((await request.get(`${AURORA}/atlas/privacy`)).status()).toBe(404);
    expect((await request.get(`${AURORA}/aurora/privacy`)).status()).toBe(404);
    expect((await request.get(`${ATLAS}/aurora`)).status()).toBe(404);
  });

  test("the canonical and og:image do not leak the tenant segment", async ({ request }) => {
    const html = await (await request.get(`${AURORA}/`)).text();

    expect(html).toContain('href="https://aurora.example"');
    expect(html).toContain('content="https://aurora.example/og"');
    expect(html).not.toContain("aurora.example/aurora/");
  });
});

/**
 * An unregistered domain pointed at this deploy must not serve any tenant. Otherwise the
 * content would be reachable under a second host with the wrong canonical and sitemap —
 * duplicate content that costs the real domain its ranking.
 */
test.describe("unknown host", () => {
  const UNKNOWN = { host: "not-a-registered-domain.example" };

  test("the landing page 404s", async ({ request }) => {
    const response = await request.get(`${AURORA}/`, { headers: UNKNOWN });
    expect(response.status()).toBe(404);
  });

  test("robots.txt disallows everything and leaks no host", async ({ request }) => {
    const body = await (await request.get(`${AURORA}/robots.txt`, { headers: UNKNOWN })).text();

    expect(body).toContain("Disallow: /");
    expect(body).not.toContain("Sitemap:");
    expect(body).not.toContain("aurora.example");
  });

  test("sitemap.xml is empty", async ({ request }) => {
    const body = await (await request.get(`${AURORA}/sitemap.xml`, { headers: UNKNOWN })).text();
    expect(body).not.toContain("<loc>");
  });

  test("well-known files 404", async ({ request }) => {
    expect(
      (await request.get(`${AURORA}/.well-known/apple-app-site-association`, { headers: UNKNOWN }))
        .status(),
    ).toBe(404);
    expect(
      (await request.get(`${AURORA}/.well-known/assetlinks.json`, { headers: UNKNOWN })).status(),
    ).toBe(404);
  });
});

test.describe("www normalisation", () => {
  test("www redirects to the apex with a 308", async ({ request }) => {
    // A canonical tag only asks; the redirect removes the duplicate host outright.
    const response = await request.get(`${AURORA}/privacy`, {
      headers: { host: "www.aurora.example" },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("https://aurora.example/privacy");
  });

  test("the query string survives the redirect", async ({ request }) => {
    const response = await request.get(`${AURORA}/go/x?utm_source=meta`, {
      headers: { host: "www.aurora.example" },
      maxRedirects: 0,
    });

    expect(response.headers().location).toBe("https://aurora.example/go/x?utm_source=meta");
  });
});
