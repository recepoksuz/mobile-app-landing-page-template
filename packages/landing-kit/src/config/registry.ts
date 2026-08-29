import type { AppConfig } from "./schema";

export type TenantRegistry = {
  /** Host (lowercase, no port) -> config */
  byHost: ReadonlyMap<string, AppConfig>;
  bySlug: ReadonlyMap<string, AppConfig>;
  all: readonly AppConfig[];
};

/** Reduces the Host header to a lookup key: lowercase, no port, no trailing dot. */
export function normalizeHost(host: string | null | undefined): string {
  if (!host) return "";
  return host.trim().toLowerCase().split(":")[0]?.replace(/\.$/, "") ?? "";
}

/**
 * Maps the canonical domain, the www variant and `{slug}.localhost` (local development) keys
 * for every tenant. Throws if the same host is bound to two tenants — better that than
 * silently serving the wrong tenant.
 */
export function createTenantRegistry(configs: readonly AppConfig[]): TenantRegistry {
  const byHost = new Map<string, AppConfig>();
  const bySlug = new Map<string, AppConfig>();

  for (const config of configs) {
    if (bySlug.has(config.slug)) {
      throw new Error(`Tenant slug defined twice: "${config.slug}"`);
    }
    bySlug.set(config.slug, config);

    const hosts = [config.domain, `www.${config.domain}`, `${config.slug}.localhost`];

    for (const host of hosts) {
      const key = normalizeHost(host);
      const existing = byHost.get(key);
      if (existing && existing.slug !== config.slug) {
        throw new Error(
          `Host "${key}" is bound to two tenants at once: "${existing.slug}" and "${config.slug}"`,
        );
      }
      byHost.set(key, config);
    }
  }

  return { byHost, bySlug, all: configs };
}

/**
 * Hosts the platform itself hands out: local development and the `*.vercel.app` names Vercel
 * generates for a deployment.
 *
 * These are the only hosts a fallback tenant may be served on. The distinction that matters is
 * who controls the name: nobody can point a `*.vercel.app` host at your deployment — Vercel
 * assigns it to your project — whereas anyone can aim a custom domain at it. That is exactly
 * the case the unknown-host 404 exists to stop.
 */
export function isPlatformHost(host: string | null | undefined): boolean {
  const key = normalizeHost(host);
  return (
    key === "localhost" ||
    key.endsWith(".localhost") ||
    key === "127.0.0.1" ||
    key.endsWith(".vercel.app")
  );
}

/**
 * Resolves a tenant from the host.
 *
 * A canonical host wins outright. Failing that, `fallbackSlug` applies **only on a platform
 * host** — so a deployment can be viewed on its generated URL before DNS is pointed at it,
 * while a stray custom domain still resolves to nothing and 404s.
 *
 * Gating on the host rather than on `NODE_ENV` is deliberate: it means no environment variable,
 * however it is set, can make this deployment answer for a domain that is not configured here.
 */
export function resolveTenant(
  registry: TenantRegistry,
  host: string | null | undefined,
  fallbackSlug?: string,
): AppConfig | undefined {
  const direct = registry.byHost.get(normalizeHost(host));
  if (direct) return direct;
  if (fallbackSlug && isPlatformHost(host)) return registry.bySlug.get(fallbackSlug);
  return undefined;
}
