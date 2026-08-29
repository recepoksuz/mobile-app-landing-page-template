import { defineAppConfig } from "@landing/kit/config";

/**
 * PLACEHOLDER DATA. What has to be changed before going live:
 * store.ios.appId + url, store.android.packageName + url + sha256Fingerprints,
 * store.ios.teamId + bundleId (Universal Links), attribution.* and the public/apps/aurora/ images.
 *
 * DELIBERATE DUPLICATE: `apps/multi/config/aurora.ts` and `apps/aurora/config.ts` both exist so
 * the repo can demonstrate a shared tenant and a graduated one side by side. A real graduation
 * deletes the `apps/multi` copy (graduation.md, step 4). Until then the two must stay in step on
 * everything that identifies the app — domain, name, store, legal — and
 * `apps/aurora/e2e/parity.spec.ts` fails if they drift.
 */
export const aurora = defineAppConfig({
  slug: "aurora",
  domain: "aurora.example",
  name: "Aurora",
  tagline: "Your day, written in a minute",
  description:
    "A journal that fits in the gaps: one prompt a day, a photo if you want one, and a private archive that gets more useful the longer you keep it.",

  theme: { accent: "#f63a80", mode: "dark" },

  assets: {
    icon: "/apps/aurora/icon.svg",
    logo: "/apps/aurora/logo.svg",
    mockup: "/apps/aurora/mockup.svg",
  },

  store: {
    ios: {
      appId: "1111111111",
      url: "https://apps.apple.com/app/id1111111111",
      teamId: "ABCDE12345",
      bundleId: "com.example.aurora",
    },
    android: {
      packageName: "com.example.aurora",
      url: "https://play.google.com/store/apps/details?id=com.example.aurora",
      sha256Fingerprints: [
        "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99",
      ],
    },
    // Pinned so the demo is deterministic. Drop both and they are looked up instead.
    rating: 4.7,
    reviewCount: 12400,
    downloads: "2M+",
    autoFetch: false,
  },

  attribution: {
    // No `oneLink` on purpose, so `/go/...` falls through to the store and a click on the live
    // demo lands on a real App Store page. A placeholder OneLink answers "Application ID not
    // found", which is correct of AppsFlyer and a poor first impression of the template.
    // Atlas carries the OneLink demonstration instead.
    //
    // A real deploy sets this: it is what carries `pid`, `c` and the `af_*` fields through to
    // the install. Without one a `/go/...` link keeps its routing but loses its attribution.
    metaPixelId: "000000000000000",
    tiktokPixelId: "CABCDE1234500",
  },

  // Hero-only, like the app's own site. A tenant living in the shared deploy earns its blocks
  // by having something to put in them; until then an empty section is worse than no section.
  // When content does grow past a handful of pages, that is the signal to graduate (spec §10).
  content: { features: [], steps: [], faq: [] },

  // Turkish marketing copy. The legal documents are not translated, so `/tr/privacy` serves the
  // English text with a notice and no `hreflang="tr"` is claimed for it.
  i18n: {
    defaultLocale: "en",
    locales: {
      tr: {
        tagline: "Günün, bir dakikada yazılmış",
        description:
          "Aralara sığan bir günlük: günde tek soru, istersen bir fotoğraf ve tuttukça daha çok işe yarayan özel bir arşiv.",
      },
    },
  },

  legal: {
    companyName: "Example Labs Ltd",
    companyUrl: "https://example.com",
    companyAddress: "9 Example Street, London EC1A 1BB",
    supportEmail: "support@aurora.example",
    governingLaw: "England and Wales",
    hasAccounts: true,
    hasSubscriptions: true,
  },


  // Most promo links need no entry here at all: `/go/influencer/alice` already reports as its
  // own media source, so a new creator is a URL someone types rather than a deploy. Register a
  // link only to override what its path says — a renamed campaign, or a creative code that
  // would be noise in the URL.
  campaigns: {
    "podcast/inkfluencer": { campaign: "podcast_ep_42", ad: "midroll" },
  },

  // Fictional handles: the template ships examples, not anyone's real accounts.
  social: {
    instagram: "https://instagram.com/example",
    twitter: "https://x.com/example",
    tiktok: "https://tiktok.com/@example",
  },

  features: { blog: false, desktopQr: false },

  // Short, memorable aliases for the attribution route. `aurora.example/download` is easier to
  // say on a podcast or print on a flyer than `/go/download`, and it keeps every share going
  // through one place we can retarget without reissuing the link.
  redirects: [
    { from: "/download", to: "/go/download", permanent: false },
    { from: "/get", to: "/go/download", permanent: false },
  ],
});
