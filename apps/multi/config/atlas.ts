import { defineAppConfig } from "@landing/kit/config";

/**
 * PLACEHOLDER DATA — see the note at the top of aurora.ts.
 *
 * This tenant deliberately represents a brand-new app: no accounts, no subscriptions, no
 * content blocks, and no store figures to show yet. That makes it possible to verify that the
 * conditional routes and blocks really do switch off (spec §9, "hero-only") — including the
 * social-proof strip, which disappears along with its two rules when there is nothing to put
 * in it.
 */
export const atlas = defineAppConfig({
  slug: "atlas",
  domain: "atlas.example",
  name: "Atlas",
  tagline: "Every trip you have taken, on one map",
  description:
    "Add a place, a date and a photo. Atlas draws the map, counts the countries and remembers where you stayed and what it cost.",

  theme: { accent: "#3b82f6", mode: "dark" },

  assets: {
    icon: "/apps/atlas/icon.svg",
    logo: "/apps/atlas/logo.svg",
    mockup: "/apps/atlas/mockup.svg",
  },

  store: {
    ios: {
      appId: "1234567890",
      url: "https://apps.apple.com/app/id1234567890",
      country: "us",
    },
  },

  attribution: {
    // Atlas carries the OneLink demonstration. Aurora — the tenant a deployment serves on its
    // own `*.vercel.app` URL — deliberately has none, so a click on the live demo reaches a
    // real store page instead of AppsFlyer's "Application ID not found".
    //
    // This is the only place `/go/...` attribution can survive: `pid`, `c` and the `af_*`
    // fields ride on the OneLink URL and a plain store link carries none of them.
    oneLink: "https://atlas.onelink.me/abcd",
  },

  // Renaming a campaign, or keeping a creative code out of a URL people will see. The path
  // already carries attribution without any entry here; this only overrides it.
  campaigns: {
    "podcast/inkfluencer": { campaign: "podcast_ep_42", ad: "midroll" },
  },

  content: {
    features: [],
    steps: [],
    faq: [],
  },

  legal: {
    companyName: "Example Labs Ltd",
    companyUrl: "https://example.com",
    companyAddress: "9 Example Street, London EC1A 1BB",
    supportEmail: "support@atlas.example",
    governingLaw: "England and Wales",
    hasAccounts: false,
    hasSubscriptions: false,
  },


  // A brand-new app: no ratings, no review count, no download figure. The social-proof strip
  // is not rendered at all in that case — an empty band with two rules is worse than nothing.
  social: {
    instagram: "https://instagram.com/example",
  },

  // Atlas carries the analytics demonstration. Aurora is the tenant Lighthouse is run
  // against, and `/_vercel/insights/script.js` only exists on Vercel — locally it 404s, which
  // is a console error and four Best Practices points for a script that is fine in production.
  // Keeping the two apart means the score still means something.
  features: { blog: false, desktopQr: false, analytics: true },
});
