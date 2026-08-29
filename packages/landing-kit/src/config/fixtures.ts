import type { AppConfigInput } from "./schema";

/** The valid config tests start from; each test overrides only the field it cares about. */
export const validConfigInput: AppConfigInput = {
  slug: "acme",
  domain: "acme.ai",
  name: "Acme",
  tagline: "Do the thing, faster",
  description:
    "Acme turns a rough idea into a finished result in seconds, so you can ship today instead of next week. Try it free on iPhone and Android.",
  theme: { accent: "#f63a80", mode: "dark" },
  assets: { icon: "/apps/acme/icon.svg", logo: "/apps/acme/logo.svg", mockup: "/apps/acme/mockup.svg" },
  store: {
    ios: {
      appId: "1234567890",
      url: "https://apps.apple.com/app/id1234567890",
      teamId: "ABCDE12345",
      bundleId: "com.acme.app",
    },
    android: {
      packageName: "com.acme.app",
      url: "https://play.google.com/store/apps/details?id=com.acme.app",
      sha256Fingerprints: [
        "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99",
      ],
    },
    rating: 4.7,
    reviewCount: 12400,
    downloads: "2M+",
  },
  attribution: {},
  content: { features: [], steps: [], faq: [] },
  legal: {
    companyName: "Acme Inc.",
    companyAddress: "1 Example Street, Istanbul, Türkiye",
    supportEmail: "support@acme.ai",
    governingLaw: "England and Wales",
    hasAccounts: true,
    hasSubscriptions: true,
  },
};
