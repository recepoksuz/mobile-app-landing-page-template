import { describe, expect, it } from "vitest";
import { defineAppConfig } from "./define";
import { validConfigInput } from "./fixtures";
import { createTenantRegistry, isPlatformHost, normalizeHost, resolveTenant } from "./registry";

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

  it("falls back to the fallback slug on a Vercel deployment host", () => {
    // Nobody else can point a `*.vercel.app` name at this deployment, so serving a designated
    // tenant there is safe — and it is the only way to open a deploy before DNS exists.
    expect(resolveTenant(registry, "preview-abc.vercel.app", "beta")?.slug).toBe("beta");
  });

  it("falls back on local development hosts", () => {
    expect(resolveTenant(registry, "localhost", "beta")?.slug).toBe("beta");
    expect(resolveTenant(registry, "127.0.0.1:3100", "beta")?.slug).toBe("beta");
  });

  it("refuses the fallback on a custom domain, whatever the fallback says", () => {
    // The invariant: a domain someone aimed at this deployment serves nothing. If the fallback
    // applied here, that domain would render another tenant's page under its own host —
    // duplicate content pointing at a canonical it does not own.
    expect(resolveTenant(registry, "unknown.example", "beta")).toBeUndefined();
    expect(resolveTenant(registry, "www.someone-elses-domain.com", "beta")).toBeUndefined();
  });

  it("prefers a real tenant host over the fallback", () => {
    expect(resolveTenant(registry, "www.beta.app", "acme")?.slug).toBe("beta");
  });
});

describe("isPlatformHost", () => {
  it("accepts hosts the platform hands out", () => {
    for (const host of [
      "localhost",
      "aurora.localhost",
      "127.0.0.1",
      "my-app.vercel.app",
      "my-app-git-branch-team.vercel.app",
    ]) {
      expect(isPlatformHost(host), host).toBe(true);
    }
  });

  it("rejects anything a third party could point here", () => {
    for (const host of [
      "beta.app",
      "www.beta.app",
      "example.com",
      // Not a Vercel host: the suffix has to be the actual domain, not part of a longer label.
      "notvercel.app",
      "evil-vercel.app",
      "vercel.app.attacker.com",
      "",
    ]) {
      expect(isPlatformHost(host), host).toBe(false);
    }
  });
});
