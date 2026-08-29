# Launching a new app

Target: **under an hour, writing zero code.** You touch three things — one config file, one
asset folder, one DNS record. You touch nothing else.


---

## The whole loop

```
1.  apps/multi/config/{slug}.ts     write the config, add it to config/index.ts
2.  apps/multi/public/apps/{slug}/  drop in icon, logo, mockup
3.  git push                        Vercel builds on its own
4.  Vercel -> Domains               add myapp.com and www.myapp.com, once
```

That is the entire list. **There is no fifth step.**

- **No new Vercel project.** One project serves every tenant. You do not pick a root
  directory, a framework or a build command again.
- **No deploy button.** The push is the deploy. You never run `vercel --prod`.
- **No environment variable.** `NEXT_PUBLIC_DEFAULT_TENANT` is *not* per app — it does one
  thing, which is decide who the `*.vercel.app` URL shows when no domain matches. Adding an
  app never touches it.
- **No code.** If a tenant needs a file outside `apps/multi/config/*.ts` and its asset folder,
  that feature was designed wrong — fix the design, not the tenant.

The one thing that is manual, once per domain: adding it in Vercel. The host must match the
config's `domain` exactly, or the deployment 404s — deliberately, so a stray domain pointed at
this deployment cannot serve someone's content.

---

The rest of this page is the detail behind steps 1 and 2.

---

## 1. Drop in the assets

```
apps/multi/public/apps/{slug}/
├── icon.svg      # square, min 512px (SVG or PNG)
├── logo.svg      # horizontal logo
├── mockup.svg    # hero phone image
└── feature-*.svg # optional, for the feature cards
```

**The mockup must be identical to the screenshots on the store.** When the visitor lands on
the store they should see the same thing; consistency feeds conversion.

The folder name must match `slug` in the config: `assetDataUri()`, which builds the OG image,
only reads from under `public/apps/`.

**Drop in the real screenshot as-is.** Dimensions are read from the file header, so a 1290×2796
export from an iPhone 15 Pro Max and a 1080×1920 Android capture both keep their aspect ratio
with no config entry — and no chance of a mistyped number distorting the hero. PNG, JPEG, WebP,
GIF and SVG are all measured; anything unreadable falls back to a phone ratio rather than
failing the render.

## 2. Write the config file

`apps/multi/config/{slug}.ts`:

```ts
import { defineAppConfig } from "@landing/kit";

export const myapp = defineAppConfig({
  slug: "myapp",
  domain: "myapp.ai",              // no protocol, no port, no slash
  name: "My App",
  tagline: "...",                  // the h1, carries the keyword
  description: "...",              // 70-160 characters, meta description
  theme: { accent: "#ff0055", mode: "dark" },
  assets: {
    icon: "/apps/myapp/icon.svg",
    logo: "/apps/myapp/logo.svg",
    mockup: "/apps/myapp/mockup.svg",
  },
  store: { /* ios and/or android */ },
  attribution: { /* oneLink, pixel ids */ },
  content: { features: [], steps: [], faq: [] },
  legal: {
    companyName: "...",
    companyAddress: "...",
    supportEmail: "support@myapp.ai",
    governingLaw: "England and Wales",
    hasAccounts: true,             // true generates /delete-account (required by Play)
    hasSubscriptions: true,        // true generates the EULA sections + /refund-policy
  },
});
```

`defineAppConfig` validates the config as the module loads. If a field is missing or wrong,
`next build` fails — a broken config cannot ship silently.

**Things to watch:**

| Field | Rule |
|---|---|
| `domain` | No protocol, port, or trailing slash. `myapp.ai` ✅ / `https://myapp.ai/` ❌ |
| `store.android.sha256Fingerprints` | Without it `assetlinks.json` is not generated and Android App Links cannot be verified. |
| `store.rating` + `reviewCount` | Leave both out and they are looked up from the App Store at build time. Pin both to override; one without the other is rejected, because Google treats a half `aggregateRating` as an error. |
| `store.ios.country` | The storefront the rating is read from. Defaults to `us`, which is the wrong number to publish for an app whose audience is elsewhere. |
| `store.ios.teamId` + `bundleId` | Only used to generate `apple-app-site-association`. Omit both if you do not want Universal Links; the file is then not served at all. |
| `description` | 70–160 characters. Google truncates around 155. |

## 2b. Add a language (optional)

English is the default and stays unprefixed. Additional languages are prefixed, so adding one
never invalidates a URL already filed with the App Store or printed on a flyer.

```ts
i18n: {
  defaultLocale: "en",
  locales: {
    tr: {
      tagline: "Dövmeni iğne değmeden önce gör",
      description: "…",
      content: { features: [...], steps: [...], faq: [...] },
    },
  },
},
```

| | |
|---|---|
| `myapp.ai/privacy` | English (default, unprefixed) |
| `myapp.ai/tr/privacy` | Turkish |
| `myapp.ai/en/privacy` | 308 → `/privacy`, so one page never has two URLs |

**Every field falls back on its own.** Translate only the tagline and the FAQ and the rest
stays in the default language — a partial translation is usable, not broken.

**Interface text** (section headings, button labels, the consent banner) comes from
`packages/landing-kit/src/i18n/dictionaries/`. `en` and `tr` ship with the kit; a new language
is one file there plus an entry in `dictionaries`. A test asserts every dictionary carries the
same keys and the same `{placeholders}` as English, so a half-finished translation fails the
build rather than rendering `undefined` in production.

**Legal documents** are a separate matter. They live as whole `.tsx` documents under
`packages/landing-kit/src/legal/{locale}/` — not as dictionary fragments, because a privacy
policy assembled from interpolated strings cannot be read end to end by the person who signs
off on it. If a locale has no translation, the page serves the default-language document, shows
a notice saying so, and does **not** claim an `hreflang` for that language. Store review accepts
English legal text, so a missing translation never blocks a language launch.

