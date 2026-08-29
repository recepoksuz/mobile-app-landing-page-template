import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import type { ReactNode } from "react";
import {
  buildMetadata,
  Analytics,
  ConsentBanner,
  ConsentProvider,
  Footer,
  getDictionary,
  Header,
  isHeroOnly,
  localesOf,
  Pixels,
  themeStyle,
} from "@landing/kit";
import { registry } from "@/config";
import { getTenantLocale, type RouteParams } from "@/lib/tenant";

/**
 * SF Pro is not self-hosted: Apple's licence limits that font mainly to app interfaces on
 * Apple platforms (spec §8). Both faces are self-hosted through `next/font`, so they make no
 * third-party request and are unaffected by the consent gate.
 *
 * `latin-ext` is not optional: `ğ`, `ş` and `ı` live there, and without it every Turkish
 * heading falls back to a system font mid-sentence. `next/font` emits one `@font-face` per
 * subset with a `unicode-range`, so an English page never downloads it.
 */
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
  // Not preloaded. `preload` emits a <link rel=preload> for every declared subset, so declaring
  // `latin-ext` for Turkish would put a file an English page never renders on the critical path.
  // The browser fetches only the subsets its `unicode-range` actually matches, and `swap` means
  // text is visible in the fallback until then.
  preload: false,

  // Only the weights the design uses, so the variable font subset stays small.
  weight: ["400", "500", "600", "700"],
  // Trims the metric mismatch between Inter and the fallback, so text does not shift when the
  // webfont lands.
  adjustFontFallback: true,
});

/**
 * Display face for headings. Outfit is geometric where Inter is neo-grotesque, which is what
 * gives a heading set in it a different voice from the paragraph under it rather than just a
 * larger size. One weight only — 600 — because that is the single weight the headings use, and
 * a display face carrying unused weights is bytes on the critical path for nothing.
 */
const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-outfit",
  preload: false,
  weight: ["600"],
  adjustFontFallback: true,
});

export function generateStaticParams({ params }: { params: { tenant: string } }) {
  const config = registry.bySlug.get(params.tenant);
  return config ? localesOf(config).map((locale) => ({ locale })) : [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { config, locale } = await getTenantLocale(params);
  return buildMetadata(config, { locale });
}

export async function generateViewport({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Viewport> {
  const { config } = await getTenantLocale(params);
  return {
    themeColor: config.theme.mode === "dark" ? "#000000" : "#ffffff",
    colorScheme: config.theme.mode,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<RouteParams>;
}) {
  const { config, locale, basePath } = await getTenantLocale(params);
  const dict = getDictionary(locale);

  return (
    <html
      lang={locale}
      dir={dict.direction}
      data-mode={config.theme.mode}
      style={themeStyle(config)}
      className={`${inter.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col">
        <ConsentProvider>
          <a
            href={`${basePath}#main`}
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg"
          >
            {dict.nav.skipToContent}
          </a>
          <Header config={config} locale={locale} basePath={basePath} />
          {/* A hero-only page centres in whatever height is left; a longer one just flows. */}
          <div
            id="main"
            className={isHeroOnly(config) ? "flex flex-1 flex-col justify-center" : "flex-1"}
          >
            {children}
          </div>
          <Footer
            config={config}
            locale={locale}
            basePath={basePath}
            variant={isHeroOnly(config) ? "minimal" : "full"}
          />
          <ConsentBanner attribution={config.attribution} locale={locale} basePath={basePath} />
          <Pixels attribution={config.attribution} />
          <Analytics features={config.features} />
        </ConsentProvider>
      </body>
    </html>
  );
}
