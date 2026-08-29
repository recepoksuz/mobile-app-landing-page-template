"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { getDictionary } from "../i18n/resolve";
import type { Dictionary, Locale } from "../i18n/types";
import { detectPlatform, type Platform } from "../platform/detect";

type CtaButtonProps = {
  locale: Locale;
  /** Path prefix for the locale, so the CTA stays inside the visitor's language. */
  basePath?: string;
  campaign?: string;
  className?: string;
};

function label(dict: Dictionary, platform: Platform): string {
  if (platform === "ios") return dict.cta.ios;
  if (platform === "android") return dict.cta.android;
  return dict.cta.generic;
}

/** Cihaz oturum boyunca değişmez; abone olunacak bir şey yok. */
const noopSubscribe = () => () => {};
const clientPlatform = (): Platform => detectPlatform(navigator.userAgent);
const serverPlatform = (): Platform => "desktop";

function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-7 shrink-0" fill="currentColor" aria-hidden="true">
      <path d="M16.36 12.78c.02-2.02 1.65-2.99 1.72-3.04-.94-1.37-2.4-1.56-2.92-1.58-1.24-.13-2.42.73-3.05.73-.63 0-1.6-.71-2.63-.69-1.35.02-2.6.79-3.29 2-1.4 2.44-.36 6.04 1.01 8.02.67.97 1.47 2.06 2.51 2.02 1.01-.04 1.39-.65 2.61-.65s1.56.65 2.63.63c1.09-.02 1.77-.99 2.43-1.96.77-1.12 1.09-2.21 1.1-2.27-.02-.01-2.11-.81-2.13-3.21zM14.39 6.9c.55-.68.93-1.6.83-2.53-.8.03-1.79.54-2.36 1.2-.51.59-.96 1.54-.84 2.44.9.07 1.81-.46 2.37-1.11z" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-7 shrink-0" aria-hidden="true">
      <path d="M4 3.5v17a1 1 0 0 0 1.5.87l12-8.5a1 1 0 0 0 0-1.74l-12-8.5A1 1 0 0 0 4 3.5z" fill="currentColor" />
    </svg>
  );
}

/**
 * Spec §7: a single CTA. Two store buttons never sit side by side — a desktop visitor handed a
 * store link is a dead click, and on mobile only one of the two is ever the right one.
 *
 * The reference site does show both badges; that is one of the places the spec deliberately
 * departs from it (spec §11, "no multiple CTAs").
 *
 * The server picks the destination: the button always goes to `/go/[campaign]`, which redirects
 * to OneLink or the store based on the UA, or returns a QR page on desktop. It therefore works
 * with JavaScript disabled; only the label personalises after hydration.
 *
 * The badge is drawn rather than using Apple's and Google's official artwork, which comes with
 * its own placement and licensing rules.
 */
export function CtaButton({ locale, basePath = "", campaign = "web", className = "" }: CtaButtonProps) {
  const dict = getDictionary(locale);
  const platform = useSyncExternalStore(noopSubscribe, clientPlatform, serverPlatform);

  return (
    <Link
      href={`${basePath}/go/${campaign}`}
      prefetch={false}
      className={`inline-flex h-[70px] w-[200px] items-center justify-center gap-3 rounded-[14px] border border-white/25 bg-black px-5 text-fg transition-colors hover:border-white/50 ${className}`}
    >
      {platform === "android" ? <PlayGlyph /> : <AppleGlyph />}
      <span className="text-[1.0625rem] font-semibold leading-tight tracking-tight">
        {label(dict, platform)}
      </span>
    </Link>
  );
}
