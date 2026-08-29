import type { AppConfig } from "../config/schema";
import { en } from "./dictionaries/en";
import { tr } from "./dictionaries/tr";
import type { Dictionary, Locale } from "./types";

/**
 * Dictionaries shipped with the kit. A tenant that needs a language not listed here adds it
 * the same way these were added: one file under `i18n/dictionaries/`.
 */
export const dictionaries: Record<Locale, Dictionary> = { en, tr };

export const DEFAULT_LOCALE: Locale = "en";

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

/** Every locale this tenant serves, default first. */
export function localesOf(config: AppConfig): Locale[] {
  return [config.i18n.defaultLocale, ...Object.keys(config.i18n.locales)];
}

export function isSupportedLocale(config: AppConfig, locale: string): boolean {
  return localesOf(config).includes(locale);
}

/**
 * The path a visitor sees, given a locale.
 *
 * The default locale is unprefixed. That is what keeps every URL already handed to the App
 * Store, printed on a flyer or linked from an ad valid when a second language is added later —
 * adding a language must never invalidate an existing link.
 */
export function localePath(config: AppConfig, locale: Locale, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === config.i18n.defaultLocale) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/**
 * Splits a public path into its locale and the path within that locale.
 * `/tr/privacy` -> `{ locale: "tr", path: "/privacy" }`
 * `/privacy`    -> `{ locale: <default>, path: "/privacy" }`
 */
export function splitLocale(
  config: AppConfig,
  pathname: string,
): { locale: Locale; path: string; redundantPrefix: boolean } {
  const [, first = "", ...rest] = pathname.split("/");
  const withoutPrefix = `/${rest.join("/")}`.replace(/\/$/, "") || "/";

  // `/en/privacy` is the default locale spelled out. It resolves, but it is a second URL for a
  // page that already lives at `/privacy`, so the caller redirects rather than serving both.
  if (first === config.i18n.defaultLocale) {
    return { locale: config.i18n.defaultLocale, path: withoutPrefix, redundantPrefix: true };
  }

  if (first && isSupportedLocale(config, first)) {
    return { locale: first, path: withoutPrefix, redundantPrefix: false };
  }

  return { locale: config.i18n.defaultLocale, path: pathname, redundantPrefix: false };
}

/**
 * Fills `{placeholder}` slots. Deliberately not a full ICU implementation — these strings are
 * short interface labels, and a heavier formatter would be weight without a use.
 */
export function t(template: string, values: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** Marketing copy for a locale, falling back to the tenant's default-locale copy. */
export function localizedContent(config: AppConfig, locale: Locale) {
  const override = config.i18n.locales[locale];

  return {
    tagline: override?.tagline ?? config.tagline,
    description: override?.description ?? config.description,
    content: {
      features: override?.content?.features ?? config.content.features,
      steps: override?.content?.steps ?? config.content.steps,
      faq: override?.content?.faq ?? config.content.faq,
    },
  };
}
