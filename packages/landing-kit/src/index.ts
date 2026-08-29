// Config
export { appConfigSchema } from "./config/schema";
export type { AppConfig, AppConfigInput } from "./config/schema";
export { defineAppConfig } from "./config/define";
export {
  createTenantRegistry,
  isPlatformHost,
  normalizeHost,
  resolveTenant,
  type TenantRegistry,
} from "./config/registry";

// Routes
export {
  tenantRoutes,
  hasRoute,
  legalNavLinks,
  headerNavLinks,
  isHeroOnly,
  type TenantRoute,
} from "./routes/routes";
export { matchRedirect, type RedirectMatch } from "./routes/redirects";

// Platform / attribution
export { detectPlatform, forcedPlatform, type Platform } from "./platform/detect";
export {
  resolveStoreTarget,
  directStoreUrl,
  parseCampaignPath,
  type StoreTarget,
  type PathAttribution,
} from "./platform/store-url";

// SEO
export { buildMetadata, absoluteUrl, origin } from "./seo/metadata";
export { resolveStoreStats, type StoreStats } from "./store/stats";
export { buildSitemap, type SitemapExtra } from "./seo/sitemap";
export { imageSize, FALLBACK_MOCKUP_SIZE, type ImageSize } from "./seo/image-size";
export {
  landingJsonLd,
  softwareApplicationJsonLd,
  organizationJsonLd,
  faqPageJsonLd,
} from "./seo/json-ld";
export { JsonLd } from "./seo/JsonLd";

// Well-known
export { buildAasa, type Aasa } from "./wellknown/aasa";
export { buildAssetLinks, type AssetLinks } from "./wellknown/assetlinks";

// Theme
export { themeStyle, readableOn, contrastRatio } from "./theme/themeStyle";

// Components
export { LandingPage } from "./components/LandingPage";
export { Header } from "./components/Header";
export { Hero } from "./components/Hero";
export { SocialProof } from "./components/SocialProof";
export { Features } from "./components/Features";
export { Steps } from "./components/Steps";
export { Faq } from "./components/Faq";
export { ClosingCta } from "./components/ClosingCta";
export { Footer } from "./components/Footer";
export { CtaButton } from "./components/CtaButton";
export { StoreBadges } from "./components/StoreBadges";
export { LocaleSwitcher } from "./components/LocaleSwitcher";
export { MobileMenu } from "./components/MobileMenu";
export { QrCode } from "./components/QrCode";
export { StoreUnavailable } from "./components/StoreUnavailable";

// Legal
export { LegalPage, Section, P, List } from "./legal/LegalPage";
export {
  resolveLegalDocument,
  localesWithDocument,
  type LegalDocument,
  type LegalDocumentProps,
} from "./legal/registry";

// i18n
export {
  dictionaries,
  getDictionary,
  localesOf,
  isSupportedLocale,
  localePath,
  splitLocale,
  localizedContent,
  t,
  DEFAULT_LOCALE,
} from "./i18n/resolve";
export {
  negotiateLocale,
  localeRedirectFor,
  isCrawler,
  LOCALE_COOKIE,
} from "./i18n/negotiate";
export type { Dictionary, Locale } from "./i18n/types";

// Tracking
export { ConsentProvider, useConsent, CONSENT_STORAGE_KEY } from "./tracking/ConsentProvider";
export { ConsentBanner } from "./tracking/ConsentBanner";
export { Analytics } from "./tracking/Analytics";
export { Pixels, hasTrackingPixels } from "./tracking/Pixels";
