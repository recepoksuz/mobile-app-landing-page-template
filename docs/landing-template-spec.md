# App Landing Template — Architecture and Build Specification

> This document is a build prompt. The goal: a landing page infrastructure for mobile apps,
> set up once, that eliminates doing web work from scratch for every new app.

---

## 1. Purpose and Philosophy

This is not a "website" project, it is a **deploy-artifact** production line.

The metric being optimized: **the time it takes to launch a new app.** Target: under 1 hour, writing zero code.

Context: the growth channel for the apps is paid UA (Meta/TikTok) + ASO. Conversion happens on the App Store /
Play side, not on the web. The site is therefore not a marketing asset, it is
**a mandatory surface that does three jobs**:

1. The marketing, support, privacy and account-deletion URLs that App Store / Play require
2. Routing an ad's web click to the right store or deep link (attribution)
3. A professional web presence for business verification

Do these three flawlessly and go no further.

### Design principle

There is no separate repo, separate pipeline, separate deploy per app. **One monorepo, a shared
package, multiple domains.** A new app = one config file + one asset folder + one DNS record.

The critical point: **the domain is the abstraction boundary itself.** A search engine sees the
`example.ai` domain; it does not know whether a shared deploy or a dedicated one sits behind it.
Because of this, pulling an app out of the shared setup is only a DNS change — no redirects,
no URL changes, no loss of link equity. The architecture is not a one-way door.

---

## 2. Repo Structure

```
landing/
├── packages/
│   └── landing-kit/              # shared core
│       ├── src/
│       │   ├── types/app-config.ts
│       │   ├── components/       # Hero, Features, FAQ, Footer, StoreButtons, QRCode...
│       │   ├── seo/              # metadata, json-ld, og-image
│       │   ├── legal/            # privacy/terms/refund templates (filled in from config)
│       │   ├── tracking/         # consent gate, pixel loaders
│       │   └── theme/            # design tokens
│       └── package.json
│
├── apps/
│   ├── multi/                    # multi-domain — the default home for new apps
│   │   ├── config/
│   │   │   ├── index.ts          # host -> config registry
│   │   │   ├── aurora.ts
│   │   │   └── atlas.ts
│   │   ├── middleware.ts         # host -> tenant resolution
│   │   ├── app/
│   │   └── public/apps/{slug}/   # assets per app
│   │
│   └── aurora/                   # a graduated app — its own deploy
│       └── imports landing-kit
│
├── turbo.json
└── pnpm-workspace.yaml
```

**Why a monorepo + package:** When you make a shared SEO or legal fix, it reaches both
every tenant inside `apps/multi` and the graduated apps at the same time.
There is no copy-paste fork.

Stack: **pnpm workspace + Turborepo, Next.js App Router, TypeScript, Tailwind CSS.**
Deploy: Vercel. Cloudflare in front.

**No CMS will be used.** The config file already is the CMS. Adding a CMS directly undermines
the project's reason for existing (not having to focus on the web every time).

---

## 3. AppConfig — The Single Source of Truth

Every app is defined by a single typed config object. Everything on the page, in the metadata and in
the legal texts is derived from it. There are no hardcoded strings anywhere.

```ts
export type AppConfig = {
  slug: string;                    // "aurora"
  domain: string;                  // "aurora.example" — canonical host
  name: string;                    // "Aurora"
  tagline: string;                 // the h1 text, carries the keyword
  description: string;             // meta description + OG description (150-160 characters)

  theme: {
    accent: string;                // "#f63a80"
    mode: "dark" | "light";        // default: "dark"
  };

  assets: {
    icon: string;                  // app icon (square, min 512px)
    logo: string;                  // horizontal logo (SVG preferred)
    mockup: string;                // hero phone image — same as the store screenshots
    ogImage?: string;              // generated dynamically if not provided
  };

  store: {
    ios?: {
      appId: string;               // "1111111111"
      url: string;
      scheme?: string;             // "aurora://" — for universal links
      teamId?: string;             // for the AASA file
      bundleId?: string;           // for the AASA file
    };
    android?: {
      packageName: string;         // "com.example.aurora"
      url: string;
      sha256Fingerprints?: string[]; // for assetlinks.json
    };
    rating?: number;               // 4.7
    reviewCount?: number;          // 12400
    downloads?: string;            // "10M+"
  };

  attribution: {
    oneLink?: string;              // AppsFlyer OneLink URL
    appsflyerDevKey?: string;
    metaPixelId?: string;
    tiktokPixelId?: string;
    googleAdsId?: string;
  };

  content: {
    features: Array<{ title: string; body: string; image?: string }>;
    steps?: Array<{ title: string; body: string }>;
    faq: Array<{ q: string; a: string }>;   // feeds both the UI and the FAQPage schema
  };

  legal: {
    companyName: string;
    companyAddress: string;
    supportEmail: string;
    governingLaw: string;          // "England and Wales"
    hasAccounts: boolean;          // if true, the /delete-account route is generated mandatorily
    hasSubscriptions: boolean;     // if true, EULA + refund policy are generated
  };

  social?: { instagram?: string; twitter?: string; facebook?: string; tiktok?: string };

  features?: {                     // optional capability flags
    blog?: boolean;
    qrCode?: boolean;              // default true
  };

  redirects?: Array<{ from: string; to: string; permanent: boolean }>;
};
```

