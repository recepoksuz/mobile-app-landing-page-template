import type { MetadataRoute } from "next";
import { buildSitemap, localesOf, type SitemapExtra } from "@landing/kit";
import { listPosts } from "@landing/kit/blog";
import { getTenant } from "@/lib/tenant";

/**
 * Mirrors `apps/multi`'s sitemap exactly — only the tenant resolution is gone. Graduation must
 * not change a single URL, and that includes the ones a crawler discovers here.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const config = getTenant();
  const extra: SitemapExtra[] = [];

  if (config.features.blog) {
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
