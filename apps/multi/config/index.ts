import { createTenantRegistry, type AppConfig } from "@landing/kit";
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
 * Fallback for environments where no canonical host matches — plain `localhost`, or a
 * Vercel preview URL.
 *
 * It must stay OFF by default in production. Otherwise any domain someone points at this
 * deploy would silently serve the first tenant's content under the wrong host: wrong
 * canonical, wrong sitemap, duplicate content across two domains. An unknown host has to
 * 404.
 *
 * On preview deployments set `NEXT_PUBLIC_DEFAULT_TENANT` to the slug you want the preview
 * URL to render.
 */
export const fallbackSlug =
  process.env.NEXT_PUBLIC_DEFAULT_TENANT ??
  (process.env.NODE_ENV === "production" ? undefined : tenants[0]?.slug);