**Rule:** If changing a tenant's behaviour requires touching a file other than
`apps/multi/config/*.ts`, that feature has been designed wrong.

---

## 4. The Required Route Set

These are not "nice to have", they are **store requirements**. If one is missing, the app is rejected.

| Route | Requirement | Source |
|---|---|---|
| `/` | Apple marketing URL | config |
| `/privacy` | Required by Apple + Play | `legal/` template + config |
| `/terms` | Required if there are subscriptions (EULA) | `legal/` template + config |
| `/support` | **Apple support URL required** | config |
| `/contact` | alias for `/support` | — |
| `/delete-account` | **Required by Play** — if `hasAccounts: true` | `legal/` template |
| `/refund-policy` | if `hasSubscriptions: true` | `legal/` template |
| `/.well-known/apple-app-site-association` | Universal Links | generated from config |
| `/.well-known/assetlinks.json` | Android App Links | generated from config |
| `/go/[campaign]` | Attribution redirect | generated from config |

The last three will be **embedded in code as route handlers**, not manually managed static files.
The most common reason a deep link does not work is these files being forgotten or being served
with the wrong `Content-Type`. `apple-app-site-association` must be served without an extension and
as `application/json`.

---

## 5. SEO and Sharing Layer

Blog/content SEO will not be set up — as long as the channel is paid UA there is no ROI in it. However, the
three below are **written once, require zero maintenance** and deliver concrete gains:

### 5.1 Metadata
Derived from the config with Next.js `generateMetadata`: `title`, `description`, `canonical`,
`openGraph`, `twitter`. Every tenant uses its own host as the canonical.

### 5.2 Dynamic OG Image
Generated at runtime with `ImageResponse` (`next/og`): app icon + tagline + rating stars
+ accent colour background. 1200x630.

> The reference sites have no `og:image` at all; when a link is shared it looks bare. This is a direct
> CTR loss and one of the cheapest wins.

### 5.3 JSON-LD Structured Data
- `SoftwareApplication` — `aggregateRating`, `offers`, `operatingSystem`, `applicationCategory`
- `Organization` — from the `legal` block
- `FAQPage` — automatically from the `content.faq` array

### 5.4 sitemap.ts and robots.ts
Next.js native APIs will be used, no static file **will be written**. The host comes from the active
tenant's config.

> The reason for this item is concrete: one of the reference sites has a `robots.txt` copied from
> another project, carrying the lines `Host: <domain>` / `Sitemap: <domain>/sitemap.xml`
> (protocol-less, invalid). On the other three, `sitemap.xml` returns 404. In the generated file this mistake
> must be structurally impossible.

---

## 6. Attribution and Tracking

### 6.1 Redirection
The `/go/[campaign]` route handler:
- Platform detection from the user-agent (iOS / Android / desktop)
- Redirect to the AppsFlyer OneLink with campaign parameters
- On desktop, show a page with a QR code instead of redirecting

**Ad creatives point at this route, not directly at the store.** That way a store change
or an A/B test is done by updating a single route rather than the creatives.

### 6.2 Pixels — consent-gated
AppsFlyer Smart Script, Meta Pixel, TikTok Pixel, Google Ads.

**Mandatory: a consent gate.** Pixels will not be loaded unconditionally; they will be mounted after
a simple CMP banner. The reference sites do not gate their pixels, and any site taking European traffic needs to — this is a behaviour
to be fixed, not copied.

The consent preference is stored in `localStorage`. If it is refused, no third-party script is loaded.

---

## 7. Conversion Mechanics

- **A single, device-detected CTA.** App Store on iOS, Play on Android, a QR code on desktop.
  Do not put the two store buttons side by side — giving a desktop visitor a store link is a dead click.
- **Social proof right under the hero**: rating + review count + download count. If it is present in the
  config it is rendered, otherwise the block is hidden entirely.
- **The hero image will be the app's own screen** and the **exact same** images as the screenshots on the
  store will be used. When a visitor goes to the store they should see the same thing; consistency feeds conversion.

---

## 8. Design System

Visual reference: a plain, dark, single-screen, mockup-centric app landing page.
The tokens below were extracted from that site and can be used as a starting scale.

