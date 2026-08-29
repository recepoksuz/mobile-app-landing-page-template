"use client";

import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

import type { AppConfig } from "../config/schema";
import { useConsent } from "../tracking/ConsentProvider";
import { reportStoreClick } from "../tracking/conversion";

/**
 * Parameters worth carrying from the landing page into `/go/...`.
 *
 * An allow-list, not "everything": the destination is an AppsFlyer OneLink, and forwarding
 * arbitrary query strings from a URL a stranger can craft would let anyone put whatever they
 * like into someone else's attribution data.
 */
const FORWARDED = /^(utm_|af_)|^(pid|c)$/;

function withForwardedParams(href: string, current: URLSearchParams): string {
  const [path, own = ""] = href.split("?");
  const params = new URLSearchParams(own);

  for (const [key, value] of current) {
    // The link's own parameters win: `?store=ios` says which badge was clicked, and no
    // incoming query string should be able to change that.
    if (FORWARDED.test(key) && !params.has(key)) params.set(key, value);
  }

  const query = params.toString();
  return query ? `${path}?${query}` : (path as string);
}

function Forwarding({
  href,
  className,
  children,
  conversion,
  ...rest
}: LinkProps) {
  const current = useSearchParams();

  return (
    <Link
      href={withForwardedParams(href, current)}
      className={className}
      onClick={conversion}
      {...rest}
    >
      {children}
    </Link>
  );
}

type LinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  /** Fired on click. Undefined when there is nothing to report or no consent to report it. */
  conversion?: () => void;
} & Record<string, unknown>;

/**
 * A link into `/go/...` that carries the campaign parameters the visitor arrived with.
 *
 * The gap this closes: an ad usually points at the landing page, not at `/go/...` directly, so
 * someone arrives at `/?utm_source=meta&utm_campaign=summer`, reads, then taps a store badge.
 * Without this the badge linked to a bare `/go/hero` and the route saw `pid=web` — the campaign
 * that paid for the click was lost between the two clicks, and every install looked organic.
 *
 * Read on the client rather than from the page's `searchParams`, which would opt every landing
 * page out of static generation for a value only the visitor's own click needs.
 *
 * The fallback is the plain link. Before hydration, without JavaScript, or for a crawler, the
 * badge still points at `/go/...` and still routes to the right store — it just arrives without
 * attribution, which is exactly what it did before this existed.
 */
export function AttributionLink({
  href,
  className,
  children,
  attribution,
  store,
  ...rest
}: {
  href: string;
  className?: string;
  children: ReactNode;
  /** Given only by a link that is a conversion; omitted, the click reports nothing. */
  attribution?: AppConfig["attribution"];
  store?: "ios" | "android";
} & Record<string, unknown>) {
  const { consent } = useConsent();

  // Built here rather than inside `Forwarding` so the pre-hydration fallback link reports too.
  // The guard is the same one `Pixels` uses: without granted consent no pixel script has
  // loaded, so there would be nothing to report to even if this tried.
  const conversion =
    attribution && store && consent === "granted"
      ? () => reportStoreClick(attribution, store)
      : undefined;

  return (
    <Suspense
      fallback={
        <Link href={href} className={className} onClick={conversion} {...rest}>
          {children}
        </Link>
      }
    >
      <Forwarding href={href} className={className} conversion={conversion} {...rest}>
        {children}
      </Forwarding>
    </Suspense>
  );
}
