import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, localeRedirectFor, matchRedirect, normalizeHost, splitLocale } from "@landing/kit";
import { fallbackSlug, registry } from "./config";

/**
 * Host -> tenant resolution (spec §2). The visitor sees `aurora.example/privacy`; internally the
 * app renders `/aurora/en/privacy`. Neither the tenant nor the default locale ever appears in a
 * public URL, which is why moving an app to its own deploy (graduation) does not change a
 * single URL — and why adding a second language does not invalidate the links already filed
 * with the App Store.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = normalizeHost(request.headers.get("host"));

  const tenant =
    registry.byHost.get(host) ?? (fallbackSlug ? registry.bySlug.get(fallbackSlug) : undefined);

  if (!tenant) {
    // Unknown host: do not serve any tenant's content.
    return new NextResponse("Not found", { status: 404 });
  }

  // Redirects declared in the config are applied before the rewrite: the target path is one of
  // the tenant's own paths too, so the next request enters the normal flow.
  const redirect = matchRedirect(tenant, pathname);
  if (redirect) {
    return NextResponse.redirect(new URL(redirect.to, request.url), redirect.status);
  }

  // Tenant isolation: `aurora.example/atlas/privacy` must not work. Requesting the internal
  // path from outside would mean one tenant serving another's content.
  const firstSegment = pathname.split("/")[1];
  if (firstSegment && registry.bySlug.has(firstSegment)) {
    return new NextResponse("Not found", { status: 404 });
  }

  // `www` and the apex would otherwise serve identical pages under two hosts. A canonical tag
  // asks search engines to pick one; a 308 removes the duplicate outright, and keeps ad clicks
  // that landed on `www` from splitting the domain's signals.
  if (host === `www.${tenant.domain}`) {
    const apex = new URL(pathname + search, `https://${tenant.domain}`);
    return NextResponse.redirect(apex, 308);
  }

  // The default locale is unprefixed in public URLs but is a real segment internally, so it is
  // filled in here rather than duplicated as a second route tree.
  // A first-time visitor whose device is set to a language we publish is sent there once, from
  // the site root only. Deep links, crawlers and anyone who has already chosen are left alone.
  const preferred = localeRedirectFor({
    config: tenant,
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

  const { locale, path, redundantPrefix } = splitLocale(tenant, pathname);

  // The default locale is unprefixed, so `/en/privacy` is a duplicate of `/privacy`. Redirect
  // instead of serving both — a canonical tag only asks, a 308 removes the duplicate.
  if (redundantPrefix) {
    return NextResponse.redirect(new URL(path + search, request.url), 308);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${tenant.slug}/${locale}${path === "/" ? "" : path}`;
  url.search = search;

  const response = NextResponse.rewrite(url);
  response.headers.set("x-tenant-slug", tenant.slug);
  response.headers.set("x-tenant-locale", locale);
  // Remember the language actually served, so the redirect never fires twice and a visitor who
  // navigates to another language keeps it.
  response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return response;
}

export const config = {
  matcher: [
    /*
     * Every path except these:
     * - _next/static, _next/image : build output
     * - apps/                     : tenant images under public/
     * - .well-known               : the root route handlers read the host themselves
     * - robots.txt, sitemap.xml   : the root metadata routes read the host themselves
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|apps/|\\.well-known|robots\\.txt|sitemap\\.xml|favicon\\.ico).*)",
  ],
};
