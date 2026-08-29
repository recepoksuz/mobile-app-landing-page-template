import { describe, expect, it } from "vitest";
import { defineAppConfig } from "../config/define";
import { validConfigInput } from "../config/fixtures";
import { absoluteUrl, buildMetadata, origin } from "./metadata";

const config = defineAppConfig(validConfigInput);

describe("absoluteUrl", () => {
  it("always produces an absolute URL with a protocol", () => {
    expect(origin(config)).toBe("https://acme.ai");
    expect(absoluteUrl(config, "/privacy")).toBe("https://acme.ai/privacy");
  });
});

describe("buildMetadata", () => {
  it("binds the canonical to the tenant's own host", () => {
    expect(buildMetadata(config, { path: "/terms" }).alternates?.canonical).toBe(
      "https://acme.ai/terms",
    );
  });

  it("points at the /og route when no ogImage is provided", () => {
    const og = buildMetadata(config).openGraph;
    expect(og && "images" in og && og.images).toEqual([
      { url: "https://acme.ai/og", width: 1200, height: 630, alt: expect.any(String) },
    ]);
  });

  it("uses ogImage when one is provided", () => {
    const withOg = defineAppConfig({
      ...structuredClone(validConfigInput),
      assets: { ...validConfigInput.assets, ogImage: "/apps/acme/og.png" },
    });
    const og = buildMetadata(withOg).openGraph;
    expect(og && "images" in og && (og.images as Array<{ url: string }>)[0]?.url).toBe(
      "https://acme.ai/apps/acme/og.png",
    );
  });

  it("turns robots off when noIndex is passed", () => {
    expect(buildMetadata(config, { noIndex: true }).robots).toMatchObject({ index: false });
  });

  it("derives the Twitter handle from the configured profile", () => {
    const withTwitter = defineAppConfig({
      ...structuredClone(validConfigInput),
      social: { twitter: "https://x.com/acmeapp" },
    });

    expect(buildMetadata(withTwitter).twitter).toMatchObject({
      site: "@acmeapp",
      creator: "@acmeapp",
    });
  });

  it("omits the Twitter handle when no profile is configured", () => {
    expect(buildMetadata(config).twitter).not.toHaveProperty("site");
  });

  it("emits the Smart App Banner tag only when there is an iOS app", () => {
    expect(buildMetadata(config).itunes).toMatchObject({ appId: "1234567890" });

    const androidOnly = defineAppConfig({
      ...structuredClone(validConfigInput),
      store: {
        android: {
          packageName: "com.acme.app",
          url: "https://play.google.com/store/apps/details?id=com.acme.app",
        },
      },
    });
    expect(buildMetadata(androidOnly).itunes).toBeUndefined();
  });
});
