# Pulling template updates into your repo

Your repo came from "Use this template", which means it has **no shared history** with this one
— a fresh initial commit, not a fork. Good day to day: your history is yours. But it means
`git pull` has nothing to merge onto, so updates come across a different way.

Set this up once, then pick whichever of the two options below fits.

## Setup (once per clone)

```sh
git remote add template https://github.com/recepoksuz/mobile-app-landing-page-template.git
```

---

## Option 1 — take specific files

**Start here.** Most updates are a fix to a file you never touched, and for those you do not
need commits, conflict resolution, or anything else:

```sh
git fetch template main
git checkout template/main -- .github/workflows/ci.yml
pnpm check
git commit -am "chore: take the CI fix from the template"
```

Swap in whatever path you need. Safe targets are anything you have not customised:

| Path | What it is |
|---|---|
| `packages/landing-kit/` | All the shared code — components, SEO, i18n, legal, routing |
| `.github/workflows/` | CI |
| `docs/` | The runbooks |

**Do not do this to** `apps/multi/config/`, `apps/multi/public/apps/` or `apps/multi/content/`.
Those are your apps; upstream's version is the demo tenants, and taking it would overwrite them.

## Option 2 — take whole commits

Worth it when you want several related changes and their commit messages, which are where the
reasoning lives.

```sh
git fetch template main

# What has landed upstream
git log --oneline template/main -20

# Take what you want, oldest first
git cherry-pick <sha> <sha>

pnpm check
git push
```

Cherry-pick copies content rather than ancestry, so the unrelated histories are not a problem.

Take fixes, leave decisions. A fix to `packages/landing-kit` or CI is nearly always worth
having. A commit that changes the demo tenants is not — you deleted those.

---

## Am I behind?

Comparing histories does not work here: they are unrelated, so every upstream commit looks new
even after you have taken it. Compare the *files* instead, limited to what you never customise:

```sh
git fetch template main
git diff --stat --diff-filter=M main template/main -- packages/landing-kit .github
```

`--diff-filter=M` is what makes this readable — it ignores files that exist on only one side, so
your own tenants, assets and documents do not show up.

- **Empty** — you have every shared fix.
- **Not empty** — either a fix you have not taken, or something you changed on purpose.
  `git diff main template/main -- <path>` on the file tells you which in a few lines.

## If a cherry-pick conflicts

Almost always `README.md`, `AGENTS.md` or `docs/`, because you edited them for your own apps and
upstream edited them too. Shared code rarely conflicts, since you add tenants rather than change
it.

If it is a file you never customised, take upstream's whole:

```sh
git checkout <sha> -- AGENTS.md
git add AGENTS.md
git cherry-pick --continue
```

Otherwise edit the file, `git add` it, then `git cherry-pick --continue`. To back out entirely,
`git cherry-pick --abort` returns you to where you started.

---

## Always run `pnpm check`

Whichever option you used. Upstream's tests run against the demo tenants; yours run against your
apps, and a change that is fine there can still surface something here — a config field a fix now
requires, a route your tenant enables and the demos do not.
