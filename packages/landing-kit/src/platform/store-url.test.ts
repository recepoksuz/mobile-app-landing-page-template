import { describe, expect, it } from "vitest";
import { defineAppConfig } from "../config/define";
import { validConfigInput } from "../config/fixtures";
import { resolveStoreTarget } from "./store-url";

const withOneLink = defineAppConfig({
  ...structuredClone(validConfigInput),
  attribution: { oneLink: "https://acme.onelink.me/abcd" },
});

const withoutOneLink = defineAppConfig(structuredClone(validConfigInput));

describe("resolveStoreTarget", () => {
  it("uses the OneLink instead of the store URL when one exists", () => {
    const target = resolveStoreTarget(withOneLink, "ios", "hero");
    expect(target.kind).toBe("redirect");
    expect(target.kind === "redirect" && target.url).toContain("onelink.me");
  });

  it("maps utm parameters onto AppsFlyer fields", () => {
    const target = resolveStoreTarget(
      withOneLink,
      "android",
      "hero",
      new URLSearchParams({ utm_source: "meta", utm_campaign: "summer", utm_medium: "stories" }),
    );

    const url = new URL(target.kind === "redirect" ? target.url : "");
    expect(url.searchParams.get("pid")).toBe("meta");
    expect(url.searchParams.get("c")).toBe("summer");
    expect(url.searchParams.get("af_adset")).toBe("stories");
  });

  it("falls back to the route's campaign name when utm_campaign is missing", () => {
    const target = resolveStoreTarget(withOneLink, "ios", "spring_sale");
    const url = new URL(target.kind === "redirect" ? target.url : "");
    expect(url.searchParams.get("c")).toBe("spring_sale");
    expect(url.searchParams.get("pid")).toBe("web");
  });

  it("lets directly given af_* parameters override the utm mapping", () => {
    const target = resolveStoreTarget(
      withOneLink,
      "ios",
      "hero",
      new URLSearchParams({ utm_source: "meta", pid: "tiktok" }),
    );
    const url = new URL(target.kind === "redirect" ? target.url : "");
    expect(url.searchParams.get("pid")).toBe("tiktok");
  });

  it("falls back to the platform's store URL when there is no OneLink", () => {
    expect(resolveStoreTarget(withoutOneLink, "ios", "hero")).toEqual({
      kind: "redirect",
      url: "https://apps.apple.com/app/id1234567890",
    });
    expect(resolveStoreTarget(withoutOneLink, "android", "hero")).toEqual({
      kind: "redirect",
      url: "https://play.google.com/store/apps/details?id=com.acme.app",
    });
  });

  it("redirects on desktop too, so a shared link just works", () => {
    // The store's web page still lets a desktop visitor read the listing and continue on their
    // phone; an interstitial asks them to act before anything happens.
    expect(resolveStoreTarget(withOneLink, "desktop", "hero").kind).toBe("redirect");
  });

  it("shows a QR page on desktop when the tenant opts in", () => {
    const withQr = defineAppConfig({
      ...structuredClone(validConfigInput),
      attribution: { oneLink: "https://acme.onelink.me/abcd" },
      features: { blog: false, desktopQr: true },
    });
    expect(resolveStoreTarget(withQr, "desktop", "hero").kind).toBe("qr");
  });

  it("returns 'none' when there is no store for the platform", () => {
    const iosOnly = defineAppConfig({
      ...structuredClone(validConfigInput),
      store: {
        ios: { appId: "1", url: "https://apps.apple.com/app/id1" },
      },
    });
    expect(resolveStoreTarget(iosOnly, "android", "hero")).toEqual({ kind: "none" });
  });

  it("uses a registered campaign's media source instead of the generic web default", () => {
    const withCampaigns = defineAppConfig({
      ...structuredClone(validConfigInput),
      attribution: { oneLink: "https://acme.onelink.me/abcd" },
      campaigns: { alice: { source: "influencer", ad: "reel1" } },
    });

    const target = resolveStoreTarget(withCampaigns, "ios", "alice");
    const url = new URL(target.kind === "redirect" ? target.url : "");

    expect(url.searchParams.get("pid")).toBe("influencer");
    expect(url.searchParams.get("c")).toBe("alice");
    expect(url.searchParams.get("af_ad")).toBe("reel1");
  });

  it("lets a registered campaign override the campaign name", () => {
    const withCampaigns = defineAppConfig({
      ...structuredClone(validConfigInput),
      attribution: { oneLink: "https://acme.onelink.me/abcd" },
      campaigns: { podcast: { source: "podcast", campaign: "ep_42", adset: "midroll" } },
    });

    const url = new URL(
      (resolveStoreTarget(withCampaigns, "android", "podcast") as { url: string }).url,
    );

    expect(url.searchParams.get("c")).toBe("ep_42");
    expect(url.searchParams.get("af_adset")).toBe("midroll");
  });

  it("keeps unregistered links working without any config entry", () => {
    // A one-off link must not need a deploy.
    const url = new URL((resolveStoreTarget(withOneLink, "ios", "one_off") as { url: string }).url);

    expect(url.searchParams.get("pid")).toBe("web");
    expect(url.searchParams.get("c")).toBe("one_off");
  });

  it("lets the query string override a registered campaign", () => {
    // A real ad click carries the more specific signal, so utm_* wins over the config entry.
    const withCampaigns = defineAppConfig({
      ...structuredClone(validConfigInput),
      attribution: { oneLink: "https://acme.onelink.me/abcd" },
      campaigns: { alice: { source: "influencer", ad: "reel1" } },
    });

    const url = new URL(
      (
        resolveStoreTarget(
          withCampaigns,
          "ios",
          "alice",
          new URLSearchParams({ utm_source: "meta", utm_content: "video3" }),
        ) as { url: string }
      ).url,
    );

    expect(url.searchParams.get("pid")).toBe("meta");
    expect(url.searchParams.get("af_ad")).toBe("video3");
  });

  it("reads the media source out of the path, with no config entry", () => {
    // This is the zero-deploy case: a new creator is a URL someone types, not a code change.
    const url = new URL(
      (resolveStoreTarget(withOneLink, "ios", "influencer/alice") as { url: string }).url,
    );

    expect(url.searchParams.get("pid")).toBe("influencer");
    expect(url.searchParams.get("c")).toBe("alice");
  });

  it("takes a creative from a third path segment", () => {
    const url = new URL(
      (resolveStoreTarget(withOneLink, "android", "influencer/alice/reel1") as { url: string }).url,
    );

    expect(url.searchParams.get("pid")).toBe("influencer");
    expect(url.searchParams.get("c")).toBe("alice");
    expect(url.searchParams.get("af_ad")).toBe("reel1");
  });

  it("accepts the path as segments as well as a string", () => {
    const fromArray = resolveStoreTarget(withOneLink, "ios", ["podcast", "ep42"]);
    const fromString = resolveStoreTarget(withOneLink, "ios", "podcast/ep42");
    expect(fromArray).toEqual(fromString);
  });

  it("treats a single segment as the campaign, keeping the generic source", () => {
    const url = new URL((resolveStoreTarget(withOneLink, "ios", "alice") as { url: string }).url);
    expect(url.searchParams.get("pid")).toBe("web");
    expect(url.searchParams.get("c")).toBe("alice");
  });

  it("lets a registered entry override what the path says", () => {
    const withCampaigns = defineAppConfig({
      ...structuredClone(validConfigInput),
      attribution: { oneLink: "https://acme.onelink.me/abcd" },
      campaigns: { "influencer/alice": { source: "creator", campaign: "alice_q3" } },
    });

    const url = new URL(
      (resolveStoreTarget(withCampaigns, "ios", "influencer/alice") as { url: string }).url,
    );

    expect(url.searchParams.get("pid")).toBe("creator");
    expect(url.searchParams.get("c")).toBe("alice_q3");
  });

  it("still lets the query string win over the path", () => {
    const url = new URL(
      (
        resolveStoreTarget(
          withOneLink,
          "ios",
          "influencer/alice",
          new URLSearchParams({ utm_source: "meta" }),
        ) as { url: string }
      ).url,
    );

    expect(url.searchParams.get("pid")).toBe("meta");
    expect(url.searchParams.get("c")).toBe("alice");
  });
});
