# App Landing Template

A **deploy-artifact production line** for mobile app landing pages. This is not a website
project: the metric being optimised is time-to-launch for a new app.

**A new app = one config file + one asset folder + one DNS record.**

Full architectural rationale: [`docs/landing-template-spec.md`](docs/landing-template-spec.md)

<p align="center">
  <img src="docs/media/landing.png" alt="A generated landing page: hero with both store badges, ratings strip, feature cards, how-it-works steps, FAQ accordion and footer" width="900">
</p>

<p align="center"><em>Every word, image and link above comes from one config file.</em></p>

---

## What the site is for

The growth channel for these apps is paid UA (Meta/TikTok) plus ASO. Conversion happens on
the App Store / Play side, not on the web. So the site is not a marketing asset — it is a
mandatory surface that does exactly three jobs:

1. The marketing, support, privacy, and account-deletion URLs the App Store and Play require
2. Routing an ad click on the web to the right store or deep link (attribution)
3. A professional web presence for business verification

## Structure

```
packages/landing-kit/   # shared core — config schema, components, SEO, legal templates
apps/multi/             # multi-domain, host -> tenant resolution. Default home for new apps
apps/aurora/            # graduated app example — its own deploy, the same landing-kit
```

Stack: pnpm workspace + Turborepo, Next.js 16 (App Router), React 19, TypeScript, Tailwind v4.
Deploy: Vercel. No CMS — the config file is the single source of truth.

## Getting started

```sh
pnpm install
pnpm --filter multi dev        # http://aurora.localhost:3100
                               # http://atlas.localhost:3100
```

`{slug}.localhost` is mapped automatically by the tenant registry.

One deploy serves every tenant. `abc.ai` and `def.ai` can be two tenants of the same
`apps/multi` deploy — the `Host` header picks which config renders, and each domain gets its
own canonical, sitemap, OG image, and deep-link files. A host the registry does not know
returns 404.

## Commands

```sh
pnpm check                     # typecheck + lint + unit tests
pnpm --filter multi build
pnpm --filter multi test:e2e   # Playwright — verifies the acceptance criteria
```

## Runbooks

- [Launching a new app](docs/adding-a-tenant.md)
- [Deploying](docs/deploy.md)
- [Moving an app to its own deploy (graduation)](docs/graduation.md)
- [AGENTS.md](AGENTS.md) — invariants, gotchas and task recipes for coding agents

## Ready when you need it

Three things the spec deliberately leaves off by default, built so they can be switched on per
tenant without touching anything but a config file:

| | How it turns on | What it costs when off |
|---|---|---|
| **Extra languages** | `i18n.locales` in the config | Nothing — one locale, no prefix |
| **Blog / content SEO** | `features.blog = true` + Markdown files under `content/` | Routes 404, nothing in the sitemap |
| **Real store screenshots** | Drop the file in `public/apps/{slug}/` | Dimensions are read from the file; no config entry |

The default locale stays unprefixed (`myapp.ai/privacy`), so adding a language never invalidates
a URL already filed with the App Store. Every localised field falls back on its own, and legal
documents that have no translation serve the default language with a notice instead of claiming
an `hreflang` they cannot deliver.

## Before you ship a tenant

The demo tenants (`aurora`, `atlas`) are fictional and exist to exercise the template. Two
things in them must be replaced before anything goes live:

- **`legal.*`** — `Example Labs Ltd`, the placeholder address, `companyUrl` and `governingLaw`
  all end up verbatim in the generated privacy policy, terms and refund pages. The legal
  documents in `packages/landing-kit/src/legal/en/` are a **starting point, not legal advice**;
  have a lawyer review them for your jurisdiction and your app's actual data handling.
- **`store.rating` / `reviewCount`** — the demo values are invented. They are published as
  `aggregateRating` in structured data, and shipping numbers you cannot substantiate breaches
  Google's structured data policy. Use your real store figures or omit both fields.

## Deliberately not built

These are out of scope on purpose; no door is left ajar for "we'll add it later":

- The blog/content engine is off by default (opened per-tenant with `features.blog`)
- No CMS integration
- No programmatic landing page generation
- No multiple CTAs — one device-detected button
- No hand-written `robots.txt` / `sitemap.xml`
- No pixel loading without consent
- Fonts are self-hosted only when the licence clearly allows it (SF Pro is not copied)
