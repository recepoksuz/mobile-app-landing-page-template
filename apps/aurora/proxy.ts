import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, localeRedirectFor, matchRedirect, splitLocale } from "@landing/kit";
import { config as appConfig } from "./config";

/**
 * A graduated app resolves no tenant, but it still has to fill in the default locale — the
 * default language stays unprefixed in public URLs (`/privacy`) while being a real segment
 * internally (`/en/privacy`), exactly as in `apps/multi`. Keeping the two on one mechanism is
 * what makes graduation a DNS change rather than a rewrite.
 *
 * Config redirects live here too: `next.config.ts` is compiled to CommonJS before the bundler
 * runs, so it cannot import the landing-kit barrel.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const redirect = matchRedirect(appConfig, pathname);
  if (redirect) {
    return NextResponse.redirect(new URL(redirect.to, request.url), redirect.status);
  }

  // A first-time visitor whose device is set to a language we publish is sent there once, from
  // the site root only. Deep links, crawlers and anyone who has already chosen are left alone.
  const preferred = localeRedirectFor({
    config: appConfig,
    pathname,
    acceptLanguage: request.headers.get("accept-language"),
    userAgent: request.headers.get("user-agent"),
    cookieLocale: request.cookies.get(LOCALE_COOKIE)?.value,
  });

  if (preferred) {
    const to = NextResponse.redirect(new URL(`/${preferred}${search}`, request.url), 307);
    to.cookies.set(LOCALE_COOKIE, preferred, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return to;
  }

  const { locale, path, redundantPrefix } = splitLocale(appConfig, pathname);

  // The default locale is unprefixed, so `/en/privacy` is a duplicate of `/privacy`. Redirect
  // instead of serving both — a canonical tag only asks, a 308 removes the duplicate.
  if (redundantPrefix) {
    return NextResponse.redirect(new URL(path + search, request.url), 308);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${path === "/" ? "" : path}`;
  url.search = search;

  const response = NextResponse.rewrite(url);
  response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|apps/|\\.well-known|robots\\.txt|sitemap\\.xml|favicon\\.ico).*)",
  ],
};
