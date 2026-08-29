# Pulling template updates into your repo

"Use this template" gives you a repo with **no shared history** — a fresh initial commit, not a
fork. That is what you want day to day (your history is yours, and you are never asked to rebase
onto someone else's), but it means `git pull template main` has nothing to merge onto and would
try to graft two unrelated trees together.

Cherry-pick instead. It works on content, not ancestry, so unrelated histories are not a problem.

## Once, per clone

```sh
git remote add template https://github.com/recepoksuz/mobile-app-landing-page-template.git
```

## Every time you want the latest fixes

```sh
git fetch template main

# What has landed upstream since you last looked
git log --oneline template/main -20

# Take the ones you want, oldest first
git cherry-pick <sha> <sha> ...

pnpm check          # never skip: your tenants are not the template's
git push
```

Take fixes, leave decisions. A commit that fixes a bug in `packages/landing-kit` or the CI is
almost always worth taking. A commit that changes the demo tenants is usually not — you deleted
those.

## When a cherry-pick conflicts

Nearly always in `README.md`, `AGENTS.md` or `docs/`, because you edited them for your own apps
and upstream edited them too. Config files and `packages/landing-kit` rarely conflict, since you
add tenants rather than change shared code.

Resolve it, `git add` the file, then `git cherry-pick --continue`. If the file is one you never
customised, taking the upstream version wholesale is usually right:

```sh
git checkout <sha> -- AGENTS.md
git add AGENTS.md
git cherry-pick --continue
```

## Checking whether you are behind

Comparing histories does not work — they are unrelated, so every upstream commit looks new even
after you have cherry-picked it. Compare the *files* instead, restricted to the paths you never
customise:

```sh
git fetch template main
git diff --stat --diff-filter=M main template/main -- packages/landing-kit .github
```

`--diff-filter=M` is what makes this readable: it drops files that exist on only one side, so
your own tenants, assets and legal documents do not show up as differences. What is left is
shared code that has actually diverged.

An empty result means you have every shared fix. A non-empty one is either a fix you have not
taken yet or a change you made on purpose — `git diff main template/main -- <path>` on the file
tells you which within a few lines.
