/**
 * Config-only entry point, reached as `@landing/kit/config`.
 *
 * A tenant config describes an app; it has no business importing a component library to do it.
 * Going through the main barrel meant it did — which is why validating a config used to need a
 * bundler, and why `next.config.ts` cannot import the barrel at all. This is the same split
 * `./server` already makes, for the same reason.
 */
export { defineAppConfig } from "./define";
export { appConfigSchema, type AppConfig } from "./schema";
export { createTenantRegistry, resolveTenant, normalizeHost, isPlatformHost } from "./registry";
export type { TenantRegistry } from "./registry";
