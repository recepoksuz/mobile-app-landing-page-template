import { describe, expect, it } from "vitest";
import { defineAppConfig } from "../config/define";
import { validConfigInput } from "../config/fixtures";
import { buildAasa } from "./aasa";
import { buildAssetLinks } from "./assetlinks";

const full = defineAppConfig(validConfigInput);

describe("buildAasa", () => {
  it("builds the appID in teamId.bundleId form", () => {
    const aasa = buildAasa(full);
    expect(aasa?.applinks.details[0]?.appIDs).toEqual(["ABCDE12345.com.acme.app"]);
  });

  it("excludes the attribution route from the app", () => {
    // /go/* must stay on the web, otherwise the app captures the link and attribution breaks.
    const components = buildAasa(full)?.applinks.details[0]?.components ?? [];
    const goRule = components.find((c) => c["/"] === "/go/*");
    expect(goRule?.exclude).toBe(true);
  });

  it("fills in webcredentials too", () => {
    expect(buildAasa(full)?.webcredentials?.apps).toEqual(["ABCDE12345.com.acme.app"]);
  });

  it("returns null when teamId/bundleId are missing", () => {
    const noUniversalLinks = defineAppConfig({
      ...structuredClone(validConfigInput),
      store: { ios: { appId: "1", url: "https://apps.apple.com/app/id1" } },
    });
    expect(buildAasa(noUniversalLinks)).toBeNull();
  });

  it("returns null when there is no iOS section at all", () => {
    const androidOnly = defineAppConfig({
      ...structuredClone(validConfigInput),
      store: {
        android: {
          packageName: "com.acme.app",
          url: "https://play.google.com/store/apps/details?id=com.acme.app",
        },
      },
    });
    expect(buildAasa(androidOnly)).toBeNull();
  });
});

describe("buildAssetLinks", () => {
  it("normalizes the fingerprint to uppercase", () => {
    const links = buildAssetLinks(
      defineAppConfig({
        ...structuredClone(validConfigInput),
        store: {
          android: {
            packageName: "com.acme.app",
            url: "https://play.google.com/store/apps/details?id=com.acme.app",
            sha256Fingerprints: [
              "aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99:aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99",
            ],
          },
        },
      }),
    );

    expect(links?.[0]?.target.sha256_cert_fingerprints[0]).toMatch(/^AA:BB:/);
  });

  it("uses the correct relation", () => {
    expect(buildAssetLinks(full)?.[0]?.relation).toEqual([
      "delegate_permission/common.handle_all_urls",
    ]);
  });

  it("returns null when there are no fingerprints", () => {
    const noFingerprints = defineAppConfig({
      ...structuredClone(validConfigInput),
      store: {
        android: {
          packageName: "com.acme.app",
          url: "https://play.google.com/store/apps/details?id=com.acme.app",
        },
      },
    });
    expect(buildAssetLinks(noFingerprints)).toBeNull();
  });
});
