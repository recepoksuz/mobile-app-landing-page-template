import type { AppConfig } from "../config/schema";
import { getDictionary, t } from "../i18n/resolve";
import type { Locale } from "../i18n/types";
import { StoreBadges } from "./StoreBadges";

/**
 * The closing ask.
 *
 * Only rendered on a page that has sections below the hero. On a hero-only page the badges are
 * still on screen, and repeating them a few hundred pixels later would be a second ask without a
 * second reason — which is why this was removed from that layout.
 *
 * On a long page the opposite is true: by the time someone has read the features, the steps and
 * the FAQ, the only way to act on any of it is a scroll back to the top. Someone who read to the
 * end is the most convinced visitor on the page, and this is the one place they can say yes.
 */
export function ClosingCta({
  config,
  locale,
  basePath = "",
}: {
  config: AppConfig;
  locale: Locale;
  basePath?: string;
}) {
  const dict = getDictionary(locale);

  return (
    <section aria-labelledby="closing-cta" className="border-t border-border bg-surface">
      <div className="site-container flex flex-col items-center gap-6 py-16 text-center md:py-24">
        <h2
          id="closing-cta"
          className="display-gradient max-w-2xl font-semibold tracking-tight text-balance"
          style={{ fontSize: "clamp(1.75rem, 1.3rem + 1.9vw, 2.5rem)" }}
        >
          {t(dict.cta.closingHeading, { name: config.name })}
        </h2>

        <p className="max-w-md text-muted text-pretty">{dict.cta.closingBody}</p>

        <StoreBadges
          config={config}
          locale={locale}
          basePath={basePath}
          campaign="footer"
          className="mt-2 justify-center"
        />
      </div>
    </section>
  );
}
