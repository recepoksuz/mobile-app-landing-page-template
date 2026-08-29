import type { AppConfig } from "../config/schema";

export type RedirectMatch = { to: string; status: 308 | 307 };

/**
 * Finds the redirect defined in the config that matches the given path.
 *
 * It exists so that moving an old URL (a retired campaign page, a renamed legal
 * page) never requires touching a file outside the config. Matching is exact;
 * pattern support is deliberately absent — the moment you need a pattern, it
 * means this should have been a route.
 */
export function matchRedirect(config: AppConfig, pathname: string): RedirectMatch | undefined {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  for (const rule of config.redirects ?? []) {
    const from = rule.from.length > 1 ? rule.from.replace(/\/+$/, "") : rule.from;
    if (from === normalized) {
      return { to: rule.to, status: rule.permanent ? 308 : 307 };
    }
  }

  return undefined;
}

