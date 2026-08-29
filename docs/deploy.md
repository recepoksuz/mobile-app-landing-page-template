# Deploying

One Vercel project serves every tenant in `apps/multi`. You set it up once; after that, adding
an app is a config file, an asset folder and a DNS record — no deployment work.

---

## First deploy

### 1. Create the project

```sh
vercel login
cd apps/multi
vercel link
```

Or from the dashboard: **New Project** → import the repo → set **Root Directory** to `apps/multi`.

Vercel detects the pnpm workspace and Turborepo on its own. Leave the build and install commands
on their defaults; `apps/multi/package.json` already runs `next build`, and the shared package is
consumed as source, so there is nothing to build first.

One setting matters: **Include source files outside of the Root Directory** must stay on. The app
imports `@landing/kit` from `packages/`, and without it the install has nothing to link.

### 2. Give the deployment URL a tenant

A tenant is resolved from the request host, and a `*.vercel.app` URL is nobody's `domain` — so
a fresh deploy returns 404 on its own URL. That is the unknown-host rule doing its job, not a
broken build.

`NEXT_PUBLIC_DEFAULT_TENANT` names the tenant to serve when no domain matches:

```sh
vercel env add NEXT_PUBLIC_DEFAULT_TENANT   # e.g. "aurora"
```

It is safe in every environment, Production included. The fallback only ever applies on a host
the platform itself hands out — `*.vercel.app` and local development — because nobody but Vercel
can point one of those at your project. A custom domain aimed at this deployment still resolves
to nothing and 404s, which is what stops a stray domain from serving a tenant's page under a
canonical it does not own.

Without it the deploy is still correct; you just cannot look at it until a domain is attached.

### 3. Deploy

```sh
vercel --prod
```

### 4. Point the domains

For each tenant, add both hosts to the same Vercel project:

- `myapp.ai` — A/ALIAS record
- `www.myapp.ai` — CNAME

The app 308-redirects `www` to the apex itself, so do not configure a redirect in Vercel as well.

---

## Adding an app after that

No deployment step at all:

1. `apps/multi/config/{slug}.ts` + an entry in `config/index.ts`
2. `apps/multi/public/apps/{slug}/` with the icon, logo and mockup
3. Add `myapp.ai` and `www.myapp.ai` to the same Vercel project
4. Push — Vercel builds and the new host resolves

See [adding-a-tenant.md](adding-a-tenant.md) for what goes in the config.

---

## Things that bite on Vercel but not locally

**Files read at runtime are not in the function.** `public/` is served as static assets and is not
part of a serverless function. The OG image route reads an icon off disk to inline it — satori
cannot fetch an external SVG — and the blog reads Markdown. Locally both find the files; on
Vercel they would not.

`next.config.ts` lists those directories under `outputFileTracingIncludes`, because Next's tracer
cannot follow a path whose file name is only known at runtime. If you add another directory that
is read at request time, add it there too. The symptom is quiet: the OG image falls back to its
letter placeholder and nothing errors.

**A deployment 404s on its own `*.vercel.app` URL** until `NEXT_PUBLIC_DEFAULT_TENANT` is set.
See step 2 — this is host resolution working as intended.

**A tenant's `domain` must be the bare host.** No protocol, no trailing slash. The schema rejects
anything else at build time, so a bad value fails the deploy rather than shipping a broken
canonical.

---

## Verifying a deploy

```sh
BASE=https://myapp.ai

curl -sI $BASE/.well-known/apple-app-site-association | grep -i content-type   # application/json
curl -sI $BASE/.well-known/assetlinks.json | grep -i content-type              # application/json
curl -s  $BASE/robots.txt        # its own host, Sitemap line with protocol
curl -s  $BASE/sitemap.xml       # only the routes this tenant actually has
curl -sI $BASE/og                # image/png
curl -sI https://www.myapp.ai/   # 308 to the apex

curl -A "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X)" \
     -s -o /dev/null -w '%{redirect_url}\n' $BASE/go/test
```

The last one should land on the store or your OneLink. If it returns the page instead of a
redirect, the request was read as desktop.