## 2c. Turn on the blog (optional)

Off by default (spec §11). Setting `features.blog = true` opens `/blog` and `/blog/{slug}`;
routing, sitemap and `hreflang` are already wired.

Posts are Markdown files in the repo — not a CMS, but not a TypeScript array either:

```
content/{slug}/blog/{locale}/my-post.md
```

```md
---
title: Choosing your first aurora
date: 2026-08-20
excerpt: One or two sentences for the listing and the meta description.
---

## A heading

Body text in Markdown.
```

`title` and `date` are required; `excerpt` is derived from the opening lines when omitted. A
post that exists in one language only is listed once and advertises only that language. Posts
are statically generated, so their metadata is in the initial HTML rather than a streamed chunk.

## 3. Add it to the registry

`apps/multi/config/index.ts`:

```ts
import { myapp } from "./myapp";

export const tenants: readonly AppConfig[] = [aurora, atlas, myapp];
```

## 4. Verify locally

```sh
pnpm --filter multi dev
open http://myapp.localhost:3100/
```

`{slug}.localhost` is mapped automatically by the registry; no extra setup needed.

Checklist:

```sh
curl -sI http://myapp.localhost:3100/.well-known/apple-app-site-association | grep -i content-type
curl -sI http://myapp.localhost:3100/.well-known/assetlinks.json | grep -i content-type
curl -s  http://myapp.localhost:3100/robots.txt          # its own host, Sitemap line with protocol
curl -s  http://myapp.localhost:3100/sitemap.xml         # only the routes that actually exist
curl -sI http://myapp.localhost:3100/og                  # image/png
curl -A "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X)" \
     -s -o /dev/null -w '%{redirect_url}\n' http://myapp.localhost:3100/go/test
```

## 5. DNS

Point the domain at the Vercel deploy (A/ALIAS for the apex, CNAME for `www`). Add both
`myapp.ai` and `www.myapp.ai` to the Vercel project — the registry recognises both.

One deploy serves every tenant; the domain is the only thing that separates them. A host the
registry does not know returns 404 — nothing is served under a domain you did not register, so
a stray domain pointed at the deploy cannot create duplicate content under a wrong canonical.

Because of that, a Vercel **preview** URL (`*.vercel.app`) matches no tenant and would 404 too.
Set `NEXT_PUBLIC_DEFAULT_TENANT` to a slug in the preview environment so preview deployments
render something:

```sh
vercel env add NEXT_PUBLIC_DEFAULT_TENANT preview   # e.g. "myapp"
```

Never set it in the production environment — that would turn any unknown host back into a
silent alias of that tenant.

## 6. What goes into the store forms

| Field | Value |
|---|---|
| Marketing URL | `https://myapp.ai` |
| Support URL | `https://myapp.ai/support` |
| Privacy Policy URL | `https://myapp.ai/privacy` |
| EULA (if there are subscriptions) | `https://myapp.ai/terms` |
| Account deletion URL (Play) | `https://myapp.ai/delete-account` |

`/contact` also redirects to `/support`, so it does not matter which one you enter.

---

## What ad creatives point at

Point creatives at `https://myapp.ai/go/{campaign}`, **not** directly at the store. That way a
store change or an A/B test is a single route update instead of a creative refresh.

```
https://myapp.ai/go/summer_sale?utm_source=meta&utm_campaign=summer&utm_medium=stories
```

On iOS/Android the route redirects to OneLink with attribution intact. On desktop it does not
redirect at all — it renders a page with a QR code. If the app does not ship on the visitor's
platform, they get a page saying where it *is* available rather than being bounced to the home
page, whose only CTA would send them straight back here.

### Short links

`redirects` in the config gives the route a memorable alias, which is what you want on a flyer
or in a podcast read:

```ts
redirects: [
  { from: "/download", to: "/go/download", permanent: false },
  { from: "/get", to: "/go/download", permanent: false },
],
```

### Per-creator and promo links

`/go/...` reads its own attribution out of the path, so **a new link needs no config entry and
no deploy** — it is a URL someone types:

```
/go/{source}/{campaign}/{creative}
```

| Link | Reaches OneLink as |
|---|---|
| `myapp.ai/go/alice` | `pid=web&c=alice` |
| `myapp.ai/go/influencer/alice` | `pid=influencer&c=alice` |
| `myapp.ai/go/influencer/alice/reel1` | `pid=influencer&c=alice&af_ad=reel1` |
| `myapp.ai/go/podcast/joerogan` | `pid=podcast&c=joerogan` |
| `myapp.ai/go/offline/berlin/flyer` | `pid=offline&c=berlin&af_ad=flyer` |
| `myapp.ai/go/influencer/alice?utm_source=meta` | `pid=meta&c=alice` — the query string wins |

Hand a creator `myapp.ai/go/influencer/alice`, put `myapp.ai/go/offline/berlin/flyer` on a
flyer, and both show up split by media source in the attribution dashboard. Nothing was
deployed for either.

The source lives in the path rather than a query string because that is what survives: link
shorteners, Instagram bio fields and someone retyping a URL off a slide all drop query
parameters, and a path segment survives all three. Query parameters still win when they do
arrive, because a real ad click carries the more specific signal.

### Registering a link (rarely needed)

`campaigns` in the config exists only to override what a path already says — renaming a
campaign, or keeping a creative code out of a URL people will read aloud:

```ts
campaigns: {
  "podcast/inkfluencer": { campaign: "podcast_ep_42", ad: "midroll" },
},
```

An entry that overrides nothing is rejected at build time, because that link did not need one.
