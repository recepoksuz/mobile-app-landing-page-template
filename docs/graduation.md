# Graduation — moving an app to its own deploy

The domain *is* the abstraction boundary. A search engine sees the `myapp.ai` domain; it has
no idea whether a shared deploy or a dedicated one sits behind it. That is why graduation is
**just a DNS change** — no redirects, no URL changes, no lost link equity. The architecture is
not a one-way door.

`apps/aurora` is the working proof, and `apps/aurora/e2e/parity.spec.ts` holds it to that
automatically: same host, byte-identical `robots.txt`, identical deep-link files, identical
canonical and identity markup, and **no URL lost** — every address the shared deploy publishes
still resolves after graduation.

Note what is not promised: byte-identical output. A graduated app is free to grow — this one has
a blog the shared tenant does not — because outgrowing the shared deploy is the reason to
graduate in the first place. What must never happen is a URL disappearing.

---

## When to split it out

The decision is not left to feel. Split when **any one** of these becomes true:

- [ ] Content SEO needs 20+ pages or a CMS
- [ ] A product surface is needed on the same domain (not a subdomain)
- [ ] A separate team or release cadence owns it
- [ ] Build time is slowing down the other tenants
- [ ] A different framework or runtime is required

If none of these hold, it stays in `apps/multi`. **Most apps will never graduate.**

### Try this first: SEO without graduating

Graduation is unnecessary in most cases. Setting `features.blog = true` in the config opens
the blog routes inside `apps/multi`; the sitemap is already generated per host, so there is no
extra work. 20-30 content pages fit comfortably in the shared setup.

### The web product never comes here

Product surfaces like auth, dashboards, and checkout **never live in the landing repo** — and
should not live there in a single-app architecture either. They belong on the `app.{domain}`
subdomain: separate repo, separate deploy, separate release cadence. The apex domain stays a
marketing page.

---

## Steps (~30 minutes)

### 1. Create the new app

Copy `apps/aurora` as the template:

```sh
cp -R apps/aurora apps/{slug}
rm -rf apps/{slug}/.next apps/{slug}/node_modules
```

Change `name` and the dev/start port in `apps/{slug}/package.json`.

### 2. Move the config, assets and content

```sh
git mv apps/multi/config/{slug}.ts apps/{slug}/config.ts
git mv apps/multi/public/apps/{slug} apps/{slug}/public/apps/{slug}
git mv apps/multi/content/{slug} apps/{slug}/content/{slug}   # only if the blog is on
```

Rename the export in `config.ts` to `config`:

```ts
export const config = defineAppConfig({ ... });
```

Asset paths (`/apps/{slug}/icon.svg`) **do not change** — the folder layout is preserved, so
not a single line of the config needs fixing.

### 3. Verify on preview

```sh
pnpm install
pnpm --filter {slug} build
pnpm --filter {slug} start
```

Confirm it produces output identical to the shared setup:

```sh
curl -s  http://localhost:{port}/robots.txt
curl -s  http://localhost:{port}/sitemap.xml | grep -o '<loc>[^<]*</loc>'
curl -sI http://localhost:{port}/.well-known/apple-app-site-association | grep -i content-type
curl -sI http://localhost:{port}/og | grep -i content-type
```

Then repeat the same checks against the Vercel preview URL.

### 4. Remove it from the registry

`apps/multi/config/index.ts`:

```diff
-import { myapp } from "./myapp";
-export const tenants = [aurora, atlas, myapp];
+export const tenants = [aurora, atlas];
```

Deploy `apps/multi`. At this point both deploys are up but DNS still points at the old one —
rolling back is still possible.

### 5. Flip DNS

Point the domain at the new deploy. Because the domain does not change, it leaves **zero
trace** for search engines and users.

---

## After graduation

`landing-kit` updates keep reaching graduated apps — the package is linked through the
workspace, so there is no copy-paste fork. A shared SEO or legal fix reaches every tenant in
`apps/multi` and every graduated app at the same time.

The only thing that changes in a graduated app is the architecture:

| | `apps/multi` | Graduated app |
|---|---|---|
| Tenant resolution | `proxy.ts`, host → slug rewrite | None, a single config |
| Route tree | `app/[tenant]/[locale]/...` | `app/[locale]/...` |
| `robots.ts` | Dynamic via `headers()` | Static |
| Locale handling | `proxy.ts` fills the default locale | `proxy.ts`, same mechanism |
| Page content, i18n, blog | `@landing/kit` | `@landing/kit` (identical) |

Both trees carry a `[locale]` segment even for a single-language app: the default locale is a
real segment internally and invisible in public URLs. Keeping the two on one mechanism is what
makes the URLs match byte for byte across graduation.

### Verifying parity

```sh
pnpm --filter multi test:e2e
```

That starts both deploys and asserts the guarantees above. It replaces the manual `curl` diff
this section used to describe — a recipe nobody runs is not verification.
