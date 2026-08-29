import { notFound } from "next/navigation";
import type { AppConfig, Locale } from "@landing/kit";
import { isSupportedLocale, localePath, localesOf } from "@landing/kit";
import { config } from "@/config";

export type RouteParams = { locale: string };

/**
 * A graduated app has no tenant resolution — one config. The surface mirrors `apps/multi` so
 * the pages stay byte-for-byte the same between the two.
 */
export function getTenant(): AppConfig {
  return config;
}

export async function getTenantLocale(
  params: Promise<RouteParams>,
): Promise<{ config: AppConfig; locale: Locale; basePath: string }> {
  const { locale } = await params;
  if (!isSupportedLocale(config, locale)) notFound();

  return { config, locale, basePath: localePath(config, locale, "/").replace(/\/$/, "") };
}

export function localeParams(): Array<{ locale: string }> {
  return localesOf(config).map((locale) => ({ locale }));
}

export const LEGAL_UPDATED = "2026-08-29";
