import { describe, expect, it } from "vitest";
import { defineAppConfig } from "./define";
import { validConfigInput } from "./fixtures";
import type { AppConfigInput } from "./schema";

function withOverride(patch: (input: AppConfigInput) => void): AppConfigInput {
  const input = structuredClone(validConfigInput);
  patch(input);
  return input;
}

describe("defineAppConfig", () => {
  it("parses a valid config and fills in the defaults", () => {
    const config = defineAppConfig(validConfigInput);

    expect(config.slug).toBe("acme");
    expect(config.features.desktopQr).toBe(false);
    expect(config.features.blog).toBe(false);
  });

  it("rejects a domain that includes a protocol", () => {
    // Spec §5.4: one of the reference sites had a robots.txt carrying a mix of
    // protocol-less and protocol-prefixed hosts. The schema must rule that out up front.
    expect(() => defineAppConfig(withOverride((c) => void (c.domain = "https://acme.ai")))).toThrow(
      /domain/,
    );
  });

  it("rejects a domain with a trailing slash", () => {
    expect(() => defineAppConfig(withOverride((c) => void (c.domain = "acme.ai/")))).toThrow();
  });

  it("rejects a domain without a TLD", () => {
    expect(() => defineAppConfig(withOverride((c) => void (c.domain = "localhost")))).toThrow();
  });

  it("rejects an invalid accent color", () => {
    expect(() => defineAppConfig(withOverride((c) => void (c.theme.accent = "hotpink")))).toThrow(
      /accent/,
    );
  });

  it("rejects a config with neither iOS nor Android", () => {
    expect(() =>
      defineAppConfig(
        withOverride((c) => {
          delete c.store.ios;
          delete c.store.android;
        }),
      ),
    ).toThrow(/at least one/);
  });

  it("rejects a rating given without a reviewCount", () => {
    expect(() =>
      defineAppConfig(withOverride((c) => void delete c.store.reviewCount)),
    ).toThrow(/aggregateRating/);
  });

  it("rejects partially provided iOS Universal Links fields", () => {
    expect(() =>
      defineAppConfig(withOverride((c) => void delete c.store.ios!.teamId)),
    ).toThrow(/teamId and bundleId/);
  });

  it("accepts a config where none of the Universal Links fields are given", () => {
    const config = defineAppConfig(
      withOverride((c) => {
        delete c.store.ios!.teamId;
        delete c.store.ios!.bundleId;
      }),
    );

    expect(config.store.ios?.teamId).toBeUndefined();
  });

  it("rejects an over-long description", () => {
    expect(() => defineAppConfig(withOverride((c) => void (c.description = "x".repeat(161))))).toThrow();
  });

  it("shows the slug in the error message", () => {
    expect(() =>
      defineAppConfig(withOverride((c) => void (c.theme.accent = "nope"))),
    ).toThrow(/"acme"/);
  });

  it("accepts a campaign entry that only renames the campaign", () => {
    // The path already supplies the source, so overriding it is not required.
    const config = defineAppConfig(
      withOverride((c) => {
        c.campaigns = { "podcast/show": { campaign: "ep_42" } };
      }),
    );

    expect(config.campaigns["podcast/show"]).toEqual({ campaign: "ep_42" });
  });

  it("accepts a path-shaped campaign key", () => {
    expect(() =>
      defineAppConfig(
        withOverride((c) => {
          c.campaigns = { "influencer/alice": { ad: "reel1" } };
        }),
      ),
    ).not.toThrow();
  });

  it("rejects a campaign entry that overrides nothing", () => {
    expect(() =>
      defineAppConfig(
        withOverride((c) => {
          c.campaigns = { alice: {} };
        }),
      ),
    ).toThrow(/at least one field/);
  });
});
