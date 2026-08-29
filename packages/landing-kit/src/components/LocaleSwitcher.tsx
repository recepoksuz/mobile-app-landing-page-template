import Link from "next/link";
import type { AppConfig } from "../config/schema";
import { getDictionary, localePath, localesOf } from "../i18n/resolve";
import type { Locale } from "../i18n/types";

/**
 * Language switcher.
 *
 * Required as soon as a tenant has a second language: without it a visitor who lands on `/tr` —
 * or who was sent there by the language redirect — has no way back.
 *
 * Two languages render as a pair of links, because a menu to choose between two things is more
 * work than the choice. Beyond that it collapses into a dropdown, so ten languages take the same
 * space as three and do not wrap the footer onto another line.
 *
 * Either way the options are real `<a>` elements pointing at the same page in the other
 * language: crawlable, `hreflang`-annotated, and working without JavaScript.
 */
export function LocaleSwitcher({
  config,
  locale,
  /** Locale-agnostic path of the current page, e.g. "/privacy". */
  path = "/",
}: {
  config: AppConfig;
  locale: Locale;
  path?: string;
}) {
  const locales = localesOf(config);
  if (locales.length < 2) return null;

  const label = (code: Locale) => getDictionary(code).label;

  if (locales.length <= 2) {
    return (
      <nav aria-label="Language" className="flex items-center gap-1">
        {locales.map((code) => (
          <Link
            key={code}
            href={localePath(config, code, path)}
            hrefLang={code}
            aria-current={code === locale ? "true" : undefined}
            className={`rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
              code === locale ? "text-fg" : "text-muted hover:text-fg"
            }`}
          >
            {label(code)}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <details className="relative [&[open]_.chevron]:rotate-180">
      <summary
        className="flex cursor-pointer select-none list-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted transition-colors hover:text-fg [&::-webkit-details-marker]:hidden"
        aria-label="Language"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
        </svg>
        {label(locale)}
        <svg className="chevron size-3.5 transition-transform" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M5.5 8 10 12.5 14.5 8" strokeLinecap="round" />
        </svg>
      </summary>

      <nav
        aria-label="Language"
        className="absolute bottom-full right-0 z-30 mb-2 max-h-72 min-w-40 overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-xl"
      >
        {locales.map((code) => (
          <Link
            key={code}
            href={localePath(config, code, path)}
            hrefLang={code}
            aria-current={code === locale ? "true" : undefined}
            className={`block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-border ${
              code === locale ? "text-fg" : "text-muted hover:text-fg"
            }`}
          >
            {label(code)}
          </Link>
        ))}
      </nav>
    </details>
  );
}
