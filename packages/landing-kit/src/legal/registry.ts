import type { ComponentType } from "react";
import type { AppConfig } from "../config/schema";
import type { Locale } from "../i18n/types";
import { DeleteAccount } from "./en/delete-account";
import { PrivacyPolicy } from "./en/privacy";
import { RefundPolicy } from "./en/refund-policy";
import { SupportPage } from "./en/support";
import { TermsOfService } from "./en/terms";

export type LegalDocument = "privacy" | "terms" | "refund-policy" | "delete-account" | "support";

export type LegalDocumentProps = {
  config: AppConfig;
  updated: string;
  /** The locale the surrounding page is in, which may differ from the document's own. */
  locale: Locale;
};

type LegalSet = Record<LegalDocument, ComponentType<LegalDocumentProps>>;

/**
 * Legal documents by locale.
 *
 * Adding a language means adding a folder of `.tsx` documents next to `en/` and registering it
 * here — not filling in dictionary fragments. Legal prose has to be readable end to end by the
 * person who signs off on it, and machine-translating it is not an option.
 */
const documents: Record<Locale, Partial<LegalSet>> = {
  en: {
    privacy: PrivacyPolicy,
    terms: TermsOfService,
    "refund-policy": RefundPolicy,
    "delete-account": DeleteAccount,
    support: SupportPage,
  },
};

/**
 * Resolves a document for a locale, falling back to the tenant's default locale and finally to
 * English. `translated` says whether the visitor is actually getting their own language — the
 * page uses it to show a notice, and the metadata uses it to avoid claiming an `hreflang`
 * that would point at English text.
 */
export function resolveLegalDocument(
  document: LegalDocument,
  locale: Locale,
  defaultLocale: Locale,
): { Component: ComponentType<LegalDocumentProps>; translated: boolean } {
  const exact = documents[locale]?.[document];
  if (exact) return { Component: exact, translated: true };

  const fallback = documents[defaultLocale]?.[document] ?? documents.en?.[document];
  if (!fallback) {
    throw new Error(`No legal document registered for "${document}" in any locale`);
  }

  return { Component: fallback, translated: false };
}

/** Locales that have a full translation of this document. */
export function localesWithDocument(document: LegalDocument): Locale[] {
  return Object.entries(documents)
    .filter(([, set]) => Boolean(set[document]))
    .map(([locale]) => locale);
}
