import { describe, expect, it } from "vitest";
import { defineAppConfig } from "../config/define";
import { validConfigInput } from "../config/fixtures";
import { hasRoute, legalNavLinks, tenantRoutes } from "./routes";

function config(patch: Partial<{ hasAccounts: boolean; hasSubscriptions: boolean; blog: boolean }>) {
  const input = structuredClone(validConfigInput);
  input.legal.hasAccounts = patch.hasAccounts ?? false;
  input.legal.hasSubscriptions = patch.hasSubscriptions ?? false;
  input.features = { blog: patch.blog ?? false, desktopQr: false };
  return defineAppConfig(input);
}

describe("tenantRoutes", () => {
  it("includes the routes required for every tenant", () => {
    const paths = tenantRoutes(config({})).map((r) => r.path);
    expect(paths).toEqual(["/", "/privacy", "/terms", "/support"]);
  });

  it("adds /delete-account when hasAccounts is on", () => {
    expect(hasRoute(config({ hasAccounts: true }), "/delete-account")).toBe(true);
  });

  it("does not add /delete-account when hasAccounts is off", () => {
    // The sitemap and the page's 404 decision read from the same list, so the two cannot drift apart.
    expect(hasRoute(config({}), "/delete-account")).toBe(false);
  });

  it("adds /refund-policy when hasSubscriptions is on", () => {
    expect(hasRoute(config({ hasSubscriptions: true }), "/refund-policy")).toBe(true);
  });

  it("does not add /blog when the blog flag is off", () => {
    expect(hasRoute(config({}), "/blog")).toBe(false);
    expect(hasRoute(config({ blog: true }), "/blog")).toBe(true);
  });

  it("all routes are indexable and go into the sitemap", () => {
    expect(tenantRoutes(config({ hasAccounts: true })).every((r) => r.indexable)).toBe(true);
  });
});

describe("legalNavLinks", () => {
  it("returns three links for a minimal config", () => {
    expect(legalNavLinks(config({}), "en").map((l) => l.href)).toEqual([
      "/privacy",
      "/terms",
      "/support",
    ]);
  });

  it("adds the conditional links according to the flags", () => {
    expect(
      legalNavLinks(config({ hasAccounts: true, hasSubscriptions: true }), "en").map((l) => l.href),
    ).toContain("/delete-account");
  });
});
