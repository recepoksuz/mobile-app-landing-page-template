import { describe, expect, it } from "vitest";
import { defineAppConfig } from "../config/define";
import { validConfigInput } from "../config/fixtures";
import { matchRedirect } from "./redirects";

const config = defineAppConfig({
  ...structuredClone(validConfigInput),
  redirects: [
    { from: "/eula", to: "/terms", permanent: true },
    { from: "/promo/spring", to: "/go/spring", permanent: false },
  ],
});

const noRedirects = defineAppConfig(structuredClone(validConfigInput));

describe("matchRedirect", () => {
  it("returns 308 for a permanent redirect", () => {
    expect(matchRedirect(config, "/eula")).toEqual({ to: "/terms", status: 308 });
  });

  it("returns 307 for a temporary redirect", () => {
    expect(matchRedirect(config, "/promo/spring")).toEqual({ to: "/go/spring", status: 307 });
  });

  it("ignores the trailing slash", () => {
    expect(matchRedirect(config, "/eula/")?.to).toBe("/terms");
  });

  it("returns undefined when nothing matches", () => {
    expect(matchRedirect(config, "/privacy")).toBeUndefined();
  });

  it("does not redirect on a partial match", () => {
    // Pattern support is deliberately absent; /eula-old is a path in its own right.
    expect(matchRedirect(config, "/eula-old")).toBeUndefined();
  });

  it("returns undefined when no redirects are defined at all", () => {
    expect(matchRedirect(noRedirects, "/eula")).toBeUndefined();
  });
});

