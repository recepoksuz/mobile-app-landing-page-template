"use client";

import Script from "next/script";
import type { AppConfig } from "../config/schema";
import { useConsent } from "./ConsentProvider";

/**
 * Third-party pixels. **None** of them are mounted without `consent === "granted"`; the
 * component returns null, so not a single request goes out to the network (acceptance
 * criterion 7).
 */
/**
 * Whether this tenant loads anything third-party at all.
 *
 * A cookie banner on a page that sets no third-party cookies is noise, not compliance — the
 * obligation follows the tracking, not the other way round. So the banner is shown exactly when
 * a pixel is configured, and a tenant with an empty `attribution` block gets a clean page with
 * nothing to consent to.
 */
export function hasTrackingPixels(attribution: AppConfig["attribution"]): boolean {
  return Boolean(
    attribution.metaPixelId ||
      attribution.tiktokPixelId ||
      attribution.googleAdsId ||
      attribution.appsflyerDevKey,
  );
}

export function Pixels({ attribution }: { attribution: AppConfig["attribution"] }) {
  const { consent } = useConsent();

  if (consent !== "granted") return null;

  return (
    <>
      {attribution.metaPixelId ? <MetaPixel id={attribution.metaPixelId} /> : null}
      {attribution.tiktokPixelId ? <TikTokPixel id={attribution.tiktokPixelId} /> : null}
      {attribution.googleAdsId ? <GoogleAds id={attribution.googleAdsId} /> : null}
      {attribution.appsflyerDevKey ? <AppsFlyerSmartScript /> : null}
    </>
  );
}

function MetaPixel({ id }: { id: string }) {
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${id}');fbq('track','PageView');`}
    </Script>
  );
}

function TikTokPixel({ id }: { id: string }) {
  return (
    <Script id="tiktok-pixel" strategy="afterInteractive">
      {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
ttq.setAndDefer=function(e,n){e[n]=function(){e.push([n].concat(Array.prototype.slice.call(arguments,0)))}};
for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
ttq.instance=function(e){for(var n=ttq._i[e]||[],r=0;r<ttq.methods.length;r++)ttq.setAndDefer(n,ttq.methods[r]);return n};
ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";
ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=r+"?sdkid="+e+"&lib="+t;
var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
ttq.load('${id}');ttq.page();}(window,document,'ttq');`}
    </Script>
  );
}

function GoogleAds({ id }: { id: string }) {
  return (
    <>
      <Script
        id="gtag-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('js',new Date());gtag('config','${id}');`}
      </Script>
    </>
  );
}

/**
 * The AppsFlyer Smart Script enriches the store links on the page with attribution
 * parameters. The redirect itself is done server-side in the `/go/[campaign]` route
 * handler; this script only completes the web-to-app measurement.
 */
function AppsFlyerSmartScript() {
  return (
    <Script
      id="appsflyer-smart-script"
      strategy="afterInteractive"
      src="https://onelinksmartscript.appsflyer.com/onelink-smart-script-latest.js"
    />
  );
}
