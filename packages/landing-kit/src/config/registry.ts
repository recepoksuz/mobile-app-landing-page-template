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
 * Resolves a tenant from the host. In preview/deploy environments (a Vercel preview URL, plain
 * `localhost`) the canonical host will not match, so `fallbackSlug` takes over.
 */
export function resolveTenant(
  registry: TenantRegistry,
  host: string | null | undefined,
  fallbackSlug?: string,
): AppConfig | undefined {
  const direct = registry.byHost.get(normalizeHost(host));
  if (direct) return direct;
  if (fallbackSlug) return registry.bySlug.get(fallbackSlug);
  return undefined;
}
