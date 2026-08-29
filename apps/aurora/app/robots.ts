import type { MetadataRoute } from "next";
import { getTenant } from "@/lib/tenant";

/**
 * In a graduated app the host is fixed; `headers()` is not needed, so robots is
 * generated statically. The URL and the content are exactly the same as in
 * `apps/multi` — since the domain does not change, it leaves zero trace on the search
 * engine side (spec §10).
 */
export default function robots(): MetadataRoute.Robots {
  const config = getTenant();

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/go/"] },
    sitemap: `https://${config.domain}/sitemap.xml`,
  };
}
