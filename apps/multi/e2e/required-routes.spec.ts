import { expect, test } from "@playwright/test";
import { ATLAS, AURORA } from "../playwright.config";

/** Acceptance criterion 2: the required routes on every tenant, the conditional ones per flag. */
test.describe("the required route set", () => {
  for (const path of ["/", "/privacy", "/terms", "/support"]) {
    test(`${path} is 200 on both tenants`, async ({ request }) => {
      expect((await request.get(`${AURORA}${path}`)).status()).toBe(200);
      expect((await request.get(`${ATLAS}${path}`)).status()).toBe(200);
    });
  }

  test("/contact redirects permanently to /support", async ({ page }) => {
    await page.goto("/contact");
    await expect(page).toHaveURL(/\/support$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Support");
  });

  test("/delete-account exists when hasAccounts is on, not when it is off", async ({ request }) => {
    expect((await request.get(`${AURORA}/delete-account`)).status()).toBe(200);
    expect((await request.get(`${ATLAS}/delete-account`)).status()).toBe(404);
  });

  test("/refund-policy exists when hasSubscriptions is on, not when it is off", async ({ request }) => {
    expect((await request.get(`${AURORA}/refund-policy`)).status()).toBe(200);
    expect((await request.get(`${ATLAS}/refund-policy`)).status()).toBe(404);
  });

  test("the og image is produced as a PNG", async ({ request }) => {
    const response = await request.get(`${AURORA}/og`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
  });
});
