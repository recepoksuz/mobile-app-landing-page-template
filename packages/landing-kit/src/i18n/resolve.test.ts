import { describe, expect, it } from "vitest";
import { defineAppConfig } from "../config/define";
import { validConfigInput } from "../config/fixtures";
import { getDictionary, localePath, localesOf, localizedContent, splitLocale, t } from "./resolve";

const single = defineAppConfig(structuredClone(validConfigInput));

const bilingual = defineAppConfig({
  ...structuredClone(validConfigInput),
  tagline: "Do the thing, faster",
  content: {
    features: [{ title: "Fast", body: "Very fast." }],
    steps: [],
    faq: [{ q: "Free?", a: "Yes." }],
  },
  i18n: {
    defaultLocale: "en",
    locales: {
      tr: {
        tagline: "İşi daha hızlı yap",
        content: { faq: [{ q: "Ücretsiz mi?", a: "Evet." }] },
      },
    },
  },
});

describe("localesOf", () => {
  it("lists the default locale first", () => {
    expect(localesOf(bilingual)).toEqual(["en", "tr"]);
  });

  it("is just the default locale for a single-language tenant", () => {
    expect(localesOf(single)).toEqual(["en"]);
  });
});

describe("localePath", () => {
  it("leaves the default locale unprefixed", () => {
    // This is what keeps a URL already filed with the App Store valid after a language is added.
    expect(localePath(bilingual, "en", "/privacy")).toBe("/privacy");
    expect(localePath(bilingual, "en", "/")).toBe("/");
  });

  it("prefixes every other locale", () => {
    expect(localePath(bilingual, "tr", "/privacy")).toBe("/tr/privacy");
    expect(localePath(bilingual, "tr", "/")).toBe("/tr");
  });
});

describe("splitLocale", () => {
  it("reads a prefixed locale", () => {
    expect(splitLocale(bilingual, "/tr/privacy")).toEqual({
      locale: "tr",
      path: "/privacy",
      redundantPrefix: false,
    });
  });

  it("falls back to the default locale when unprefixed", () => {
    expect(splitLocale(bilingual, "/privacy")).toEqual({
      locale: "en",
      path: "/privacy",
      redundantPrefix: false,
    });
  });

  it("flags a spelled-out default locale as redundant", () => {
    // `/en/privacy` and `/privacy` would otherwise be two URLs for one page.
    expect(splitLocale(bilingual, "/en/privacy")).toEqual({
      locale: "en",
      path: "/privacy",
      redundantPrefix: true,
    });
  });

  it("treats an unsupported locale segment as a normal path", () => {
    expect(splitLocale(bilingual, "/de/privacy").path).toBe("/de/privacy");
  });

  it("handles the bare locale root", () => {
    expect(splitLocale(bilingual, "/tr")).toEqual({
      locale: "tr",
      path: "/",
      redundantPrefix: false,
    });
  });
});

describe("localizedContent", () => {
  it("returns the translation when present", () => {
    expect(localizedContent(bilingual, "tr").tagline).toBe("İşi daha hızlı yap");
  });

  it("falls back field by field, not wholesale", () => {
    // Turkish supplies a tagline and FAQ but no description or features; each missing field
    // falls back on its own so a partial translation is still usable.
    const trContent = localizedContent(bilingual, "tr");
    expect(trContent.description).toBe(bilingual.description);
    expect(trContent.content.features).toEqual(bilingual.content.features);
    expect(trContent.content.faq[0]?.q).toBe("Ücretsiz mi?");
  });

  it("returns the default copy for an unknown locale", () => {
    expect(localizedContent(bilingual, "de").tagline).toBe("Do the thing, faster");
  });
});

describe("getDictionary", () => {
  it("returns the requested dictionary", () => {
    expect(getDictionary("tr").locale).toBe("tr");
    expect(getDictionary("tr").ogLocale).toBe("tr_TR");
  });

  it("falls back to English for a locale with no dictionary", () => {
    expect(getDictionary("de").locale).toBe("en");
  });
});

describe("t", () => {
  it("fills placeholders", () => {
    expect(t("Get {name}", { name: "Acme" })).toBe("Get Acme");
  });

  it("leaves an unknown placeholder untouched rather than printing undefined", () => {
    expect(t("Get {name}")).toBe("Get {name}");
  });
});
