import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { buildSitemap, localesOf, resolveTenant, type SitemapExtra } from "@landing/kit";
import { listPosts } from "@landing/kit/blog";
import { fallbackSlug, registry } from "@/config";

/**
 * The sitemap lists only the routes that actually exist for this tenant — `buildSitemap` reads
 * the same route list that decides the 404 for conditional pages, so "listed but missing"
 * cannot happen (acceptance criteria 2 and 3). Every entry carries its own `hreflang`
 * alternates.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get("host");
  const config = resolveTenant(registry, host, fallbackSlug);

  if (!config) return [];

  const extra: SitemapExtra[] = [];

  if (config.features.blog) {
    // Posts are per-locale files, so a post that only exists in one language is listed once
    // and advertises only that language.
    const byLocale = await Promise.all(
      localesOf(config).map(async (locale) => ({
        locale,
        posts: await listPosts(config.slug, locale),
      })),
    );

    const locales = new Map<string, string[]>();
    for (const { locale, posts } of byLocale) {
      for (const post of posts) {
        locales.set(post.slug, [...(locales.get(post.slug) ?? []), locale]);
      }
    }

    for (const [slug, postLocales] of locales) {
      extra.push({ path: `/blog/${slug}`, locales: postLocales });
    }
  }

  return buildSitemap(config, extra);
}
