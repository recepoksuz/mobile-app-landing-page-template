import { createTenantRegistry, type AppConfig } from "@landing/kit/config";
import { atlas } from "./atlas";
import { aurora } from "./aurora";

/**
 * Adding a new app: import a config file here and add it to the array, drop in the
 * `public/apps/{slug}/` folder, and create the DNS record. No other file is touched
 * (spec §12, acceptance criterion 1).
 */
export const tenants: readonly AppConfig[] = [aurora, atlas];

export const registry = createTenantRegistry(tenants);

/**
 * Fallback tenant for hosts the platform generates — `localhost` in development, and the
 * `*.vercel.app` name Vercel gives a deployment. It is what lets you open a deploy before DNS
 * points at it.
 *
 * There is no environment check here on purpose. `resolveTenant` refuses to apply a fallback on
 * any host that is not platform-controlled, so a custom domain aimed at this deployment 404s
 * whatever this value is. Safety belongs in one place, not in every consumer's env config.
 */
export const fallbackSlug = process.env.NEXT_PUBLIC_DEFAULT_TENANT ?? tenants[0]?.slug;
