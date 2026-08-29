import { headers } from "next/headers";
import { buildAasa, buildAssetLinks, resolveTenant } from "@landing/kit";
import { fallbackSlug, registry } from "@/config";

/**
 * The most common reason a deep link does not work is that these files are forgotten
 * or served with the wrong `Content-Type` (spec §4). That is why both are baked into
 * the code and the `Content-Type` is set to `application/json` by hand —
 * `apple-app-site-association` has no extension, so servers default to
 * `application/octet-stream` and the file ends up being downloaded.
 */
const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=3600, must-revalidate",
} as const;

async function tenantFromHost() {
  const host = (await headers()).get("host");
  return resolveTenant(registry, host, fallbackSlug);
}

export async function appleAppSiteAssociationResponse(): Promise<Response> {
  const config = await tenantFromHost();
  const aasa = config ? buildAasa(config) : null;

  // If teamId/bundleId are not provided, do not serve the file at all; an empty AASA
  // is a failure that is harder to diagnose than a missing one.
  if (!aasa) return new Response("Not found", { status: 404 });

  return new Response(JSON.stringify(aasa), { headers: JSON_HEADERS });
}

export async function assetLinksResponse(): Promise<Response> {
  const config = await tenantFromHost();
  const links = config ? buildAssetLinks(config) : null;

  if (!links) return new Response("Not found", { status: 404 });

  return new Response(JSON.stringify(links), { headers: JSON_HEADERS });
}
