# Config reference

Every field a tenant can set. This is the whole surface — there is nothing configurable that is
not on this page, and nothing here needs a code change to use.

The schema is `packages/landing-kit/src/config/schema.ts`, and `defineAppConfig` validates
against it as the module loads. A missing or malformed field fails `next build` rather than
shipping quietly.

**Two configs to read alongside this:**

| | What it shows |
|---|---|
| [`apps/multi/config/atlas.ts`](../apps/multi/config/atlas.ts) | The minimum. iOS only, hero-only page |
| [`apps/aurora/config.ts`](../apps/aurora/config.ts) | Everything. The long page in the README screenshot |

---

## How much page you get

The layout is not a setting. **A block renders when it has data and disappears when it does
not**, so the same code produces a one-screen page and a long one:

```ts
// Hero only — header, hero, ratings strip, minimal footer. One screen, no scroll.
// `content` can be left out entirely; this is what omitting it means.
content: { features: [], steps: [], faq: [] }

// The long page in the screenshot — adds feature cards, how-it-works, FAQ,
// a closing CTA and the full footer.
content: {
  features: [{ title: "…", body: "…" }, …],
  steps:    [{ title: "…", body: "…" }, …],
  faq:      [{ q: "…", a: "…" }, …],
}
```

Each of the three is independent: features with no FAQ is fine, and that section simply is not
there. `features.blog = true` adds the blog on top.

The item shapes: a feature is `{ title, body }` plus an optional `image` (a path under
`public/`, e.g. `/apps/{slug}/feature-search.svg` — given, the card shows it above the text); a
step is `{ title, body }`; an FAQ entry is `{ q, a }`. FAQ entries also become `FAQPage`
structured data, and with none the markup is not emitted rather than emitted empty.

This works exactly the same in `apps/multi` as in a graduated app — the screenshot is of
`apps/aurora`, but a shared-deploy tenant with the same `content` renders the same page.

That said, a new app in the shared deploy is usually better hero-only. A block earns its place
by having something real to put in it, and three cards of filler convert worse than no cards.
Content growing past a handful of pages is the signal to
[graduate](graduation.md), which is where the long layout has room to keep growing.

---

## Required

| Field | Type | Notes |
|---|---|---|
| `slug` | `string` | Internal id. Must match the `public/apps/{slug}/` folder name. Never appears in a public URL |
| `domain` | `string` | Bare host. `myapp.ai` ✅ — `https://myapp.ai/` ❌. Must match the domain added in Vercel exactly, or the deployment 404s |
| `name` | `string` | The app's name, used in metadata, JSON-LD and legal documents |
| `tagline` | `string` | The `h1`. Carries the keyword |
| `description` | `string` | 70–160 characters. Google truncates around 155 |

### `theme`

| Field | Type | Default | Notes |
|---|---|---|---|
| `accent` | hex string | — | The one accent colour. Everything else is a neutral scale |
| `mode` | `"dark" \| "light"` | `"dark"` | Flips the whole token set |

### `assets`

Paths under `public/`, so `/apps/{slug}/icon.svg`.

| Field | Required | Notes |
|---|---|---|
| `icon` | yes | Square, 512px minimum. Also drawn into the OG image |
| `logo` | yes | Horizontal, for the header |
| `mockup` | yes | The hero phone image. **Drop the real store screenshot in as-is** — dimensions are read from the file header, so any size keeps its aspect ratio with no config entry |
| `ogImage` | no | Overrides the generated OG image entirely |

### `store`

At least one of `ios` / `android` is required.

| Field | Required | Notes |
|---|---|---|
| `ios.appId`, `ios.url` | with `ios` | |
| `ios.country` | no (`"us"`) | The storefront the rating is read from. `us` is the wrong number to publish for an app whose audience is elsewhere |
| `ios.teamId`, `ios.bundleId` | no | Both or neither. Only used to generate `apple-app-site-association`; omit both and the file is not served |
| `android.packageName`, `android.url` | with `android` | |
| `android.sha256Fingerprints` | no | Without it `assetlinks.json` is not generated and Android App Links cannot verify |
| `rating`, `reviewCount` | no | Pin both to override the lookup. One without the other is rejected — Google treats a half `aggregateRating` as an error |
| `downloads` | no | Free text, e.g. `"2M+"` |
| `autoFetch` | no (`true`) | Looks the rating up from the App Store at build time when not pinned |

