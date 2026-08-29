import { assetLinksResponse } from "@/lib/well-known";

export const dynamic = "force-dynamic";

export function GET() {
  return assetLinksResponse();
}
