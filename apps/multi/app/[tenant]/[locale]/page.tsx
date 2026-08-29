import { LandingPage } from "@landing/kit";
import { getTenantLocale, type RouteParams } from "@/lib/tenant";

export default async function Page({ params }: { params: Promise<RouteParams> }) {
  const { config, locale, basePath } = await getTenantLocale(params);

  return (
    <main>
      <LandingPage config={config} locale={locale} basePath={basePath} />
    </main>
  );
}
