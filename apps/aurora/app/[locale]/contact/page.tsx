import { permanentRedirect } from "next/navigation";
import { getTenantLocale, type RouteParams } from "@/lib/tenant";

export default async function Page({ params }: { params: Promise<RouteParams> }): Promise<never> {
  const { basePath } = await getTenantLocale(params);
  permanentRedirect(`${basePath}/support`);
}
