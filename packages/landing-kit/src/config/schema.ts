import { z } from "zod";

/**
 * Bare host: no protocol, no port, no trailing slash, lowercase.
 * Makes the `Host: <domain>` / protocol-less Sitemap bug from spec §5.4 structurally impossible.
 */
const bareHost = z
  .string()
  .regex(
    /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/,
    "domain must be a host with no protocol, no port and no slashes (e.g. \"aurora.example\")",
  );

const slug = z
  .string()
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "slug may only contain lowercase letters, digits and hyphens");

const hexColor = z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "accent must be a valid hex color");

const assetPath = z.string().startsWith("/", "asset path must start with \"/\"");

const httpsUrl = z.url({ protocol: /^https$/ });

/** A BCP-47 language tag: "en", "tr", "pt-BR". */
const bcp47 = z
  .string()
  .regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, "locale must be a BCP-47 tag such as \"en\" or \"pt-BR\"");

const featureSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  image: assetPath.optional(),
});
const stepSchema = z.object({ title: z.string().min(1), body: z.string().min(1) });
const faqSchema = z.object({ q: z.string().min(1), a: z.string().min(1) });

/** Marketing copy for the default locale. Absent blocks default to empty and are not rendered. */
const contentSchema = z.object({
  features: z.array(featureSchema).default([]),
  steps: z.array(stepSchema).default([]),
  faq: z.array(faqSchema).default([]),
});

/**
 * The same copy for a translation. Every block is optional **without a default**, which is the
 * whole point: an omitted block has to stay `undefined` so it falls back to the default locale.
 * `contentSchema.partial()` would not do — zod keeps the inner `.default([])`, so a partial
 * translation would silently blank out the sections it did not translate.
 */
const contentOverrideSchema = z.object({
  features: z.array(featureSchema).optional(),
  steps: z.array(stepSchema).optional(),
  faq: z.array(faqSchema).optional(),
});

const iosStoreSchema = z.object({
  appId: z.string().regex(/^\d+$/, "iOS appId consists of digits only"),
  url: httpsUrl,
  /**
   * Storefront the rating is read from, as a two-letter country code. Ratings differ per
   * storefront and the lookup defaults to the US, which is the wrong number to publish for an
   * app whose audience is somewhere else.
   */
  country: z
    .string()
    .regex(/^[a-z]{2}$/, 'country must be a two-letter lowercase code such as "tr"')
    .default("us"),
  /** Apple Developer team id. Needed, with `bundleId`, to generate the Universal Links file. */
  teamId: z.string().optional(),
  /** App bundle id. Needed, with `teamId`, to generate the Universal Links file. */
  bundleId: z.string().optional(),
});

const androidStoreSchema = z.object({
  packageName: z
    .string()
    .regex(/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i, "packageName must be in reverse-DNS format"),
  url: httpsUrl,
  sha256Fingerprints: z
    .array(z.string().regex(/^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/i, "fingerprint must be a colon-separated 32-byte SHA-256"))
    .optional(),
});

