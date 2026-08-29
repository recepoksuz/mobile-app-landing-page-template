import type { AppConfig } from "../config/schema";
import { getDictionary } from "../i18n/resolve";
import type { Locale } from "../i18n/types";

export type TenantRoute = {
  path: string;
  /** Whether it goes into the sitemap. `/go/*` and aliases do not. */
  indexable: boolean;
  changeFrequency: "yearly" | "monthly" | "weekly";
  priority: number;
};

/**
 * The single list of the routes that actually exist for a tenant.
 * The sitemap, the footer and the 404 decision for conditional routes all read from here — so
 * "in the sitemap but no page", or the reverse, cannot structurally happen.
 */
export function tenantRoutes(config: AppConfig): TenantRoute[] {
  const routes: TenantRoute[] = [
    { path: "/", indexable: true, changeFrequency: "weekly", priority: 1 },
    { path: "/privacy", indexable: true, changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", indexable: true, changeFrequency: "yearly", priority: 0.3 },
    { path: "/support", indexable: true, changeFrequency: "monthly", priority: 0.5 },
  ];

  if (config.legal.hasAccounts) {
    routes.push({
      path: "/delete-account",
      indexable: true,
      changeFrequency: "yearly",
      priority: 0.3,
    });
  }

  if (config.legal.hasSubscriptions) {
    routes.push({
      path: "/refund-policy",
      indexable: true,
      changeFrequency: "yearly",
      priority: 0.3,
    });
  }

  if (config.features.blog) {
    routes.push({ path: "/blog", indexable: true, changeFrequency: "weekly", priority: 0.6 });
  }

  return routes;
}

export function hasRoute(config: AppConfig, path: string): boolean {
  return tenantRoutes(config).some((route) => route.path === path);
}

/**
 * The full set of legal/support links, used in the footer, already prefixed for the locale so
 * a visitor reading Turkish never gets dropped back into the English tree.
 */
export function legalNavLinks(
  config: AppConfig,
  locale: Locale,
  basePath = "",
): Array<{ href: string; label: string }> {
  const dict = getDictionary(locale);

  const links = [
    { href: `${basePath}/privacy`, label: dict.nav.privacy },
    { href: `${basePath}/terms`, label: dict.nav.terms },
    { href: `${basePath}/support`, label: dict.nav.support },
  ];
  if (config.legal.hasSubscriptions) {
    links.push({ href: `${basePath}/refund-policy`, label: dict.nav.refunds });
  }
  if (config.legal.hasAccounts) {
    links.push({ href: `${basePath}/delete-account`, label: dict.nav.deleteAccount });
  }
  if (config.features.blog) {
    links.push({ href: `${basePath}/blog`, label: dict.nav.blog });
  }
  return links;
}

/**
 * The header nav (spec §9: Home / Privacy / Terms / Support).
 *
 * Deliberately shorter than the footer's list. The header is next to the wordmark and shares a
 * line with it; every extra item pushes into the hero and dilutes the one action on the page.
 * Refunds, account deletion and the blog are reachable from the footer, which is where a
 * visitor looks for them.
 */
export function headerNavLinks(
  locale: Locale,
  basePath = "",
): Array<{ href: string; label: string }> {
  const dict = getDictionary(locale);

  return [
    { href: `${basePath}/privacy`, label: dict.nav.privacy },
    { href: `${basePath}/terms`, label: dict.nav.terms },
    { href: `${basePath}/support`, label: dict.nav.support },
  ];
}

/**
 * A tenant with nothing below the hero.
 *
 * The shared deploy's default: no feature cards, no steps, no FAQ, no blog. Such a page gets
 * the reference sites' thin footer — a row of social icons and a copyright line — instead of
 * the full one, because legal columns under a single screen of content weigh more than they
 * carry. The legal links stay in the header either way, so the store requirement is unaffected.
 */
export function isHeroOnly(config: AppConfig): boolean {
  return (
    config.content.features.length === 0 &&
    config.content.steps.length === 0 &&
    config.content.faq.length === 0 &&
    !config.features.blog
  );
}
