import { describe, expect, it } from "vitest";
import { defineAppConfig } from "./define";
import { validConfigInput } from "./fixtures";
import { createTenantRegistry, normalizeHost, resolveTenant } from "./registry";

const acme = defineAppConfig(validConfigInput);
const other = defineAppConfig({
  ...structuredClone(validConfigInput),
  slug: "beta",
  domain: "beta.app",
});

describe("normalizeHost", () => {
  it("drops the port and lowercases", () => {
    expect(normalizeHost("Acme.AI:3000")).toBe("acme.ai");
  });

  it("drops the trailing dot", () => {
    expect(normalizeHost("acme.ai.")).toBe("acme.ai");
  });

  it("returns an empty string for empty input", () => {
    expect(normalizeHost(null)).toBe("");
  });
});

describe("createTenantRegistry", () => {
  const registry = createTenantRegistry([acme, other]);

  it("maps the canonical domain", () => {
    expect(registry.byHost.get("acme.ai")?.slug).toBe("acme");
  });

  it("maps the www variant", () => {
    expect(registry.byHost.get("www.acme.ai")?.slug).toBe("acme");
  });

  it("maps the local development host", () => {
    expect(registry.byHost.get("acme.localhost")?.slug).toBe("acme");
  });

  it("throws when the same slug is defined twice", () => {
    expect(() => createTenantRegistry([acme, acme])).toThrow(/defined twice/);
  });

  it("throws when the same host is bound to two tenants", () => {
    const clash = defineAppConfig({ ...structuredClone(validConfigInput), slug: "clash" });
    expect(() => createTenantRegistry([acme, clash])).toThrow(/two tenants/);
  });
});

describe("resolveTenant", () => {
  const registry = createTenantRegistry([acme, other]);

  it("resolves a known host", () => {
    expect(resolveTenant(registry, "www.beta.app")?.slug).toBe("beta");
  });

  it("returns undefined for an unknown host when there is no fallback", () => {
    expect(resolveTenant(registry, "unknown.example")).toBeUndefined();
  });

  it("falls back to the fallback slug for an unknown host", () => {
    expect(resolveTenant(registry, "preview-abc.vercel.app", "beta")?.slug).toBe("beta");
  });
});
