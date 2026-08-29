import { Analytics as VercelAnalytics } from "@vercel/analytics/next";

import type { AppConfig } from "../config/schema";

/**
 * Vercel Web Analytics, when the tenant asks for it.
 *
 * This is the one piece of measurement that does **not** sit behind the consent gate, and the
 * reason is that there is nothing to gate. Vercel serves both the script and its beacon from
 * `/_vercel/insights` on the site's own domain: no third-party request, no cookie, no stored
 * identifier. A banner asking permission for it would be asking about nothing, and this template
 * only shows a banner when something genuinely needs one.
 *
 * Anything that sets a cookie or leaves the domain — Meta, TikTok, Google Ads, AppsFlyer — still
 * goes through `Pixels`, which renders nothing until consent is granted. If you add a provider
 * here that does either, it belongs there instead.
 *
 * What it answers, which nothing else in the template does: how many people arrived, from where,
 * and how many went on to `/go/...`. A tenant not running paid ads has no pixel configured and
 * would otherwise be flying blind.
 *
 * Off by default. It costs a request per visit, and a deploy outside Vercel has nothing to
 * receive it — so a tenant opts in rather than inheriting it.
 */
export function Analytics({ features }: { features: AppConfig["features"] }) {
  if (!features.analytics) return null;

  return <VercelAnalytics />;
}
