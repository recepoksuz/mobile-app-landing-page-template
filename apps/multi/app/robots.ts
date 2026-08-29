import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { resolveTenant } from "@landing/kit";
import { fallbackSlug, registry } from "@/config";

/**
 * robots.ts has to sit at the `app` root, so we resolve the tenant from the host
 * with `headers()` — that makes this route dynamic, which is exactly right: every
 * host must get its own robots.txt.
 *
 * The sitemap line is always a full URL with a protocol. The
 * `Sitemap: <domain>/sitemap.xml` mistake complained about in spec §5.4 is
 * structurally impossible here.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");
  const config = resolveTenant(registry, host, fallbackSlug);

  if (!config) {
    // Unknown host: let nothing be indexed, leak no tenant's host.
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The attribution redirects have no content to crawl.
      disallow: ["/go/"],
    },
    sitemap: `https://${config.domain}/sitemap.xml`,
  };
}
