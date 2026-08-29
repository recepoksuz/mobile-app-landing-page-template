import type { Metadata } from "next";
import { buildMetadata, localesOf, localesWithDocument, resolveLegalDocument } from "@landing/kit";
import { getTenantLocale, LEGAL_UPDATED, type RouteParams } from "@/lib/tenant";

const DOCUMENT = "privacy" as const;

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
    path: "/privacy",
    locale,
    availableLocales: translated.length > 0 ? translated : [config.i18n.defaultLocale],
    title: `Privacy Policy — ${config.name}`,
    description: `How ${config.name} collects, uses, and protects your data.`,
  });
}

export default async function Page({ params }: { params: Promise<RouteParams> }) {
  const { config, locale } = await getTenantLocale(params);

  const { Component } = resolveLegalDocument(DOCUMENT, locale, config.i18n.defaultLocale);
  return <Component config={config} updated={LEGAL_UPDATED} locale={locale} />;
}
