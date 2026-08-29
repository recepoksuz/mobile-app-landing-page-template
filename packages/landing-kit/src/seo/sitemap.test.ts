import { describe, expect, it } from "vitest";
import { defineAppConfig } from "../config/define";
import { validConfigInput } from "../config/fixtures";
import { buildSitemap } from "./sitemap";

const full = defineAppConfig(validConfigInput);

const minimal = defineAppConfig({
  ...structuredClone(validConfigInput),
  legal: { ...validConfigInput.legal, hasAccounts: false, hasSubscriptions: false },
});

describe("buildSitemap", () => {
  it("emits absolute URLs on the tenant's own host", () => {
    expect(buildSitemap(full).map((entry) => entry.url)).toEqual([
      "https://acme.ai/",
      "https://acme.ai/privacy",
      "https://acme.ai/terms",
      "https://acme.ai/support",
      "https://acme.ai/delete-account",
      "https://acme.ai/refund-policy",
    ]);
  });

  it("omits routes the tenant's flags do not open", () => {
    const urls = buildSitemap(minimal).map((entry) => entry.url);
    expect(urls).not.toContain("https://acme.ai/delete-account");
    expect(urls).not.toContain("https://acme.ai/refund-policy");
  });

  it("keeps lastModified stable across calls", async () => {
    // A lastmod that always says "now" trains crawlers to ignore it, so it must not be
    // derived per request.
    const first = buildSitemap(full)[0]?.lastModified;
    await new Promise((resolve) => setTimeout(resolve, 10));
    const second = buildSitemap(full)[0]?.lastModified;

    expect(String(first)).toBe(String(second));
  });
});
