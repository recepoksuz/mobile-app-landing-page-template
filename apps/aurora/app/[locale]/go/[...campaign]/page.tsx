import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  absoluteUrl,
  detectPlatform,
  forcedPlatform,
  getDictionary,
  QrCode,
  resolveStoreTarget,
  StoreUnavailable,
  t,
} from "@landing/kit";
import { getTenantLocale, type RouteParams } from "@/lib/tenant";

/** The routing decision depends on the UA of each request, so it cannot be cached. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<RouteParams & { campaign: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Spec §6.1: ad creatives point here rather than straight at the store, so a store change or
 * an A/B test is a single route update instead of a creative refresh.
 *
 * iOS/Android -> OneLink (attribution preserved) or the store, 307.
 * Desktop     -> no redirect; a QR page, because a store link on desktop is a dead click.
 */
export default async function GoPage({ params, searchParams }: PageProps) {
  const { campaign } = await params;
  const campaignPath = campaign.join("/");
  const { config, locale, basePath } = await getTenantLocale(params);
  const dict = getDictionary(locale);

  const detected = detectPlatform((await headers()).get("user-agent"));

  const incoming = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") incoming.set(key, value);
    else if (Array.isArray(value) && value[0] !== undefined) incoming.set(key, value[0]);
  }

  // Clicking a badge names the store; the UA only says which device is asking. Desktop keeps
  // its QR page either way.
  const chosen = forcedPlatform(incoming.get("store"));
  const platform = detected === "desktop" ? "desktop" : chosen ?? detected;
  const storeFor = chosen ?? detected;

  const target = resolveStoreTarget(config, platform, campaign, incoming, storeFor);

  if (target.kind === "redirect") {
    redirect(target.url);
  }

  if (target.kind === "none") {
    // No store for this visitor's platform. Bouncing them to the home page would loop them —
    // its only CTA points straight back here — so say plainly where the app is available.
    return <StoreUnavailable config={config} platform={platform} locale={locale} />;
  }

  const shareUrl = absoluteUrl(config, `${basePath}/go/${campaignPath}`);

  return (
    <main className="site-container flex flex-1 flex-col items-center justify-center gap-8 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
        {t(dict.go.heading, { name: config.name })}
      </h1>
      <p className="max-w-md text-muted text-pretty">{dict.go.body}</p>

      <QrCode value={target.url} size={240} title={`${dict.go.qrAlt} ${config.name}`} />

      <p className="text-sm text-muted">{t(dict.go.openOnPhone, { url: shareUrl })}</p>
    </main>
  );
}