```css
:root {
  color-scheme: dark;
  --color-bg: #000000;
  --color-fg: #ffffff;
  --color-muted: #636366;
  --color-accent: <config.theme.accent>;   /* #f63a80 in the reference */
  --site-width: 90rem;                      /* 1440px */
  --content-padding: 1.5rem;                /* mobile */
  --layout-padding: 1.5rem;
}
```

`--content-padding` grows in steps across breakpoints: `1.5 → 2.19 → 3.44 → 4.69 → 5.31 → 6.25 → 7.5rem`.

### Rules
- **Dark-first.** `mode` comes from the config but the default is dark; it is the standard in the AI app
  category and it sits better on top of before/after images.
- **A single accent colour** comes from the config; everything else is a neutral grey scale. Tenants
  differ from each other only by accent, icon and mockup.
- **Font: Inter or Geist.** The reference site self-hosts `SF Pro Display` — Apple's
  licence limits that font essentially to app interfaces on Apple platforms,
  and distributing it on the web is a grey area. It will not be copied.
- The visual weight is in the mockup; keep the typography calm and on a single size scale.

---

## 9. Landing Page Composition

A single page, at most 7 blocks. If the relevant data is not in the config, the block is not rendered at all.

1. **Header** — logo, minimal nav (Home / Privacy / Terms / Support), hamburger on mobile
2. **Hero** — app icon, `h1` (tagline), description paragraph, device-detected CTA, phone mockup
3. **Social proof strip** — rating, review count, download count
4. **Features** — 3 of them, visually driven (`content.features`)
5. **How it works** — 3 steps (`content.steps`)
6. **FAQ** — accordion (`content.faq`), the `FAQPage` schema is generated from the same data
7. **Closing CTA + QR** and **Footer** — social icons, legal links, copyright line

> Note: The reference site consists only of blocks 1 + 2 + 7 (hero-only). The template must support this
> minimum form; the intermediate blocks should switch on optionally with config data.

---

## 10. Graduation

An app can leave the shared setup and move to its own deploy. The decision is not left to gut feeling.

### Triggers — split it out when one of these happens
- Content SEO requires 20+ pages or a CMS
- A product surface is needed on the same domain (not a subdomain)
- A separate team or release cadence takes ownership
- Build time is slowing down the other tenants
- A need for a different framework or runtime arises

If none apply, it stays inside `apps/multi`. The majority of the apps will never graduate.

### Steps
1. Create `apps/{slug}`, add `landing-kit` as a dependency
2. Move `config/{slug}.ts` and the `public/apps/{slug}/` folder
3. Verify the new deploy on its preview URL
4. Remove the tenant from the `apps/multi` registry
5. Point DNS at the new deploy

Because the domain does not change, it leaves zero trace for search engines and users.

### Interim solution: SEO without graduating
In most cases graduation is not necessary. The `features.blog = true` flag opens the
`app/[tenant]/blog/[slug]` route inside `apps/multi`; since the sitemap is already generated per host there is
no extra work. 20-30 content pages fit comfortably into the shared setup.

### Web product
Product surfaces such as auth, dashboard and checkout **never live in the landing repo** —
they should not live there in a single-app architecture either. These go to the `app.{domain}` subdomain: separate repo,
separate deploy, separate release cadence. The apex domain stays as the marketing page.

---

## 11. What Will Not Be Built

These are deliberately out of scope; the door will not be left ajar with "we'll add it later":

- **The blog/content engine will not be on by default.** Building a content infrastructure that will
  never be maintained is worse than not building one.
- **No CMS integration.** The config file is the single source of truth.
- **No programmatic landing page generation.**
- **No multiple CTAs.** A single, device-detected button.
- **No hand-written `robots.txt` / `sitemap.xml`.** Only `robots.ts` / `sitemap.ts`.
- **Font self-hosting only with clearly licensed fonts.**
- **No pixel loading without consent.**

---

## 12. Acceptance Criteria

The template counts as complete when all of the following hold:

1. A new app can be launched with **only** one config file + one asset folder + one DNS record.
   No other file is touched.
2. All the routes in section 4 are generated automatically for every tenant; the `hasAccounts` /
   `hasSubscriptions` flags correctly switch the conditional routes on and off.
3. `robots.txt` and `sitemap.xml` are generated with the correct host for every tenant; no tenant
   leaks another tenant's host.
4. `og:image` is generated dynamically for every tenant and the sharing preview looks correct.
5. JSON-LD passes the Google Rich Results Test without errors.
6. `apple-app-site-association` and `assetlinks.json` are served with the correct `Content-Type`.
7. When consent is refused, no third-party script is loaded (verified from the network tab).
8. Lighthouse: Performance and SEO 95+, Accessibility 100.
9. Graduating a tenant takes less than 30 minutes and `landing-kit` updates keep reaching
   the graduated apps.
