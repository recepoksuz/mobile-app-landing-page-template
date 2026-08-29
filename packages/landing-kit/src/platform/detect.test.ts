import { describe, expect, it } from "vitest";
import { detectPlatform } from "./detect";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1";
const IPAD_LEGACY =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const IPADOS_DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";
const MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

describe("detectPlatform", () => {
  it.each([
    ["iPhone", IPHONE, "ios"],
    ["iPad", IPAD_LEGACY, "ios"],
    ["Android", ANDROID, "android"],
    ["macOS", MAC, "desktop"],
    ["Windows", WINDOWS, "desktop"],
  ])("%s -> %s", (_label, ua, expected) => {
    expect(detectPlatform(ua)).toBe(expected);
  });

  it("counts iPadOS's desktop-disguised UA as iOS", () => {
    // iPadOS 13+ Safari advertises itself as "Macintosh"; the "Mobile" hint tells them apart.
    expect(detectPlatform(IPADOS_DESKTOP_UA)).toBe("ios");
  });

  it("still detects Android correctly on a UA containing 'like Mac OS X'", () => {
    expect(detectPlatform("Mozilla/5.0 (Linux; Android 13; like Mac OS X) Mobile")).toBe("android");
  });

  it("assumes desktop when there is no UA", () => {
    expect(detectPlatform(null)).toBe("desktop");
    expect(detectPlatform("")).toBe("desktop");
  });
});
