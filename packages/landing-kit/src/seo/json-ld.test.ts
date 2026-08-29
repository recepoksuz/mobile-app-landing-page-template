import { describe, expect, it } from "vitest";
import { defineAppConfig } from "../config/define";
import { validConfigInput } from "../config/fixtures";
import { faqPageJsonLd, landingJsonLd, organizationJsonLd, softwareApplicationJsonLd } from "./json-ld";

const full = defineAppConfig({
  ...structuredClone(validConfigInput),
  content: {
    features: [],
    steps: [],
    faq: [{ q: "Is it free?", a: "Yes, to start." }],
  },
  social: { instagram: "https://instagram.com/acme" },
});

const noRating = defineAppConfig({
  ...structuredClone(validConfigInput),
  store: {
    ios: { appId: "1", url: "https://apps.apple.com/app/id1" },
  },
});

describe("softwareApplicationJsonLd", () => {
  it("adds aggregateRating when rating and reviewCount are present", () => {
    const node = softwareApplicationJsonLd(full);
    expect(node.aggregateRating).toMatchObject({ ratingValue: 4.7, reviewCount: 12400 });
  });

  it("never adds aggregateRating when there is no rating", () => {
    // Google flags an aggregateRating with missing fields as an error (acceptance criterion 5).
    expect(softwareApplicationJsonLd(noRating).aggregateRating).toBeUndefined();
  });

  it("derives operatingSystem from the stores that are present", () => {
    expect(softwareApplicationJsonLd(full).operatingSystem).toBe("iOS, Android");
    expect(softwareApplicationJsonLd(noRating).operatingSystem).toBe("iOS");
  });

  it("produces absolute URLs", () => {
    const node = softwareApplicationJsonLd(full);
    expect(node.url).toBe("https://acme.ai");
    expect(node.image).toBe("https://acme.ai/apps/acme/icon.svg");
  });
});

describe("organizationJsonLd", () => {
  it("puts social links into sameAs", () => {
    expect(organizationJsonLd(full).sameAs).toEqual(["https://instagram.com/acme"]);
  });

  it("never adds sameAs when there are no social links", () => {
    expect(organizationJsonLd(noRating).sameAs).toBeUndefined();
  });
});

describe("faqPageJsonLd", () => {
  it("produces a question list from the FAQ", () => {
    const node = faqPageJsonLd(full);
    expect(node?.mainEntity).toHaveLength(1);
  });

  it("returns null when the FAQ is empty", () => {
    expect(faqPageJsonLd(noRating)).toBeNull();
  });
});

describe("landingJsonLd", () => {
  it("produces three nodes when there is a FAQ", () => {
    expect(landingJsonLd(full).map((n) => n["@type"])).toEqual([
      "SoftwareApplication",
      "Organization",
      "FAQPage",
    ]);
  });

  it("skips FAQPage when there is no FAQ", () => {
    expect(landingJsonLd(noRating)).toHaveLength(2);
  });
});
