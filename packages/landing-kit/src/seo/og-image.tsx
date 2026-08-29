import { ImageResponse } from "next/og";
import type { AppConfig } from "../config/schema";
import { localizedContent } from "../i18n/resolve";
import type { Locale } from "../i18n/types";
import { readableOn } from "../theme/themeStyle";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export type OgImageOptions = {
  /** Locale whose tagline the card should show. Defaults to the tenant's default locale. */
  locale?: Locale;
  /**
   * Data URI of the app icon. Produced with `assetDataUri()` — because satori cannot
   * draw external SVGs, the image has to be inlined.
   */
  iconSrc?: string;
};
export const OG_IMAGE_CONTENT_TYPE = "image/png";

function Stars({ rating, color }: { rating: number; color: string }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[0, 1, 2, 3, 4].map((index) => (
        <svg key={index} width="34" height="34" viewBox="0 0 20 20">
          <path
            d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.21l-4.94 2.6.94-5.5-4-3.9 5.53-.8z"
            fill={color}
            opacity={index + 1 <= Math.round(rating) ? 1 : 0.25}
          />
        </svg>
      ))}
    </div>
  );
}

/**
 * Dynamic OG image (spec §5.2). The reference sites have no `og:image` at all; a shared
 * link looks bare — one of the cheapest CTR wins there is.
 *
 * `ImageResponse` only supports flexbox; every container must set `display: flex`
 * explicitly, otherwise the render throws.
 */
export function renderOgImage(config: AppConfig, options: OgImageOptions = {}): ImageResponse {
  const accent = config.theme.accent;
  const onAccent = readableOn(accent);
  const { rating, reviewCount } = config.store;
  const hasRating = rating !== undefined && reviewCount !== undefined;
  const iconSrc = options.iconSrc;
  const { tagline } = localizedContent(config, options.locale ?? config.i18n.defaultLocale);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          backgroundColor: "#000000",
          // Carry the accent as a wide halo in the background — the one color that tells tenants apart.
          backgroundImage: `radial-gradient(900px 600px at 85% 15%, ${accent}55, transparent 70%)`,
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {iconSrc ? (
            /* satori (ImageResponse) renders its own node set; next/image does not work there. */
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconSrc} width={104} height={104} style={{ borderRadius: 24 }} alt="" />
          ) : (
            // If the icon could not be read, an accent placeholder — the image is still produced.
            <div
              style={{
                display: "flex",
                width: 104,
                height: 104,
                borderRadius: 24,
                backgroundColor: accent,
                color: onAccent,
                fontSize: 52,
                fontWeight: 700,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {config.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ display: "flex", fontSize: 38, fontWeight: 600, letterSpacing: -0.5 }}>
            {config.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: -2,
              maxWidth: 940,
            }}
          >
            {tagline}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {hasRating ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Stars rating={rating} color={accent} />
                <div style={{ display: "flex", fontSize: 28, color: "#a1a1aa" }}>
                  {rating.toFixed(1)} · {new Intl.NumberFormat("en-US", { notation: "compact" }).format(reviewCount)} reviews
                </div>
              </div>
            ) : null}

            {config.store.downloads ? (
              <div style={{ display: "flex", fontSize: 28, color: "#a1a1aa" }}>
                {hasRating ? "· " : ""}
                {config.store.downloads} downloads
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                backgroundColor: accent,
                color: onAccent,
                fontSize: 26,
                fontWeight: 600,
                padding: "16px 34px",
                borderRadius: 999,
              }}
            >
              {config.domain}
            </div>
          </div>
        </div>
      </div>
    ),
    OG_IMAGE_SIZE,
  );
}
