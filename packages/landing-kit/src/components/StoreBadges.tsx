import Link from "next/link";
import type { AppConfig } from "../config/schema";
import { getDictionary } from "../i18n/resolve";
import type { Locale } from "../i18n/types";

function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-7 shrink-0 -translate-y-[1px] md:size-8" fill="currentColor" aria-hidden="true">
      <path d="M16.36 12.78c.02-2.02 1.65-2.99 1.72-3.04-.94-1.37-2.4-1.56-2.92-1.58-1.24-.13-2.42.73-3.05.73-.63 0-1.6-.71-2.63-.69-1.35.02-2.6.79-3.29 2-1.4 2.44-.36 6.04 1.01 8.02.67.97 1.47 2.06 2.51 2.02 1.01-.04 1.39-.65 2.61-.65s1.56.65 2.63.63c1.09-.02 1.77-.99 2.43-1.96.77-1.12 1.09-2.21 1.1-2.27-.02-.01-2.11-.81-2.13-3.21zM14.39 6.9c.55-.68.93-1.6.83-2.53-.8.03-1.79.54-2.36 1.2-.51.59-.96 1.54-.84 2.44.9.07 1.81-.46 2.37-1.11z" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-[26px] shrink-0 md:size-7" aria-hidden="true">
      <path d="M3.6 2.4a1 1 0 0 0-.6.92v17.36a1 1 0 0 0 .6.92l9.5-9.6-9.5-9.6z" fill="#34d399" />
      <path d="M16.9 8.3 13.1 12l3.8 3.7 3.4-1.94a1.2 1.2 0 0 0 0-2.1L16.9 8.3z" fill="#fbbf24" />
      <path d="M3.6 2.4 13.1 12l3.8-3.7L5.1 1.6a1.2 1.2 0 0 0-1.5.8z" fill="#f87171" />
      <path d="M3.6 21.6 13.1 12l3.8 3.7L5.1 22.4a1.2 1.2 0 0 1-1.5-.8z" fill="#60a5fa" />
    </svg>
  );
}

function Badge({
  href,
  top,
  main,
  children,
}: {
  href: string;
  top: string;
  main: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="group inline-flex h-[58px] items-center gap-2.5 rounded-xl border border-white/20 bg-white/[0.04] pl-3.5 pr-4 text-fg transition-[transform,background-color,border-color] duration-200 hover:border-white/40 hover:bg-white/[0.09] active:scale-[0.98] sm:h-[62px] sm:gap-3 sm:pl-4 sm:pr-5 xl:h-[68px] xl:gap-3.5 xl:pl-5 xl:pr-6"
    >
      {children}
      <span className="flex flex-col items-start">
        <span className="text-[0.6875rem] font-medium leading-none tracking-wide text-muted">
          {top}
        </span>
        <span className="mt-[3px] text-base font-semibold leading-tight tracking-[-0.01em] sm:text-[1.0625rem] xl:text-[1.1875rem]">
          {main}
        </span>
      </span>
    </Link>
  );
}

/**
 * One badge per store the app actually ships on.
 *
 * Both badges point at `/go/[campaign]` rather than at the store, with `?store=` naming which
 * one was clicked. That keeps every click inside attribution, and it means a desktop visitor
 * still gets the QR page instead of a store link they cannot install from.
 *
 * This is a deliberate departure from spec §7/§11, which calls for a single device-detected
 * CTA: the reference sites show both badges and that is what was asked for here.
 */
export function StoreBadges({
  config,
  locale,
  basePath = "",
  campaign = "hero",
  className = "",
}: {
  config: AppConfig;
  locale: Locale;
  basePath?: string;
  campaign?: string;
  className?: string;
}) {
  const dict = getDictionary(locale);
  const base = `${basePath}/go/${campaign}`;

  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:justify-start ${className}`}>
      {config.store.ios ? (
        <Badge href={`${base}?store=ios`} top={dict.cta.iosTop} main={dict.cta.ios}>
          <AppleGlyph />
        </Badge>
      ) : null}

      {config.store.android ? (
        <Badge href={`${base}?store=android`} top={dict.cta.androidTop} main={dict.cta.android}>
          <PlayGlyph />
        </Badge>
      ) : null}
    </div>
  );
}
