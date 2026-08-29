import type { AppConfig } from "../config/schema";
import type { StoreStats } from "../store/stats";
import { getDictionary } from "../i18n/resolve";
import type { Locale } from "../i18n/types";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((index) => (
        <svg key={index} viewBox="0 0 20 20" className="size-4" style={{ color: "var(--color-accent)" }}>
          <defs>
            <linearGradient id={`star-fill-${index}`}>
              {/* Partial star: at a 4.7 rating the fifth star appears 70% filled. */}
              <stop offset={`${Math.max(0, Math.min(1, rating - index)) * 100}%`} stopColor="currentColor" />
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            </linearGradient>
          </defs>
          <path
            fill={`url(#star-fill-${index})`}
            d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.21l-4.94 2.6.94-5.5-4-3.9 5.53-.8z"
          />
        </svg>
      ))}
    </span>
  );
}

/**
 * Social proof sits directly below the hero (spec §7). If the config has no data, the
 * block is not rendered at all — an empty "0 reviews" line hurts conversion.
 */
export function SocialProof({
  config,
  locale,
  stats,
  compact = false,
}: {
  config: AppConfig;
  locale: Locale;
  /** Effective figures: pinned in the config, or looked up from the App Store. */
  stats: StoreStats;
  compact?: boolean;
}) {
  const dict = getDictionary(locale);
  const { rating, reviewCount, downloads } = stats;
  const hasRating = rating !== undefined && reviewCount !== undefined;

  if (!hasRating && !downloads) return null;

  // Compact notation is locale-aware: "12K" in English, "12 B" in Turkish.
  const numberFormat = new Intl.NumberFormat(locale, { notation: "compact" });

  return (
    <section aria-label={dict.socialProof.regionLabel} className={`site-container ${compact ? "pb-3 md:pb-4" : "pb-2 md:pb-4"}`}>
      <div className="flex flex-col items-center gap-3 border-y border-border py-5 text-center tabular-nums sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-8 lg:justify-start lg:gap-x-10 lg:text-left">
        {hasRating ? (
          <>
            {/*
              Stars above the label on a phone. Side by side they run to the width of the screen
              and the row wraps mid-sentence; stacked, the stars read as the headline they are and
              the label sits under them.
            */}
            <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-2.5">
              <Stars rating={rating} />
              <span className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
                <span className="text-sm text-muted">{dict.socialProof.storeRating}</span>
              </span>
            </div>
            <div className="text-sm text-muted">
              <span className="font-semibold text-fg">{numberFormat.format(reviewCount)}</span> {dict.socialProof.reviews}
            </div>
          </>
        ) : null}

        {downloads ? (
          <div className="text-sm text-muted">
            <span className="font-semibold text-fg">{downloads}</span> {dict.socialProof.downloads}
          </div>
        ) : null}
      </div>
    </section>
  );
}
