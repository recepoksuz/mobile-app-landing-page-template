import type { AppConfig } from "../config/schema";
import { localizedContent } from "../i18n/resolve";
import { isHeroOnly } from "../routes/routes";
import { resolveStoreStats } from "../store/stats";
import type { Locale } from "../i18n/types";
import { FALLBACK_MOCKUP_SIZE, imageSize } from "../seo/image-size";
import { JsonLd } from "../seo/JsonLd";
import { landingJsonLd } from "../seo/json-ld";
import { ClosingCta } from "./ClosingCta";
import { Faq } from "./Faq";
import { Features } from "./Features";
import { Hero } from "./Hero";
import { hasSocialProof, SocialProof } from "./SocialProof";
import { Steps } from "./Steps";

/**
 * Spec §9: one page, at most 7 blocks. A block whose data is absent from the config is not
 * rendered at all — which is how the same code produces both a hero-only site and a full one.
 *
 * The closing CTA appears only when something follows the hero. On a hero-only page the badges
 * are still on screen and repeating them would be a second ask without a second reason; on a
 * long page, a visitor who read to the end would otherwise have to scroll back to act.
 */
export async function LandingPage({
  config,
  locale,
  basePath = "",
}: {
  config: AppConfig;
  locale: Locale;
  /** URL prefix for the active locale, e.g. "/tr". Empty for the default locale. */
  basePath?: string;
}) {
  const { tagline, description, content } = localizedContent(config, locale);
  const mockupSize = (await imageSize(config.assets.mockup)) ?? FALLBACK_MOCKUP_SIZE;

  // With nothing below it, the hero is the whole page: it should fill the screen once rather
  // than leaving a band of dead black under the fold for the visitor to scroll past.
  const compact = isHeroOnly(config);

  // Resolved once here rather than in each consumer: the same figures feed the visible strip and
  // the structured data, and they must not disagree.
  const stats = await resolveStoreStats(config);

  return (
    <>
      <JsonLd data={landingJsonLd(config, locale, stats)} />
      <Hero
        compact={compact}
        proofBelow={hasSocialProof(stats)}
        config={config}
        locale={locale}
        basePath={basePath}
        tagline={tagline}
        description={description}
        mockupSize={mockupSize}
      />
      <SocialProof config={config} locale={locale} stats={stats} compact={compact} />
      <Features config={config} locale={locale} features={content.features} />
      <Steps locale={locale} steps={content.steps} />
      <Faq locale={locale} faq={content.faq} />
      {compact ? null : <ClosingCta config={config} locale={locale} basePath={basePath} />}
    </>
  );
}
