# AGENTS.md

Instructions for coding agents working in this repo. Read this before changing anything.

## What this is

A **deploy-artifact production line** for mobile app landing pages, not a website project. The
metric being optimised is time-to-launch for a new app: **a new app must be one config file,
one asset folder, and one DNS record.**

The full architectural rationale is in `docs/landing-template-spec.md`. Read it before any
change that touches structure — it explains *why* things are the way they are, and most
"improvements" an agent is tempted to make are things it rules out on purpose.

## The one rule that matters

> If changing a tenant's behaviour requires editing a file other than `apps/multi/config/*.ts`,
> that feature was designed wrong.

When a task pushes you toward hardcoding something per-app, stop and add it to `AppConfig`
instead. The config is the single source of truth; there is no CMS and there will not be one.

## Layout

```
packages/landing-kit/     @landing/kit — everything shared. Consumed as source, no build step.
  src/config/             zod schema, defineAppConfig, host->tenant registry
  src/i18n/               locale resolution + UI string dictionaries (en, tr)
  src/legal/{locale}/     whole legal documents as .tsx, with a fallback registry
  src/components/         Header, Hero, SocialProof, Features, Steps, Faq, Footer, StoreBadges…
  src/seo/                metadata, JSON-LD, OG image, sitemap, image dimension probe
  src/platform/           UA detection, store/OneLink target resolution
  src/routes/             which routes exist per tenant; config redirects
  src/tracking/           consent gate + pixels
  src/blog/               Markdown loader
  src/theme/              design tokens (Tailwind v4 @theme)

apps/multi/               multi-domain. Default home for new apps.
  config/                 one file per tenant + the registry
  content/{slug}/blog/    Markdown posts, per locale
  proxy.ts                host -> tenant, locale, redirects, www, isolation
  app/[tenant]/[locale]/  the whole route tree

apps/aurora/              a graduated app: its own deploy, same @landing/kit
```

## Commands

```sh
pnpm check                     # typecheck + lint + unit tests — run this before finishing
pnpm turbo build
pnpm --filter multi dev        # http://aurora.localhost:3100 · http://atlas.localhost:3100
pnpm --filter multi test:e2e   # Playwright; builds and starts its own server
pnpm --filter @landing/kit test
```

Ports are **3100** (multi) and **3101** (aurora). Do not move them to 3000 — other projects on
this machine use it, and the Playwright config and docs assume 3100.

Tenants are addressed by host. Locally that means `{slug}.localhost:3100`; with curl, send a
`Host:` header at `127.0.0.1:3100`.

## Invariants — do not break these

Each of these is enforced by a test. If you find yourself changing the test to make your change
pass, you are breaking the invariant, not fixing the test.

1. **Public URLs never contain the tenant slug or the default locale.** `aurora.example/privacy`,
   never `/aurora/privacy` or `/en/privacy`. Both of those return 404 / 308 respectively. This
   is what makes graduation a DNS change and language-adding non-breaking.
2. **An unknown host serves nothing.** 404, empty sitemap, `Disallow: /`. Never let
   `fallbackSlug` apply in production — a stray domain pointed at the deploy would create
   duplicate content under a wrong canonical.
3. **No third-party script loads before consent.** `Pixels` returns `null` unless consent is
   `"granted"`. Fonts are self-hosted via `next/font` so they are unaffected.
4. **Every store link goes through `/go/...`.** Never link straight to `apps.apple.com` or
   `play.google.com`: the route decides the destination server-side, keeps the click inside
   attribution, and gives a desktop visitor a QR page instead of a store link they cannot
   install from.

   Both store badges are shown in the hero. That is a **deliberate departure** from spec §7/§11,
   which calls for a single device-detected CTA — it was asked for explicitly to match the
   reference sites. Do not "fix" it back.
5. **`robots.txt` / `sitemap.xml` are generated, never written by hand.** Sitemap entries come
   from `tenantRoutes()`, the same list that decides a conditional page's 404, so "listed but
   missing" cannot happen.
6. **`sitemap` `lastmod` is stable per deploy.** A `lastmod` that always says "now" trains
   crawlers to ignore it. Never derive it per request.
7. **Text contrast meets WCAG AA.** `packages/landing-kit/src/theme/tokens.test.ts` asserts it.
   The reference site's `#636366` fails on black; that is why the token differs from the spec.
8. **`hreflang` is never claimed for a language the page does not deliver.** An untranslated
   legal document serves the default language with a notice and drops its alternate.
