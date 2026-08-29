"use client";

import Link from "next/link";
import type { AppConfig } from "../config/schema";
import { getDictionary } from "../i18n/resolve";
import type { Locale } from "../i18n/types";
import { useConsent } from "./ConsentProvider";
import { hasTrackingPixels } from "./Pixels";

/**
 * A simple CMP banner. No third-party script is mounted until a decision has been made
 * (spec §6.2). Declining must cost the same single click as accepting.
 */
export function ConsentBanner({
  attribution,
  locale,
  basePath = "",
}: {
  attribution: AppConfig["attribution"];
  locale: Locale;
  basePath?: string;
}) {
  const dict = getDictionary(locale);
  const { consent, hydrated, grant, deny } = useConsent();

  // Nothing third-party is configured, so nothing needs consenting to.
  if (!hasTrackingPixels(attribution)) return null;
  if (!hydrated || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur"
    >
      <div className="site-container flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-4">
        <p className="max-w-2xl text-[0.8125rem] leading-snug text-muted sm:text-sm">
          <span id="consent-title" className="font-medium text-fg">
            {dict.consent.title}
          </span>{" "}
          {dict.consent.body}{" "}
          <Link href={`${basePath}/privacy`} className="underline underline-offset-2 hover:text-fg">
            {dict.consent.privacyLink}
          </Link>
        </p>

        <div className="flex shrink-0 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={deny}
            className="flex-1 rounded-pill border border-border px-4 py-2 text-[0.8125rem] font-medium text-fg transition-colors hover:bg-border sm:flex-none sm:px-5 sm:py-2.5 sm:text-sm"
          >
            {dict.consent.decline}
          </button>
          <button
            type="button"
            onClick={grant}
            className="flex-1 rounded-pill bg-accent px-4 py-2 text-[0.8125rem] font-semibold text-accent-fg transition-opacity hover:opacity-90 sm:flex-none sm:px-5 sm:py-2.5 sm:text-sm"
          >
            {dict.consent.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
