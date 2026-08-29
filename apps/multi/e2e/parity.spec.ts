import { expect, test } from "@playwright/test";
import { AURORA as SHARED, GRADUATED } from "../playwright.config";

/**
 * Graduation parity.
 *
 * `docs/graduation.md` claims graduation leaves "zero trace" for search engines and users — the
 * reason the architecture is described as "not a one-way door". Until now nothing checked it;
 * the doc's own verification section was a `curl` recipe nobody runs.
 *
 * What is actually promised is narrower than "identical", and this suite holds it to that: the
 * host, robots, deep-link files and identity markup must match exactly, and no URL may be lost.
 * A graduated app growing extra pages is the point of graduating, not a regression.
 *
 * These tests also catch the other thing nothing checked: `apps/aurora/config.ts` and
 * `apps/multi/config/aurora.ts` are two files kept in step by hand, and they have drifted before.
 * Comparing the rendered output catches that drift wherever it would actually matter.
 */
test.describe("graduated app matches the shared deploy", () => {
  test("robots.txt is byte-for-byte identical", async ({ request }) => {
    const graduated = await (await request.get(`${GRADUATED}/robots.txt`)).text();
    const shared = await (await request.get(`${SHARED}/robots.txt`)).text();

    expect(graduated).toBe(shared);
  });

  test("no URL the shared deploy publishes is lost", async ({ request }) => {
    // The guarantee is not "identical" — a graduated app is free to grow, and this one has a
    // blog the shared tenant does not. The guarantee is that flipping DNS never breaks a URL
    // that was already indexed or already filed with a store: the graduated set is a superset.
    const locs = async (url: string) =>
      [...(await (await request.get(url)).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);

    const shared = await locs(`${SHARED}/sitemap.xml`);
    const graduated = new Set(await locs(`${GRADUATED}/sitemap.xml`));

    expect(shared.filter((url) => !graduated.has(url))).toEqual([]);
  });

  test("every URL the shared deploy publishes still resolves after graduation", async ({
    request,
  }) => {
    // The sitemap agreeing is not enough; the pages behind it have to answer.
    const shared = [
      ...(await (await request.get(`${SHARED}/sitemap.xml`)).text()).matchAll(/<loc>([^<]+)<\/loc>/g),
    ].map((m) => new URL(m[1]!).pathname);

    const broken: string[] = [];
    for (const path of shared) {
      const response = await request.get(`${GRADUATED}${path}`);
      if (response.status() !== 200) broken.push(`${path} -> ${response.status()}`);
    }

    expect(broken).toEqual([]);
  });

  test("the well-known files are identical", async ({ request }) => {
    for (const path of [
      "/.well-known/apple-app-site-association",
      "/.well-known/assetlinks.json",
    ]) {
      const graduated = await request.get(`${GRADUATED}${path}`);
      const shared = await request.get(`${SHARED}${path}`);

      expect(graduated.status()).toBe(shared.status());
      expect(graduated.headers()["content-type"]).toBe(shared.headers()["content-type"]);
      expect(await graduated.json()).toEqual(await shared.json());
    }
  });

  test("canonical and the identity nodes are unchanged", async ({ request }) => {
    const read = async (base: string) => {
      const html = await (await request.get(`${base}/`)).text();
      const nodes = [
        ...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs),
      ].map((m) => JSON.parse(m[1]!.replaceAll("\\u003c", "<")));

      return {
        canonical: html.match(/<link rel="canonical" href="([^"]+)"/)?.[1],
        // SoftwareApplication and Organization are derived from config identity, so they must
        // match exactly. FAQPage is content and the graduated app is allowed more of it.
        identity: nodes.filter((n) => n["@type"] !== "FAQPage"),
      };
    };

    const graduated = await read(GRADUATED);
    const shared = await read(SHARED);

    expect(graduated.canonical).toBe(shared.canonical);
    expect(graduated.identity).toEqual(shared.identity);
  });

  test("the same locales resolve, with the same prefixes", async ({ request }) => {
    for (const path of ["/", "/tr", "/privacy", "/tr/privacy", "/en"]) {
      const graduated = await request.get(`${GRADUATED}${path}`, { maxRedirects: 0 });
      const shared = await request.get(`${SHARED}${path}`, { maxRedirects: 0 });

      expect({ path, status: graduated.status() }).toEqual({ path, status: shared.status() });
    }
  });
});

test.describe("long page", () => {
  test("closes with an ask, so reading to the end does not dead-end", async ({ page }) => {
    // Someone who read the features, the steps and the FAQ is the most convinced visitor on the
    // page. Without this they would have to scroll back to the top to act on any of it.
    await page.goto(GRADUATED);

    const closing = page.locator("#closing-cta");
    await expect(closing).toBeVisible();

    const badges = page.locator('a[href^="/go/footer"]');
    await expect(badges).toHaveCount(2);
  });

  test("every store badge on the page routes through /go", async ({ page }) => {
    await page.goto(GRADUATED);
    await expect(page.locator('a[href*="apps.apple.com"], a[href*="play.google.com"]')).toHaveCount(0);
  });
});