export const appConfigSchema = z
  .object({
    slug,
    domain: bareHost,
    name: z.string().min(1),
    tagline: z.string().min(1),
    // Google truncates the description under the title at ~155 characters; the lower bound
    // keeps overly short descriptions from looking weak in the SERP.
    description: z.string().min(70).max(160),

    theme: z.object({
      accent: hexColor,
      mode: z.enum(["dark", "light"]).default("dark"),
    }),

    assets: z.object({
      icon: assetPath,
      logo: assetPath,
      mockup: assetPath,
      ogImage: assetPath.optional(),
    }),

    store: z
      .object({
        ios: iosStoreSchema.optional(),
        android: androidStoreSchema.optional(),
        /**
         * Rating and review count.
         *
         * Leave both out and they are fetched from the App Store at build time (see
         * `autoFetch`) — a hard-coded figure goes stale the day it is written, and a stale
         * `aggregateRating` is published as structured data. Set both to pin them instead;
         * a value here always wins over the fetched one.
         */
        rating: z.number().min(0).max(5).optional(),
        reviewCount: z.number().int().nonnegative().optional(),
        /**
         * Look the rating up from the App Store when it is not pinned above.
         *
         * Uses the public iTunes lookup endpoint, server-side, cached for a day. Turn it off to
         * keep the build free of outbound requests; the social-proof strip then simply does not
         * render unless the figures are pinned.
         */
        autoFetch: z.boolean().default(true),
        /** Download count. No public API exposes this, so it is config-only. */
        downloads: z.string().optional(),
      })
      .refine((s) => s.ios !== undefined || s.android !== undefined, {
        message: "at least one of store.ios or store.android is required",
      })
      .refine((s) => (s.rating === undefined) === (s.reviewCount === undefined), {
        message:
          "rating and reviewCount must be given together — Google requires both for aggregateRating",
      }),

    attribution: z
      .object({
        oneLink: httpsUrl.optional(),
        appsflyerDevKey: z.string().optional(),
        metaPixelId: z.string().optional(),
        tiktokPixelId: z.string().optional(),
        googleAdsId: z.string().optional(),

        /**
         * The event reported to the ad platforms when a visitor clicks through to a store.
         *
         * Without one the pixels report a page view and nothing else, so a campaign is
         * optimised on "someone opened the page" rather than "someone went to install" — the
         * platform cannot tell a bounce from a conversion, and it spends the budget as if they
         * were the same.
         *
         * Names, not booleans, because the right one depends on how the ad account defines its
         * conversion. The defaults are each platform's closest standard event; change them
         * rather than inventing a custom one unless the ad account already expects a custom.
         */
        conversionEvent: z
          .object({
            /** Meta standard event. `Lead` is the usual choice for a store click. */
            meta: z.string().default("Lead"),
            /** TikTok standard event. `Download` is the one that matches an app install. */
            tiktok: z.string().default("Download"),
            /**
             * Google Ads needs a conversion *label*, not just the account id: the full
             * `send_to` is `AW-XXXXXXX/LabelHere`. Without the label the account has no
             * conversion action to attribute to, so nothing is reported at all.
             */
            googleAdsLabel: z.string().optional(),
          })
          .prefault({}),
      })
      // `prefault`, not `default`: `default` supplies the *output* value, so an omitted
      // `attribution` block would have to spell out every nested default here and they would
      // drift from the ones above. `prefault` supplies the input and lets the schema fill it in.
      .prefault({}),

    // `prefault({})` so a hero-only tenant can leave it out entirely rather than writing three
    // empty arrays to say "no extra sections". The inner defaults fill it in.
    content: contentSchema.prefault({}),

    /**
     * Localisation. The default locale's copy is the top-level `tagline`, `description` and
     * `content`; `locales` carries the translations.
     *
     * The default locale stays unprefixed in the URL (`/privacy`), so adding a language never
     * invalidates a link already printed on a flyer or filed with the App Store.
     */
    i18n: z
      .object({
        defaultLocale: bcp47.default("en"),
        /**
         * Send a first-time visitor to their own language on the site root.
         *
         * Off by default and narrow by design: only `/`, never a deep link, never a crawler,
         * and never once the visitor has chosen. `hreflang` already tells search engines about
         * the translations; a blanket redirect competes with it and can hide languages from
         * indexing entirely.
         */
        autoRedirect: z.boolean().default(false),
        locales: z
          .record(
            bcp47,
            z.object({
              tagline: z.string().min(1).optional(),
              description: z.string().min(70).max(160).optional(),
              content: contentOverrideSchema.optional(),
            }),
          )
          .default({}),
      })
      .default({ defaultLocale: "en", autoRedirect: false, locales: {} }),

    legal: z.object({
      companyName: z.string().min(1),
      /** Corporate site. When set, the footer copyright links to it. */
      companyUrl: httpsUrl.optional(),
      companyAddress: z.string().min(1),
      supportEmail: z.email(),
      governingLaw: z.string().min(1),
      hasAccounts: z.boolean(),
      hasSubscriptions: z.boolean(),
    }),

    /**
     * Named promo links. `/go/{key}` picks up these attribution defaults instead of the
     * generic web source, so an influencer, a podcast read and a print flyer land in separate
     * media sources in the attribution dashboard.
     *
     * Registering a link is optional: `/go/{anything}` keeps working without an entry, which
     * is what makes a one-off link possible without a deploy.
     */
    campaigns: z
      .record(
        z
          .string()
          .regex(
            /^[a-z0-9][a-z0-9_-]*(\/[a-z0-9][a-z0-9_-]*)*$/,
            "campaign keys are lowercase path segments, e.g. \"alice\" or \"influencer/alice\"",
          ),
        z
          .object({
            /** AppsFlyer `pid`. Falls back to the path's first segment, then "web". */
            source: z.string().min(1).optional(),
            /** AppsFlyer `c`. Falls back to the campaign segment of the path. */
            campaign: z.string().min(1).optional(),
            /** AppsFlyer `af_adset`. */
            adset: z.string().min(1).optional(),
            /** AppsFlyer `af_ad` — the individual creative or placement. */
            ad: z.string().min(1).optional(),
          })
          // An entry that overrides nothing is a link that did not need registering — the path
          // already carries everything. Catching it here keeps the registry meaningful.
          .refine((entry) => Object.values(entry).some(Boolean), {
            message:
              "a campaign entry must override at least one field; a link that overrides nothing needs no entry",
          }),
      )
      .default({}),

    social: z
      .object({
        instagram: httpsUrl.optional(),
        twitter: httpsUrl.optional(),
        facebook: httpsUrl.optional(),
        tiktok: httpsUrl.optional(),
        youtube: httpsUrl.optional(),
        linkedin: httpsUrl.optional(),
      })
      .optional(),

    features: z
      .object({
        blog: z.boolean().default(false),
        /**
         * Show a QR page to desktop visitors instead of redirecting them.
         *
         * Off by default: a shared link should just work. Sending a desktop visitor to the
         * store's web page still lets them read the listing and hit "get" on their phone,
         * whereas an interstitial asks them to do something before anything happens.
         */
        desktopQr: z.boolean().default(false),

        /**
         * Vercel Web Analytics — page views, referrers and which `/go/...` links get clicked.
         *
         * Off by default: it is a request per visit that a tenant should opt into rather than
         * inherit, and a deploy outside Vercel has nothing to receive it.
         *
         * Deliberately *not* behind the consent gate, and it is the only third-party-shaped
         * thing here that is not. Vercel serves the script and its beacon from
         * `/_vercel/insights` on the site's own domain, sets no cookie and stores no identifier
         * — so there is no third-party request to gate and nothing a banner would be asking
         * permission for. Anything that does set a cookie or leave the domain still goes
         * through `Pixels`.
         */
        analytics: z.boolean().default(false),
      })
      .default({ blog: false, desktopQr: false, analytics: false }),

    redirects: z
      .array(z.object({ from: z.string().startsWith("/"), to: z.string(), permanent: z.boolean() }))
      .optional(),
  })
  // Universal Links: all three are needed together for the AASA to be generated. If one is
  // missing, the file is silently generated wrong and deep links break — the most common mistake.
  .refine(
    (c) => {
      const ios = c.store.ios;
      if (!ios) return true;
      const given = [ios.teamId, ios.bundleId].filter(Boolean).length;
      return given === 0 || given === 2;
    },
    {
      message:
        "store.ios must give teamId and bundleId together or neither — both are needed to generate the Universal Links file",
      path: ["store", "ios"],
    },
  );

export type AppConfig = z.output<typeof appConfigSchema>;
export type AppConfigInput = z.input<typeof appConfigSchema>;
