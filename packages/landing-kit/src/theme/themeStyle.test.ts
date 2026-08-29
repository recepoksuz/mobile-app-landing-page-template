import { describe, expect, it } from "vitest";
import { defineAppConfig } from "../config/define";
import { validConfigInput } from "../config/fixtures";
import { readableOn, themeStyle } from "./themeStyle";

describe("readableOn", () => {
  it("picks white on a dark accent", () => {
    expect(readableOn("#1d4ed8")).toBe("#ffffff");
  });

  it("picks dark on a light accent", () => {
    expect(readableOn("#fde047")).toBe("#09090b");
  });

  it("expands short hex", () => {
    expect(readableOn("#fff")).toBe("#09090b");
    expect(readableOn("#000")).toBe("#ffffff");
  });
});

describe("themeStyle", () => {
  it("exposes the accent and the readable text color as CSS variables", () => {
    // On #f63a80 white gives only 3.6:1 (below AA), while dark gives 5.8:1.
    // For the Accessibility 100 target, contrast wins over the design preference.
    const style = themeStyle(defineAppConfig(validConfigInput)) as Record<string, string>;
    expect(style["--tenant-accent"]).toBe("#f63a80");
    expect(style["--tenant-accent-fg"]).toBe("#09090b");
  });
});
