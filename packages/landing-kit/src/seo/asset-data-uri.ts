import { readFile } from "node:fs/promises";
import path from "node:path";

const MIME_BY_EXT: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

/**
 * Root directory for tenant assets. Pinning it to a static subfolder matters: if the
 * bundler sees a dynamic base it packages the whole `public/` tree into the server code
 * and the deploy size balloons.
 */
const ASSETS_ROOT = path.join(process.cwd(), "public", "apps");

/**
 * Turns an asset under `public/apps/{slug}/…` into a data URI.
 *
 * `ImageResponse` (satori) cannot draw SVGs from external URLs, and making a network
 * request on every render would make OG generation depend on the site itself. Reading
 * from disk and inlining solves both.
 *
 * Returns `undefined` when the file cannot be read — the OG image is then produced
 * without an icon instead of failing.
 *
 * @param assetPath the path from config, e.g. `/apps/aurora/icon.svg`
 * @param root for overriding in tests; always `public/apps` in production
 */
export async function assetDataUri(
  assetPath: string,
  root: string = ASSETS_ROOT,
): Promise<string | undefined> {
  const mime = MIME_BY_EXT[path.extname(assetPath).toLowerCase()];
  if (!mime) return undefined;

  const relative = path.posix.normalize(assetPath).replace(/^\/apps\//, "");
  const resolved = path.resolve(root, relative);

  // A path that escapes the root directory means a mistake in config; do not read it.
  if (!resolved.startsWith(path.resolve(root) + path.sep)) return undefined;

  try {
    const buffer = await readFile(resolved);
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return undefined;
  }
}
