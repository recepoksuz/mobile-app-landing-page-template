import { appleAppSiteAssociationResponse } from "@/lib/well-known";

export const dynamic = "force-dynamic";

export function GET() {
  return appleAppSiteAssociationResponse();
}
