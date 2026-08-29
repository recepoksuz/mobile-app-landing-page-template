export type Platform = "ios" | "android" | "desktop";

/**
 * A crude but sufficient detection for store redirection. The goal is to send people to the
 * right store; iPadOS Safari advertises itself as a desktop, which is why touch-capable Macs
 * count as iOS too (the App Store link is the right target there as well).
 */
export function detectPlatform(userAgent: string | null | undefined): Platform {
  const ua = (userAgent ?? "").toLowerCase();
  if (!ua) return "desktop";

  // Check Android first: some Android UAs contain "like Mac OS X".
  if (ua.includes("android")) {
    // There is no Android-based desktop browser; cases like Windows Subsystem are negligible.
    return "android";
  }

  if (/iphone|ipod|ipad/.test(ua)) return "ios";

  // iPadOS 13+ Safari advertises itself as "Macintosh"; the touch hint tells them apart.
  if (ua.includes("macintosh") && ua.includes("mobile")) return "ios";

  return "desktop";
}

/**
 * A store the visitor named explicitly by clicking one badge rather than the other.
 *
 * Both badges are shown, so the click carries more information than the user agent does: an
 * Android phone tapping "App Store" wants the App Store. Only the store choice is overridden —
 * a desktop visitor still gets the QR page, because a store link there is a dead click either
 * way.
 */
export function forcedPlatform(value: string | null | undefined): Platform | undefined {
  return value === "ios" || value === "android" ? value : undefined;
}
