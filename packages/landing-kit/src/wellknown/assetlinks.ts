import type { AppConfig } from "../config/schema";

export type AssetLinks = Array<{
  relation: string[];
  target: { namespace: string; package_name: string; sha256_cert_fingerprints: string[] };
}>;

/**
 * Without fingerprints Android App Links cannot be verified; instead of serving an empty
 * array we return `null` and the route 404s.
 */
export function buildAssetLinks(config: AppConfig): AssetLinks | null {
  const android = config.store.android;
  if (!android?.sha256Fingerprints?.length) return null;

  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: android.packageName,
        sha256_cert_fingerprints: android.sha256Fingerprints.map((fp) => fp.toUpperCase()),
      },
    },
  ];
}
