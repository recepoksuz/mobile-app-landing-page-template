import type { Metadata } from "next";
import type { AppConfig } from "../config/schema";
import { getDictionary, localePath, localesOf, localizedContent } from "../i18n/resolve";
import type { Locale } from "../i18n/types";

export function origin(config: AppConfig): string {
  return `https://${config.domain}`;
}

export function absoluteUrl(config: AppConfig, path = "/"): string {
  return new URL(path, origin(config)).toString();
}

/** `https://x.com/acme` -> `@acme`. Returns undefined when no profile is configured. */
function twitterHandle(config: AppConfig): string | undefined {
  const profile = config.social?.twitter;
  if (!profile) return undefined;

  const handle = new URL(profile).pathname.split("/").filter(Boolean)[0];
  return handle ? `@${handle}` : undefined;
}

type BuildMetadataOptions = {
  /** Path that goes into the canonical URL, without a locale prefix. Defaults to "/" */
  path?: string;
  /** The locale being rendered. Defaults to the tenant's default locale. */
  locale?: Locale;
  /**
   * Locales this particular page genuinely exists in. Defaults to all of the tenant's locales.
   * A legal document with no translation passes a shorter list, so `hreflang` never promises a
   * language the page does not actually deliver.
   */
  availableLocales?: Locale[];
  /** Page title — when omitted, config.name + tagline is used. */
  title?: string;
  description?: string;
  /** For pages that should stay out of search results, such as the legal pages. */
  noIndex?: boolean;
};

/**
 * The single source of metadata. Every tenant gets its own host as the canonical; thanks to
 * `metadataBase`, relative URLs such as the OG image also resolve against the right host.
 */
export function buildMetadata(config: AppConfig, options: BuildMetadataOptions = {}): Metadata {
  const { path = "/", noIndex = false } = options;
  const locale = options.locale ?? config.i18n.defaultLocale;
  const localized = localizedContent(config, locale);
  const dict = getDictionary(locale);

  const title = options.title ?? `${config.name} — ${localized.tagline}`;
  const description = options.description ?? localized.description;
  const canonical = absoluteUrl(config, localePath(config, locale, path));

  const available = options.availableLocales ?? localesOf(config);
  const languages = Object.fromEntries(
    available.map((code) => [code, absoluteUrl(config, localePath(config, code, path))]),
  );
  // When no fixed image is provided, the `/og` route generates one at runtime.
  const ogImage = absoluteUrl(config, config.assets.ogImage ?? "/og");
  const handle = twitterHandle(config);

  return {
    metadataBase: new URL(origin(config)),
    title,
    description,
    applicationName: config.name,
    alternates: {
      canonical,
      // `x-default` points at the default locale, which is the version served to a visitor
      // whose language matches none of ours.
      languages: {
        ...languages,
        "x-default": absoluteUrl(config, localePath(config, config.i18n.defaultLocale, path)),
      },
    },
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
    icons: { icon: config.assets.icon, apple: config.assets.icon },
    // Safari on iOS turns this into a native Smart App Banner above the page: a one-tap
    // "Open"/"View" into the App Store that costs a single meta tag. `app-argument` carries
    // the current URL so an installed app can deep-link straight to it.
    ...(config.store.ios
      ? { itunes: { appId: config.store.ios.appId, appArgument: canonical } }
      : {}),
    openGraph: {
      type: "website",
      siteName: config.name,
      title,
      description,
      url: canonical,
      locale: dict.ogLocale,
      alternateLocale: available
        .filter((code) => code !== locale)
        .map((code) => getDictionary(code).ogLocale),
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      // Attributes the card to the account, which is what makes it show the profile name
      // rather than a bare domain.
      ...(handle ? { site: handle, creator: handle } : {}),
    },
  };
}
