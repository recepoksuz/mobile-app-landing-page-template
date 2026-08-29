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

const DOCUMENT = "refund-policy" as const;

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
    path: "/refund-policy",
    locale,
    availableLocales: translated.length > 0 ? translated : [config.i18n.defaultLocale],
    title: `Refund Policy — ${config.name}`,
    description: `How to request a refund for a ${config.name} purchase or subscription.`,
  });
}

export default async function Page({ params }: { params: Promise<RouteParams> }) {
  const { config, locale } = await getTenantLocale(params);
  if (!hasRoute(config, "/refund-policy")) notFound();

  const { Component } = resolveLegalDocument(DOCUMENT, locale, config.i18n.defaultLocale);
  return <Component config={config} updated={LEGAL_UPDATED} locale={locale} />;
}