Leave `rating`, `reviewCount` and `downloads` all unset — the normal case for a new app — and
the ratings strip does not render at all. An empty "0 reviews" line converts worse than nothing.

### `legal`

Fills the generated legal documents, which are whole `.tsx` files rather than templated
fragments — readable end to end by whoever signs off on them.

| Field | Notes |
|---|---|
| `companyName`, `companyAddress`, `supportEmail`, `governingLaw` | |
| `companyUrl` | Optional. Links the footer copyright to your company site |
| `hasAccounts` | `true` generates `/delete-account`, which Play requires of any app with sign-in |
| `hasSubscriptions` | `true` adds the EULA sections and generates `/refund-policy` |

Both booleans are load-bearing: set `hasAccounts: false` and `/delete-account` returns 404 and
is absent from the sitemap, rather than existing and saying nothing.

---

## Optional

### `attribution`

See [the README's attribution section](../README.md#marketing-and-attribution) for how these fit
together.

| Field | Notes |
|---|---|
| `oneLink` | AppsFlyer OneLink. **Without it a `/go/...` link still routes to the right store but carries no attribution** |
| `appsflyerDevKey` | Enables the AppsFlyer smart script |
| `metaPixelId`, `tiktokPixelId`, `googleAdsId` | None load before consent is granted. The consent banner appears only when at least one is set |
| `conversionEvent.meta` | Default `"Lead"`. The event sent on a store click |
| `conversionEvent.tiktok` | Default `"Download"` |
| `conversionEvent.googleAdsLabel` | Google Ads needs `AW-ID/Label`. Without the label nothing is reported, since there is no conversion action to attribute to |

### `features`

| Field | Default | What turning it on does |
|---|---|---|
| `blog` | `false` | Opens `/blog` and `/blog/{slug}`, reading Markdown from `content/{slug}/blog/`. Off, those routes 404 and are absent from the sitemap |
| `desktopQr` | `false` | A desktop visitor to `/go/...` gets a QR page instead of the store's web page |
| `analytics` | `false` | Vercel Web Analytics. Cookieless and first-party, so it needs no consent banner. Also needs enabling in the Vercel project |

### `i18n`

| Field | Default | Notes |
|---|---|---|
| `defaultLocale` | `"en"` | Never appears in a URL: `myapp.ai/privacy`, not `/en/privacy` |
| `autoRedirect` | `false` | Redirect by `Accept-Language` on first visit |
| `locales` | `{}` | Translations, keyed by locale. Each may override `tagline`, `description` and any part of `content` |

Adding a language never invalidates a URL already filed with the App Store, because the default
locale stays unprefixed. An untranslated field falls back on its own, and a legal document with
no translation serves the default language with a notice rather than claiming an `hreflang` it
cannot deliver.

### `campaigns`

Overrides for `/go/...` paths, keyed by the whole path:

```ts
campaigns: {
  "podcast/inkfluencer": { campaign: "podcast_ep_42", ad: "midroll" },
}
```

Only for renaming a campaign or keeping a creative code out of a URL people will see. **A new
link needs no entry here** — `/go/{source}/{campaign}/{creative}` reads its attribution from the
path, which is what makes a new creator or channel a URL someone types rather than a deploy.

### `redirects`

Short aliases, so what you print and what you measure are the same link:

```ts
redirects: [
  { from: "/download", to: "/go/download", permanent: false },
]
```

### `social`

`instagram`, `twitter`, `facebook`, `tiktok`, `youtube`, `linkedin` — all optional, full URLs.
Only the ones given get an icon in the footer.

---

## What is deliberately not configurable

Adding a field for any of these is a design error, not a missing feature:

- **Layout order or which blocks exist.** Blocks appear when they have data. There is no
  `showFeatures: true`
- **Fonts, spacing, breakpoints.** One accent per tenant; everything else is shared, so a fix to
  the type scale reaches every app at once
- **Anything that would need a CMS.** Content lives in the config and in Markdown files
- **Skipping the consent gate.** A pixel that loads before consent is a compliance problem, not
  a setting
