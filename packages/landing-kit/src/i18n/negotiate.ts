import type { AppConfig } from "../config/schema";
import { localesOf } from "./resolve";
import type { Locale } from "./types";

/** Cookie holding the visitor's language, once they have one. */
export const LOCALE_COOKIE = "landing-locale";

/**
 * Crawlers must never be redirected by language.
 *
 * Googlebot crawls from the US with an English `Accept-Language` (or none at all). Redirecting
 * on that header would show it one language and hide the others, so the translations would
 * never get indexed — which is the opposite of what `hreflang` is for. `hreflang` is the
 * supported way to tell a search engine about translations; a redirect on top of it competes
 * with it.
 */
const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|whatsapp|telegram|discord|lighthouse|headlesschrome/i;

export function isCrawler(userAgent: string | null | undefined): boolean {
  return BOT.test(userAgent ?? "");
}

/**
 * Best supported locale for an `Accept-Language` header, honouring q-values and matching
 * `tr-TR` against a supported `tr`. Returns undefined when nothing matches.
 */
export function negotiateLocale(
  config: AppConfig,
  acceptLanguage: string | null | undefined,
): Locale | undefined {
  if (!acceptLanguage) return undefined;

  const supported = localesOf(config);

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.split("=")[1]) || 0 : 1 };
    })
    .filter((entry) => entry.tag && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    if (tag === "*") return undefined;

    const exact = supported.find((locale) => locale.toLowerCase() === tag);
    if (exact) return exact;

    // `tr-TR` should match a supported `tr`.
    const base = tag.split("-")[0];
    const loose = supported.find((locale) => locale.toLowerCase().split("-")[0] === base);
    if (loose) return loose;
  }

  return undefined;
}

/**
 * Whether this request should be sent to a different language, and which.
 *
 * Deliberately narrow:
 *   - only the site root, never a deep link — a shared `/blog/x` must open where it points
 *   - never when the visitor already has a language cookie, so a choice sticks
 *   - never for crawlers
 *   - off unless the tenant opts in
 */
export function localeRedirectFor({
  config,
  pathname,
  acceptLanguage,
  userAgent,
  cookieLocale,
}: {
  config: AppConfig;
  pathname: string;
  acceptLanguage: string | null | undefined;
  userAgent: string | null | undefined;
  cookieLocale: string | null | undefined;
}): Locale | undefined {
  if (!config.i18n.autoRedirect) return undefined;
  if (pathname !== "/") return undefined;
  if (cookieLocale) return undefined;
  if (isCrawler(userAgent)) return undefined;

  const preferred = negotiateLocale(config, acceptLanguage);
  if (!preferred || preferred === config.i18n.defaultLocale) return undefined;

  return preferred;
}
