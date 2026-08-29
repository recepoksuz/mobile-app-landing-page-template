import { assetDataUri, renderOgImage } from "@landing/kit/server";
import { getTenantLocale, type RouteParams } from "@/lib/tenant";

/**
 * The OG image is a plain route handler rather than the `opengraph-image.tsx` metadata
 * convention: the convention derives its URL from the segment path and would produce
 * `https://aurora.example/aurora/en/opengraph-image`, leaking the internal segments into a public
 * URL where the proxy's isolation rule 404s it. As a route handler the address is `/og`
 * (or `/tr/og`), which the proxy rewrites internally.
 */
export async function GET(_request: Request, { params }: { params: Promise<RouteParams> }) {
  const { config, locale } = await getTenantLocale(params);
  const iconSrc = await assetDataUri(config.assets.icon);
  return renderOgImage(config, { locale, iconSrc });
}
