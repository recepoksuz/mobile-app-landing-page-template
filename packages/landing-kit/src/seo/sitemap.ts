import type { MetadataRoute } from "next";
import type { AppConfig } from "../config/schema";
import { localePath, localesOf } from "../i18n/resolve";
import type { Locale } from "../i18n/types";
import { tenantRoutes } from "../routes/routes";
import { absoluteUrl } from "./metadata";

/**
 * Evaluated once when the module is first loaded, i.e. at deploy time for a given server
 * instance.
 *
 * Deriving this per request would stamp every page with "changed just now" on every crawl.
 * Google explicitly distrusts a `lastmod` that always says now and starts ignoring it, so a
 * live timestamp is worse than no timestamp. Content here only changes when a config file is
 * deployed, which makes deploy time the honest value.
 */
const DEPLOYED_AT = new Date();

export type SitemapExtra = {
  /** Locale-agnostic path, e.g. "/blog/how-it-works". */
  path: string;
  /** Locales this page exists in. */
  locales: Locale[];
  lastModified?: Date;
};

/**
 * Builds the sitemap from the same route list that decides which pages exist, so a page can
 * never be listed here without being reachable, or reachable without being listed.
 *
 * Every entry carries `alternates.languages` for its own translations — that is the pairing
 * Google wants: each localised URL listed in its own right, cross-referencing the others.
 */
export function buildSitemap(config: AppConfig, extra: SitemapExtra[] = []): MetadataRoute.Sitemap {
  const locales = localesOf(config);

  const entries: MetadataRoute.Sitemap = [];

  for (const route of tenantRoutes(config)) {
    if (!route.indexable) continue;

    for (const locale of locales) {
      entries.push({
        url: absoluteUrl(config, localePath(config, locale, route.path)),
        lastModified: DEPLOYED_AT,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages: languageMap(config, route.path, locales) },
      });
    }
  }

  for (const item of extra) {
    for (const locale of item.locales) {
      entries.push({
        url: absoluteUrl(config, localePath(config, locale, item.path)),
        lastModified: item.lastModified ?? DEPLOYED_AT,
        changeFrequency: "monthly",
        priority: 0.5,
        alternates: { languages: languageMap(config, item.path, item.locales) },
      });
    }
  }

  return entries;
}

function languageMap(
  config: AppConfig,
  path: string,
  locales: Locale[],
): Record<string, string> {
  return Object.fromEntries(
    locales.map((locale) => [locale, absoluteUrl(config, localePath(config, locale, path))]),
  );
}
