import { expect, test } from "@playwright/test";
import { ATLAS, AURORA } from "../playwright.config";

/**
 * Acceptance criterion 6. The most common reason a deep link does not work is that
 * these two files are served with the wrong `Content-Type` — `apple-app-site-association`
 * has no extension, so servers default to taking it for a file to download.
 */
test.describe("well-known files", () => {
  test("AASA is served as application/json", async ({ request }) => {
    const response = await request.get(`${AURORA}/.well-known/apple-app-site-association`);

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("application/json");

    const body = await response.json();
    expect(body.applinks.details[0].appIDs).toHaveLength(1);
  });

  test("AASA excludes the attribution route from the app", async ({ request }) => {
    const body = await (
      await request.get(`${AURORA}/.well-known/apple-app-site-association`)
    ).json();

    const goRule = body.applinks.details[0].components.find(
      (component: Record<string, unknown>) => component["/"] === "/go/*",
    );
    expect(goRule.exclude).toBe(true);
  });

  test("assetlinks.json is served as application/json", async ({ request }) => {
    const response = await request.get(`${AURORA}/.well-known/assetlinks.json`);

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("application/json");

    const body = await response.json();
    expect(body[0].relation).toContain("delegate_permission/common.handle_all_urls");
  });

  test("AASA returns 404 when Universal Links are not configured", async ({ request }) => {
    // An AASA with the wrong content is harder to diagnose than a missing AASA.
    const response = await request.get(`${ATLAS}/.well-known/apple-app-site-association`);
    expect(response.status()).toBe(404);
  });
});
