import type { AppConfig } from "../config/schema";

type Attribution = AppConfig["attribution"];

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (event: string, params?: Record<string, unknown>) => void };
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Reports a store click to whichever ad platforms are configured.
 *
 * Called from the click handler on a `/go/...` link, and only when consent has been granted —
 * the caller checks, because this file has no business reaching into React context.
 *
 * Each call is guarded on the global the pixel script defines. A pixel that is not configured
 * never loads its script, so the global is absent and the call is skipped; the same guard
 * covers a script blocked by an extension or still in flight, which is why nothing here throws
 * on a page where tracking is unavailable.
 *
 * Nothing is awaited and navigation is not delayed. Every one of these libraries sends its
 * event with `navigator.sendBeacon` or an image request, both of which survive the page going
 * away — holding the visitor on the page to be sure would trade a real click for a measurement.
 */
export function reportStoreClick(attribution: Attribution, store: "ios" | "android"): void {
  if (typeof window === "undefined") return;

  const { conversionEvent } = attribution;
  const params = { content_type: "app", content_name: store };

  if (attribution.metaPixelId && window.fbq) {
    window.fbq("track", conversionEvent.meta, params);
  }

  if (attribution.tiktokPixelId && window.ttq) {
    window.ttq.track(conversionEvent.tiktok, params);
  }

  // Google Ads attributes to a conversion action, named by the label. With an account id but no
  // label there is nothing to report to, so the call is skipped rather than sent somewhere it
  // cannot land.
  if (attribution.googleAdsId && conversionEvent.googleAdsLabel && window.gtag) {
    window.gtag("event", "conversion", {
      send_to: `${attribution.googleAdsId}/${conversionEvent.googleAdsLabel}`,
    });
  }
}
