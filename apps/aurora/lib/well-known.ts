import { buildAasa, buildAssetLinks } from "@landing/kit";
import { getTenant } from "./tenant";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=3600, must-revalidate",
} as const;

export function appleAppSiteAssociationResponse(): Response {
  const aasa = buildAasa(getTenant());
  if (!aasa) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(aasa), { headers: JSON_HEADERS });
}

export function assetLinksResponse(): Response {
  const links = buildAssetLinks(getTenant());
  if (!links) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(links), { headers: JSON_HEADERS });
}
