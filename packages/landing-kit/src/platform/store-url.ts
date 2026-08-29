import type { AppConfig } from "../config/schema";
import type { Platform } from "./detect";

export type StoreTarget =
  | { kind: "redirect"; url: string }
  | { kind: "qr"; url: string }
  | { kind: "none" };

/**
 * The attribution a link carries in its own path.
 *
 * `/go/{source}/{campaign}/{creative}`, taking as many segments as are given:
 *
 *   /go/alice                     -> campaign "alice", generic web source
 *   /go/influencer/alice          -> source "influencer", campaign "alice"
 *   /go/influencer/alice/reel1    -> ... plus creative "reel1"
 *
 * This is the part that needs no config entry and therefore no deploy: a new creator, podcast
 * or flyer is a URL someone types, not a code change. It also survives what a query string does
 * not — a link retyped off a slide, a video or a printed page keeps its path.
 */
export type PathAttribution = { source?: string; campaign: string; ad?: string };

export function parseCampaignPath(segments: string[]): PathAttribution {
  const clean = segments.filter(Boolean);

  if (clean.length <= 1) return { campaign: clean[0] ?? "web" };
  return { source: clean[0], campaign: clean[1] as string, ad: clean[2] };
}

/**
 * Resolves the attribution fields for a link, in ascending order of precedence:
 *
 *   1. the generic web defaults    — `pid=web`
 *   2. the path                    — `/go/{source}/{campaign}/{creative}`, no config needed
 *   3. the config's campaign entry — an explicit override for a link that earns one
 *   4. the visitor's query string  — utm_ params mapped onto af_ fields, then raw
 *                                    af_ params plus `pid` and `c`
 *
 * Layers 2 and 3 both put the media source in the URL itself rather than a query string, which
 * is what makes a shared link survive a shortener, a bio field or someone retyping it. Query
 * parameters still win when they do arrive, because a real ad click carries the more specific
 * signal.
 */
function appsflyerParams(
  path: PathAttribution,
  incoming: URLSearchParams,
  registered: AppConfig["campaigns"][string] | undefined,
): Record<string, string> {
  const params: Record<string, string> = {
    pid: incoming.get("utm_source") ?? registered?.source ?? path.source ?? "web",
    c: incoming.get("utm_campaign") ?? registered?.campaign ?? path.campaign,
  };

  if (path.ad) params.af_ad = path.ad;
  if (registered?.adset) params.af_adset = registered.adset;
  if (registered?.ad) params.af_ad = registered.ad;

  const adset = incoming.get("utm_medium") ?? incoming.get("af_adset");
  if (adset) params.af_adset = adset;

  const ad = incoming.get("utm_content") ?? incoming.get("af_ad");
  if (ad) params.af_ad = ad;

  const channel = incoming.get("utm_term");
  if (channel) params.af_channel = channel;

  // If af_* parameters were given directly, they win.
  for (const [key, value] of incoming) {
    if (key.startsWith("af_") || key === "pid" || key === "c") params[key] = value;
  }

  return params;
}

/** The direct store URL — used when there is no OneLink. */
export function directStoreUrl(config: AppConfig, platform: Platform): string | undefined {
  if (platform === "ios") return config.store.ios?.url;
  if (platform === "android") return config.store.android?.url;
  return config.store.ios?.url ?? config.store.android?.url;
}

/**
 * Ad creatives always point at `/go/...`; the destination is decided here.
 * With a OneLink attribution is preserved, without one we fall back to the store.
 * On desktop a store link is a dead click — a QR code is shown instead (spec §7).
 *
 * `campaign` is the path after `/go/`, either a single name or `{source}/{campaign}/{creative}`.
 */
export function resolveStoreTarget(
  config: AppConfig,
  platform: Platform,
  campaign: string | string[],
  incoming: URLSearchParams = new URLSearchParams(),
  /**
   * Which store's URL to use, when that differs from the device asking. Clicking one of two
   * badges names a store; the device only says whether a redirect or a QR code is useful.
   */
  storeFor: Platform = platform,
): StoreTarget {
  const oneLink = config.attribution.oneLink;

  const segments = Array.isArray(campaign) ? campaign : campaign.split("/");
  const path = parseCampaignPath(segments);
  // A registered entry is keyed by the whole path, so both `alice` and `influencer/alice` can
  // be given an explicit override without changing how they are linked.
  const registered = config.campaigns[segments.filter(Boolean).join("/")];

  if (platform === "desktop") {
    const url = oneLink
      ? withParams(oneLink, appsflyerParams(path, incoming, registered))
      : directStoreUrl(config, storeFor) ??
        directStoreUrl(config, "ios") ??
        directStoreUrl(config, "android");

    if (!url) return { kind: "none" };

    // A shared link should just work. The store's web page still lets a desktop visitor read
    // the listing and continue on their phone; an interstitial asks them to act first. The QR
    // page stays available for tenants that want it.
    return config.features.desktopQr ? { kind: "qr", url } : { kind: "redirect", url };
  }

  if (oneLink) {
    const params = appsflyerParams(path, incoming, registered);
    params.af_force_deeplink = "true";
    return { kind: "redirect", url: withParams(oneLink, params) };
  }

  const url = directStoreUrl(config, storeFor);
  return url ? { kind: "redirect", url } : { kind: "none" };
}

function withParams(base: string, params: Record<string, string>): string {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}
