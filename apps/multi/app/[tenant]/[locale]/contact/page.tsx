import { permanentRedirect } from "next/navigation";
import { getTenantLocale, type RouteParams } from "@/lib/tenant";

/**
 * `/contact` is only an alias for `/support` (spec §4). Which of the two ends up in a store
 * form varies per app, so both have to work.
 */
export default async function Page({ params }: { params: Promise<RouteParams> }): Promise<never> {
  const { basePath } = await getTenantLocale(params);
  permanentRedirect(`${basePath}/support`);
}