9. **Legal prose lives in whole `.tsx` documents**, never in dictionary fragments. A privacy
   policy has to be readable end to end by the person who signs off on it.

## Gotchas discovered the hard way

These cost real debugging time. Do not rediscover them.

| | |
|---|---|
| **`proxy.ts`, not `middleware.ts`** | Next 16 renamed the convention; the exported function is `proxy`. |
| **Route handlers must be `route.ts`** | `route.tsx` is silently not registered — the route just 404s. |
| **`robots.ts` must sit at `app/` root** | It cannot live under a dynamic segment. It reads the host with `headers()`, which makes it dynamic — that is intended. |
| **OG image is `/og`, a route handler** | The `opengraph-image.tsx` convention derives its URL from the segment path and would emit `…/aurora/en/opengraph-image`, leaking internal segments into a public URL the proxy 404s. |
| **`next.config.ts` cannot import `@landing/kit`** | It is compiled to CommonJS before the bundler runs and cannot resolve the barrel's `.tsx` re-exports. Put such logic in `proxy.ts`. |
| **`typecheck` runs `next typegen` first** | Otherwise `.next/types` is missing and turbo's task ordering makes it flaky. |
| **zod `.partial()` keeps inner `.default()`** | A partial translation would silently blank out untranslated sections. Locale overrides use an explicit all-optional schema (`contentOverrideSchema`), not `.partial()`. |
| **YAML parses `date: 2026-08-20` as a `Date`** | The blog frontmatter parser accepts both `Date` and string. Do not require authors to quote it. |
| **Blog posts must be statically generated** | On a dynamic route, Next streams metadata in a later chunk and a non-JS crawler misses the description. `generateStaticParams` fixes it; Lighthouse SEO catches the regression. |
| **`backdrop-filter` breaks `position: fixed` children** | It establishes a containing block, so the full-screen mobile menu pinned itself to the header bar. The header's blur lives on a sibling layer for this reason — do not move it back onto the header element. |
| **Tailwind needs `@source`** | The kit lives in `node_modules` from the app's point of view, so `app/globals.css` points Tailwind at `packages/landing-kit/src` explicitly. |
| **`app/.well-known/…` dot-folders do work** | No rewrite fallback is needed. `apple-app-site-association` must be served with an explicit `application/json` Content-Type since it has no extension. |
| **This shell drops `cat` intermittently** | Heredocs inside shell functions have silently produced empty files. For multi-file writes, use `python3` and assert the bytes landed. |

## Common tasks

**Add a tenant** — `docs/adding-a-tenant.md`. Config file, asset folder, registry entry, DNS.
Nothing else. New tenants in the shared deploy are **hero-only**: leave `content.features`,
`steps` and `faq` empty. A block earns its place by having something to put in it, and content
growing past a few pages is the signal to graduate (spec §10), which is where the richer layout
lives — see `apps/aurora`.

**Add a language** — `i18n.locales` in the tenant config for the copy, plus a dictionary under
`src/i18n/dictionaries/` for interface strings. A test asserts every dictionary has the same
keys and the same `{placeholders}` as English.

**Add a promo link** — nothing to do. `/go/{source}/{campaign}/{creative}` reads its attribution
out of the path, so a new creator or channel needs no config entry and no deploy. `campaigns` in
the config only overrides what a path already says.

**Graduate an app** — `docs/graduation.md`. Verify parity by diffing `robots.txt` and the
sitemap `<loc>` set against the shared deploy; only `lastmod` may differ.

## Deliberately not built

Do not add these, and do not leave a door open for them:

- No CMS. No programmatic landing page generation.
- The blog is off unless a tenant sets `features.blog`.
- No multiple CTAs.
- No hand-written `robots.txt` / `sitemap.xml`.
- No pixel loading without consent.
- No self-hosting a font whose licence does not clearly allow it — SF Pro is not copied.
- No `WebSite`+`SearchAction` JSON-LD; there is no site search and claiming one is spam.

## Before you finish

```sh
pnpm check && pnpm turbo build && pnpm --filter multi test:e2e
```

For anything touching markup, metadata or tokens, also run Lighthouse — the targets are
Performance and SEO ≥95 and **Accessibility 100**:

```sh
npx lighthouse http://aurora.localhost:3100/ --preset=desktop \
  --chrome-flags="--headless=new" --quiet --output=json --output-path=/tmp/lh.json
```

State plainly what you verified and what you did not. The one acceptance criterion that cannot
be checked from here is the Google Rich Results Test for the JSON-LD; say so rather than
implying it passed.
