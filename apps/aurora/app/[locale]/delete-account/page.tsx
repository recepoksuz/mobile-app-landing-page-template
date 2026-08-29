import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buildMetadata,
  hasRoute,
  localesOf,
  localesWithDocument,
  resolveLegalDocument,
} from "@landing/kit";
import { getTenantLocale, LEGAL_UPDATED, type RouteParams } from "@/lib/tenant";

const DOCUMENT = "delete-account" as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { config, locale } = await getTenantLocale(params);

  // Only advertise an `hreflang` for the locales this document is genuinely translated into —
  // pointing `hreflang="tr"` at English prose is worse than having no alternate at all.
  const translated = localesWithDocument(DOCUMENT).filter((code) =>
    localesOf(config).includes(code),
  );

  return buildMetadata(config, {
    path: "/delete-account",
    locale,
    availableLocales: translated.length > 0 ? translated : [config.i18n.defaultLocale],
    title: `Delete your account — ${config.name}`,
    description: `How to permanently delete your ${config.name} account and the data attached to it.`,
  });
}

export default async function Page({ params }: { params: Promise<RouteParams> }) {
  const { config, locale } = await getTenantLocale(params);
  if (!hasRoute(config, "/delete-account")) notFound();

  const { Component } = resolveLegalDocument(DOCUMENT, locale, config.i18n.defaultLocale);
  return <Component config={config} updated={LEGAL_UPDATED} locale={locale} />;
}
