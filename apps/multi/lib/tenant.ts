import { notFound } from "next/navigation";
import type { AppConfig, Locale } from "@landing/kit";
import { isSupportedLocale, localePath } from "@landing/kit";
import { registry } from "@/config";

export type RouteParams = { tenant: string; locale: string };

/** Resolves the config from the `[tenant]` segment. An unknown slug is a 404. */
export async function getTenant(params: Promise<{ tenant: string }>): Promise<AppConfig> {
  const { tenant } = await params;
  const config = registry.bySlug.get(tenant);
  if (!config) notFound();
  return config;
}

/**
 * Resolves both segments at once, which is what nearly every page needs.
 *
 * `basePath` is the prefix the visitor sees for this locale — empty for the default locale,
 * `/tr` otherwise. Every internal link is built from it so a visitor reading one language is
 * never dropped into another.
 */
export async function getTenantLocale(
  params: Promise<RouteParams>,
): Promise<{ config: AppConfig; locale: Locale; basePath: string }> {
  const { tenant, locale } = await params;

  const config = registry.bySlug.get(tenant);
  if (!config) notFound();
  if (!isSupportedLocale(config, locale)) notFound();

  return { config, locale, basePath: localePath(config, locale, "/").replace(/\/$/, "") };
}

/** Every tenant slug, for static generation. */
export function tenantParams(): Array<{ tenant: string }> {
  return [...registry.bySlug.keys()].map((tenant) => ({ tenant }));
}

/** The "Last updated" date on the legal documents, managed in one place. */
export const LEGAL_UPDATED = "2026-08-29";
