import type { AppConfig } from "../config/schema";

export type StoreStats = {
  rating?: number;
  reviewCount?: number;
  downloads?: string;
};

/** A day. Ratings move slowly, and a landing page is not a dashboard. */
const REVALIDATE_SECONDS = 60 * 60 * 24;

/**
 * Effective rating and review count for a tenant.
 *
 * Order: a value pinned in the config wins; otherwise it is looked up from the App Store.
 *
 * The reason to prefer the lookup is that a hard-coded rating is wrong the day after it is
 * written, and it does not stay a cosmetic problem — the figure is published as
 * `aggregateRating` structured data, and Google treats numbers a site cannot substantiate as a
 * policy violation. Pinning stays available for the cases that need it: a pre-launch page, or a
 * figure that has to match a press kit.
 *
 * There is no equivalent for Google Play. Its public rating is not exposed through an API that
 * can be used without authentication, and scraping the store page is against its terms — so the
 * App Store figure is what gets published, which is also the one most apps quote.
 */
export async function resolveStoreStats(config: AppConfig): Promise<StoreStats> {
  const { rating, reviewCount, downloads, autoFetch, ios } = config.store;

  // Both pinned: nothing to look up. The schema already refuses one without the other, because
  // Google flags an aggregateRating that is missing either half.
  if (rating !== undefined && reviewCount !== undefined) {
    return { rating, reviewCount, downloads };
  }

  if (!autoFetch || !ios) return { downloads };

  const fetched = await fetchAppStoreRating(ios.appId, ios.country);
  return { ...fetched, downloads };
}

/**
 * Reads the rating from the public iTunes lookup endpoint.
 *
 * Deliberately forgiving: a landing page must build and render whether or not Apple answers, so
 * every failure path returns nothing and the social-proof strip simply does not appear. A build
 * that breaks because a third party is slow is worse than a page without a star rating.
 */
async function fetchAppStoreRating(
  appId: string,
  country: string,
): Promise<{ rating?: number; reviewCount?: number }> {
  const url = `https://itunes.apple.com/lookup?id=${encodeURIComponent(appId)}&country=${encodeURIComponent(country)}`;

  try {
    const response = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!response.ok) return {};

    const body: unknown = await response.json();
    const result = (body as { results?: unknown[] })?.results?.[0] as
      | { averageUserRating?: unknown; userRatingCount?: unknown }
      | undefined;

    const rating = typeof result?.averageUserRating === "number" ? result.averageUserRating : undefined;
    const reviewCount =
      typeof result?.userRatingCount === "number" ? result.userRatingCount : undefined;

    // Both or neither, for the same reason the schema insists on it.
    if (rating === undefined || reviewCount === undefined || reviewCount === 0) return {};

    return { rating: Math.round(rating * 10) / 10, reviewCount };
  } catch {
    return {};
  }
}
