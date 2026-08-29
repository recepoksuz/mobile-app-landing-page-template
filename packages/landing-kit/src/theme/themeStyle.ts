import type { CSSProperties } from "react";
import type { AppConfig } from "../config/schema";

/** #rgb → #rrggbb */
function expandHex(hex: string): string {
  if (hex.length !== 4) return hex;
  const [, r, g, b] = hex;
  return `#${r}${r}${g}${g}${b}${b}`;
}

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const value = Number.parseInt(expandHex(hex).slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** WCAG contrast ratio between two colors (1–21). */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Picks the text color on top of the accent by contrast (targeting WCAG AA).
 * Since the accent is a single flat color, the body-text threshold (4.5:1) applies.
 */
function readableOn(hex: string): string {
  return contrastRatio("#ffffff", hex) >= 4.5 ? "#ffffff" : "#09090b";
}

/**
 * Emits the tenant theme as inline CSS variables on `<html>`.
 * Because we never generate a separate stylesheet, the build output is the same for every tenant.
 */
export function themeStyle(config: AppConfig): CSSProperties {
  return {
    "--tenant-accent": config.theme.accent,
    "--tenant-accent-fg": readableOn(config.theme.accent),
  } as CSSProperties;
}

export { readableOn };
