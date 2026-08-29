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
instead. `docs/config-reference.md` is the full field list — check it before adding one, and
update it when you do. It also lists what is deliberately *not* configurable, which is where
most "just add a flag" requests should end. The config is the single source of truth; there is no CMS and there will not be one.

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
pnpm validate                  # tenant configs only — seconds. Run after writing a config
pnpm check                     # validate + typecheck + lint + unit + e2e — before finishing
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
2. **An unknown host serves nothing.** 404, empty sitemap, `Disallow: /`. `fallbackSlug` applies
   only on platform-controlled hosts (`*.vercel.app`, localhost) — a stray custom domain pointed
   at the deploy must never resolve, or it creates duplicate content under a wrong canonical.
   The gate is on the host, not on `NODE_ENV`, so no environment variable can open it.
3. **No third-party script loads before consent.** `Pixels` returns `null` unless consent is
   `"granted"`. Fonts are self-hosted via `next/font` so they are unaffected.

   That includes the conversion event on a store click: `AttributionLink` reports it only when
   consent is `"granted"`, and `e2e/consent.spec.ts` asserts both that it fires and that it
   stays silent otherwise.

   Vercel Web Analytics (`features.analytics`) is the one exemption, and only because there is
   nothing to gate: the script and its beacon come from `/_vercel/insights` on the site's own
   domain, set no cookie and store no identifier. `e2e/consent.spec.ts` asserts both properties,
   so the exemption fails loudly if either stops being true. Anything that sets a cookie or
   leaves the domain belongs in `Pixels`.
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
| **`public/` is not in a serverless function** | The OG route and the blog read from disk at request time. `outputFileTracingIncludes` in `next.config.ts` puts those directories in the bundle. Add any other runtime-read directory there — the failure on Vercel is silent, not a crash. |
| **A `*.vercel.app` URL shows the first tenant** | It is nobody's `domain`, so `fallbackSlug` answers. `NEXT_PUBLIC_DEFAULT_TENANT` picks a different one — safe in any environment, because `resolveTenant` applies a fallback only on platform-controlled hosts, never on a custom domain. |
| **Vitest cannot parse `.tsx` without help** | The repo sets `jsx: "preserve"` for Next. Vite 8 transforms with Oxc, so it is `oxc.jsx`, not `esbuild.jsx`. Already configured; this is why. |
| **`preload` covers every declared font subset** | Declaring `latin-ext` for Turkish preloads a file an English page never renders. Both faces set `preload: false`; `unicode-range` still fetches only what is used, and `swap` keeps text visible. Preloading all four cost 3 mobile Performance points. |
| **`pnpm exec` does not see a package's binaries** | `@playwright/test` lives in apps/multi, and pnpm links workspace binaries per package, not into the root `.bin`. Use `pnpm --filter multi exec playwright ...`. A bare `pnpm exec` fails on CI and, worse, can silently run a different Playwright from a parent directory locally. |
| **`/_vercel/insights` 404s locally** | The analytics endpoint only exists on Vercel, so a local run logs a console error worth four Best Practices points. Atlas carries the analytics demo and Aurora — the Lighthouse target — does not, deliberately. |
| **A config file must import `@landing/kit/config`** | Not the main barrel. The barrel pulls the component library, which is why `next.config.ts` cannot use it and why validating a config used to need a bundler. `./config` is schema, `defineAppConfig` and the registry, nothing else. |
| **This shell drops `cat` intermittently** | Heredocs inside shell functions have silently produced empty files. For multi-file writes, use `python3` and assert the bytes landed. |

## Common tasks

**Add a tenant** — `docs/adding-a-tenant.md`. Four steps, and there is no fifth:

1. `apps/multi/config/{slug}.ts` + the entry in `config/index.ts`
2. `apps/multi/public/apps/{slug}/` — icon, logo, mockup
3. `git push` — Vercel builds on its own; there is no deploy command to run
4. Add the domain in Vercel, once

Then **`pnpm validate`** — seconds, no bundler. Run it before anything slower. Step 1 is two
files, and forgetting the second is the one mistake in this repo that fails completely
silently: the config typechecks, the build succeeds, every test passes, and the tenant's
domain serves a 404. `validate` exists for that, and also catches a slug that does not match
its filename, a missing asset folder, and any schema violation — each as a sentence saying
what to do, not a stack trace.

Read `apps/multi/config/atlas.ts` for the minimum shape and `docs/config-reference.md` for
every field. Copy `atlas.ts` rather than writing from memory; a config omits far more than it
sets, because most fields have defaults.

No new project, no build settings, no environment variable. `NEXT_PUBLIC_DEFAULT_TENANT` is
**not** per tenant — it only decides who the `*.vercel.app` URL shows, and adding an app never
touches it. If a task pushes you to edit anything else, say so rather than doing it quietly. New tenants in the shared deploy are **hero-only**: leave `content.features`,
`steps` and `faq` empty. A block earns its place by having something to put in it, and content
growing past a few pages is the signal to graduate (spec §10), which is where the richer layout
lives — see `apps/aurora`.

**Add a language** — `i18n.locales` in the tenant config for the copy, plus a dictionary under
`src/i18n/dictionaries/` for interface strings. A test asserts every dictionary has the same
keys and the same `{placeholders}` as English.

**Add a promo link** — nothing to do. `/go/{source}/{campaign}/{creative}` reads its attribution
out of the path, so a new creator or channel needs no config entry and no deploy. `campaigns` in
the config only overrides what a path already says.

**Deploy** — `docs/deploy.md`. One Vercel project serves every tenant; set it up once.

**Pull template updates** — `docs/updating-from-the-template.md`. A repo made with "Use this
template" has no shared history with it, so `git pull` does not apply; cherry-pick instead.

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

## Commit messages

Conventional Commits, with the body wrapped at 72 columns:

```
fix(test): run both e2e suites from one Playwright config

Both apps shipped their own Playwright config and both bound port 3100
for the shared deploy. Turbo runs packages in parallel, so the configs
raced for the port.
```

- `type(scope): subject` — imperative, lower case after the colon, no full
  stop, 72 characters at most. Types: `feat`, `fix`, `docs`, `refactor`,
  `test`, `build`, `perf`, `chore`.
- Blank line, then a body wrapped at 72 columns explaining **why**. The diff
  already says what changed; the message is where the reason lives, and it is
  the only place a reader six months from now can find it.
- **Never** add `Co-Authored-By: Claude`, `Generated with Claude Code`, or any
  other AI attribution trailer. The work is published under the author's own
  name.
- Write in English, whatever language the conversation was in.

## Before you finish

```sh
pnpm check && pnpm turbo build && pnpm --filter multi test:e2e
```

For anything touching markup, metadata or tokens, also run Lighthouse — the targets are
Performance and SEO ≥95 and **Accessibility 100**. Current: desktop 100/100/100/100,
mobile 95/100/100/100. Mobile LCP is the consent banner, which is client-rendered by
design; an SSR version was tried and lost more in Best Practices than it gained:

```sh
npx lighthouse http://aurora.localhost:3100/ --preset=desktop \
  --chrome-flags="--headless=new" --quiet --output=json --output-path=/tmp/lh.json
```

State plainly what you verified and what you did not. The one acceptance criterion that cannot
be checked from here is the Google Rich Results Test for the JSON-LD; say so rather than
implying it passed.
