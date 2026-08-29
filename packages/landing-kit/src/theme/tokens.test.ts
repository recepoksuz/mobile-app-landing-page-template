import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./themeStyle";

const css = readFileSync(path.join(import.meta.dirname, "tokens.css"), "utf8");

/** Pulls out the default in the `--color-x: var(--tenant-x, #hex)` form. */
function tokenDefault(name: string): string {
  const match = css.match(new RegExp(`--color-${name}:\\s*var\\(--tenant-${name},\\s*(#[0-9a-fA-F]{3,6})\\)`));
  if (!match?.[1]) throw new Error(`token not found: --color-${name}`);
  return match[1];
}

/** Pulls out the override in the `:root[data-mode="light"]` block. */
function lightToken(name: string): string {
  const block = css.match(/:root\[data-mode="light"\]\s*\{([^}]*)\}/)?.[1] ?? "";
  const match = block.match(new RegExp(`--tenant-${name}:\\s*(#[0-9a-fA-F]{3,6})`));
  if (!match?.[1]) throw new Error(`light token not found: --tenant-${name}`);
  return match[1];
}

/**
 * Acceptance criterion 8: Accessibility 100. This test is a barrier against exactly the
 * regression Lighthouse catches — if the muted text color drops below AA against the
 * background, it fails here rather than in the browser.
 */
describe("design tokens meet WCAG AA", () => {
  it("body text has enough contrast against the background in dark mode", () => {
    expect(contrastRatio(tokenDefault("fg"), tokenDefault("bg"))).toBeGreaterThanOrEqual(4.5);
  });

  it("muted text has enough contrast against the background in dark mode", () => {
    expect(contrastRatio(tokenDefault("muted"), tokenDefault("bg"))).toBeGreaterThanOrEqual(4.5);
  });

  it("muted text is sufficient on top of surface too in dark mode", () => {
    // The features and steps sections use the surface background.
    expect(contrastRatio(tokenDefault("muted"), tokenDefault("surface"))).toBeGreaterThanOrEqual(4.5);
  });

  it("body and muted text have enough contrast in light mode", () => {
    expect(contrastRatio(lightToken("fg"), lightToken("bg"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightToken("muted"), lightToken("bg"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightToken("muted"), lightToken("surface"))).toBeGreaterThanOrEqual(4.5);
  });
});
