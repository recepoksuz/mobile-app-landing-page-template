import type { AppConfig } from "../config/schema";
import { getDictionary, t } from "../i18n/resolve";
import type { Locale } from "../i18n/types";
import type { Platform } from "../platform/detect";

/**
 * Shown when a visitor follows a promo link on a platform the app does not ship on yet.
 *
 * The alternative — bouncing them to the home page — is worse than it looks: the home page's
 * only CTA points back at `/go`, so the visitor loops. Saying plainly where the app *is*
 * available ends the journey honestly and keeps the campaign click accountable.
 */
export function StoreUnavailable({
  config,
  platform,
  locale,
}: {
  config: AppConfig;
  platform: Platform;
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const platformName = dict.unavailable[platform];

  const available: string[] = [];
  if (config.store.ios) available.push(dict.unavailable.iosFamily);
  if (config.store.android) available.push(dict.unavailable.androidFamily);

  return (
    <main className="site-container flex flex-1 flex-col items-center justify-center gap-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
        {t(dict.unavailable.heading, { name: config.name, platform: platformName })}
      </h1>

      <p className="max-w-md text-muted text-pretty">
        {available.length > 0
          ? t(dict.unavailable.body, {
              platforms: new Intl.ListFormat(locale, { type: "conjunction" }).format(available),
            })
          : dict.unavailable.bodyNone}
      </p>

      <a
        href={`mailto:${config.legal.supportEmail}?subject=${encodeURIComponent(`${config.name} on ${platformName}`)}`}
        className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-fg"
      >
        {t(dict.unavailable.tellUs, { platform: platformName })}
      </a>
    </main>
  );
}
