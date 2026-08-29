import type { Metadata } from "next";
import { buildMetadata, localesOf, localesWithDocument, resolveLegalDocument } from "@landing/kit";
import { getTenantLocale, LEGAL_UPDATED, type RouteParams } from "@/lib/tenant";

const DOCUMENT = "support" as const;

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
    path: "/support",
    locale,
    availableLocales: translated.length > 0 ? translated : [config.i18n.defaultLocale],
    title: `Support — ${config.name}`,
    description: `Get help with ${config.name}. Contact our team and we will reply within 3 business days.`,
  });
}

export default async function Page({ params }: { params: Promise<RouteParams> }) {
  const { config, locale } = await getTenantLocale(params);

  const { Component } = resolveLegalDocument(DOCUMENT, locale, config.i18n.defaultLocale);
  return <Component config={config} updated={LEGAL_UPDATED} locale={locale} />;
}
