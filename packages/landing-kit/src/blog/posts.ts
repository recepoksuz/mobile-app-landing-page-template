import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import type { Locale } from "../i18n/types";

export type PostMeta = {
  slug: string;
  title: string;
  /** ISO date from the frontmatter. */
  date: string;
  excerpt: string;
  locale: Locale;
};

export type Post = PostMeta & {
  /** Rendered HTML body. */
  html: string;
};

/**
 * Posts live as Markdown files in the repo:
 *
 *   content/{tenant}/blog/{locale}/{slug}.md
 *
 * Not a CMS, on purpose (spec §11) — but not a TypeScript array either, because nobody writes
 * 20 pages of prose inside a string literal. Files in git give review, history and a writer who
 * does not have to touch code.
 */
const CONTENT_ROOT = path.join(process.cwd(), "content");

type Frontmatter = { title?: unknown; date?: unknown; excerpt?: unknown };

/**
 * YAML parses an unquoted `date: 2026-08-20` into a `Date`, not a string, and expecting authors
 * to remember quotes is a trap that fails silently at publish time. Both forms are accepted and
 * normalised to `YYYY-MM-DD`.
 */
function isoDate(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return value.slice(0, 10);
  }
  return undefined;
}

function postsDir(tenant: string, locale: Locale): string {
  return path.join(CONTENT_ROOT, tenant, "blog", locale);
}

async function readPostFiles(tenant: string, locale: Locale): Promise<string[]> {
  try {
    const entries = await readdir(postsDir(tenant, locale));
    return entries.filter((name) => name.endsWith(".md"));
  } catch {
    // A tenant with the blog flag off, or a locale with nothing written yet.
    return [];
  }
}

function parse(raw: string, slug: string, locale: Locale): Post | undefined {
  const { data, content } = matter(raw);
  const front = data as Frontmatter;

  const date = isoDate(front.date);

  // A post missing its title or date would sort and render wrong; skipping it is better than
  // publishing a broken entry, and the build log names the file.
  if (typeof front.title !== "string" || !date) {
    console.warn(
      `[blog] skipping ${locale}/${slug}.md — "title" and a valid "date" are required`,
    );
    return undefined;
  }

  const html = marked.parse(content, { async: false });
  const excerpt =
    typeof front.excerpt === "string"
      ? front.excerpt
      : `${content.replace(/[#*_`>\[\]]/g, "").trim().slice(0, 155)}…`;

  return { slug, title: front.title, date, excerpt, html, locale };
}

/** Every post for a tenant and locale, newest first. */
export async function listPosts(tenant: string, locale: Locale): Promise<PostMeta[]> {
  const files = await readPostFiles(tenant, locale);

  const posts = await Promise.all(
    files.map(async (file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = await readFile(path.join(postsDir(tenant, locale), file), "utf8");
      return parse(raw, slug, locale);
    }),
  );

  return posts
    .filter((post): post is Post => post !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(({ html: _html, ...meta }) => meta);
}

export async function getPost(
  tenant: string,
  locale: Locale,
  slug: string,
): Promise<Post | undefined> {
  // The slug comes from the URL; keep it to a single path segment so it cannot escape the
  // content directory.
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return undefined;

  try {
    const raw = await readFile(path.join(postsDir(tenant, locale), `${slug}.md`), "utf8");
    return parse(raw, slug, locale);
  } catch {
    return undefined;
  }
}

/** Locales in which a given post exists — drives its `hreflang` set. */
export async function localesWithPost(
  tenant: string,
  locales: Locale[],
  slug: string,
): Promise<Locale[]> {
  const found = await Promise.all(
    locales.map(async (locale) => ((await getPost(tenant, locale, slug)) ? locale : undefined)),
  );
  return found.filter((locale): locale is Locale => locale !== undefined);
}
