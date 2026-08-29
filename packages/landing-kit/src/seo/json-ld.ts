import type { AppConfig } from "../config/schema";
import { localizedContent } from "../i18n/resolve";
import type { StoreStats } from "../store/stats";
import type { Locale } from "../i18n/types";
import { absoluteUrl, origin } from "./metadata";

type JsonLdNode = Record<string, unknown>;

/**
 * `aggregateRating` is only added when rating **and** reviewCount are both present.
 * Google flags an aggregateRating with missing fields as an error (acceptance criterion 5).
 * The schema already requires the two together; this is the second line of defense.
 */
export function softwareApplicationJsonLd(
  config: AppConfig,
  locale: Locale = config.i18n.defaultLocale,
  stats: StoreStats = config.store,
): JsonLdNode {
  const { description } = localizedContent(config, locale);
  const operatingSystem: string[] = [];
  if (config.store.ios) operatingSystem.push("iOS");
  if (config.store.android) operatingSystem.push("Android");

  const node: JsonLdNode = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: config.name,
    description,
    url: origin(config),
    image: absoluteUrl(config, config.assets.icon),
    applicationCategory: "MobileApplication",
    operatingSystem: operatingSystem.join(", "),
    // Free to download from the store; a subscription, if any, is sold inside the app.
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };

  if (stats.rating !== undefined && stats.reviewCount !== undefined) {
    node.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: stats.rating,
      reviewCount: stats.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const downloadUrl = config.store.ios?.url ?? config.store.android?.url;
  if (downloadUrl) node.downloadUrl = downloadUrl;

  return node;
}

export function organizationJsonLd(config: AppConfig): JsonLdNode {
  const sameAs = Object.values(config.social ?? {}).filter(
    (value): value is string => typeof value === "string",
  );

  const node: JsonLdNode = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: config.legal.companyName,
    url: origin(config),
    logo: absoluteUrl(config, config.assets.logo),
    address: { "@type": "PostalAddress", streetAddress: config.legal.companyAddress },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: config.legal.supportEmail,
      url: absoluteUrl(config, "/support"),
    },
  };

  if (sameAs.length > 0) node.sameAs = sameAs;

  return node;
}

/** No node is produced when there is no FAQ data — an empty FAQPage is a schema error. */
export function faqPageJsonLd(
  config: AppConfig,
  locale: Locale = config.i18n.defaultLocale,
): JsonLdNode | null {
  const faq = localizedContent(config, locale).content.faq;
  if (faq.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** All of the nodes to be emitted on the landing page. */
export function landingJsonLd(
  config: AppConfig,
  locale: Locale = config.i18n.defaultLocale,
  stats: StoreStats = config.store,
): JsonLdNode[] {
  const nodes = [softwareApplicationJsonLd(config, locale, stats), organizationJsonLd(config)];
  const faq = faqPageJsonLd(config, locale);
  if (faq) nodes.push(faq);
  return nodes;
}
