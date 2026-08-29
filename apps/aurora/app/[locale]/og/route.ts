import { assetDataUri, renderOgImage } from "@landing/kit/server";
import { getTenantLocale, type RouteParams } from "@/lib/tenant";

export async function GET(_request: Request, { params }: { params: Promise<RouteParams> }) {
  const { config, locale } = await getTenantLocale(params);
  const iconSrc = await assetDataUri(config.assets.icon);
  return renderOgImage(config, { locale, iconSrc });
}
