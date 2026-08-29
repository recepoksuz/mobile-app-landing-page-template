import { open } from "node:fs/promises";
import path from "node:path";

export type ImageSize = { width: number; height: number };

/** Sensible phone-screenshot ratio, used when a file cannot be measured. */
export const FALLBACK_MOCKUP_SIZE: ImageSize = { width: 760, height: 1540 };

const ASSETS_ROOT = path.join(process.cwd(), "public", "apps");

/**
 * Reads the intrinsic dimensions out of an image header.
 *
 * `next/image` needs width and height, and a real store screenshot is whatever the device
 * exported — 1290×2796, 1179×2556, 1284×2778. Making each tenant type those into its config
 * would be one more thing to get silently wrong, and a wrong ratio distorts the hero. Reading
 * the file means dropping a real screenshot in is all there is to it.
 *
 * Only the header is read, never the whole file.
 */
export async function imageSize(assetPath: string): Promise<ImageSize | undefined> {
  const relative = path.posix.normalize(assetPath).replace(/^\/apps\//, "");
  const resolved = path.resolve(ASSETS_ROOT, relative);
  if (!resolved.startsWith(path.resolve(ASSETS_ROOT) + path.sep)) return undefined;

  let handle;
  try {
    handle = await open(resolved, "r");
    const { buffer, bytesRead } = await handle.read(Buffer.alloc(4096), 0, 4096, 0);
    const head = buffer.subarray(0, bytesRead);

    return png(head) ?? gif(head) ?? webp(head) ?? jpeg(head) ?? svg(head);
  } catch {
    return undefined;
  } finally {
    await handle?.close();
  }
}

function png(b: Buffer): ImageSize | undefined {
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return undefined;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function gif(b: Buffer): ImageSize | undefined {
  if (b.length < 10 || b.subarray(0, 3).toString("latin1") !== "GIF") return undefined;
  return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
}

function webp(b: Buffer): ImageSize | undefined {
  if (b.length < 30 || b.subarray(0, 4).toString("latin1") !== "RIFF") return undefined;
  if (b.subarray(8, 12).toString("latin1") !== "WEBP") return undefined;

  const format = b.subarray(12, 16).toString("latin1");
  if (format === "VP8X") {
    return {
      width: 1 + b.readUIntLE(24, 3),
      height: 1 + b.readUIntLE(27, 3),
    };
  }
  if (format === "VP8 ") {
    return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  }
  if (format === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return undefined;
}

function jpeg(b: Buffer): ImageSize | undefined {
  if (b.length < 4 || b.readUInt16BE(0) !== 0xffd8) return undefined;

  let offset = 2;
  while (offset + 9 < b.length) {
    if (b[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = b[offset + 1] ?? 0;
    // SOF0-SOF15, excluding the non-frame markers DHT (c4), JPGA (c8) and DAC (cc).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: b.readUInt16BE(offset + 5), width: b.readUInt16BE(offset + 7) };
    }
    offset += 2 + b.readUInt16BE(offset + 2);
  }
  return undefined;
}

function svg(b: Buffer): ImageSize | undefined {
  const text = b.toString("utf8");
  if (!text.includes("<svg")) return undefined;

  const viewBox = text.match(/viewBox\s*=\s*["']\s*[\d.-]+[ ,]+[\d.-]+[ ,]+([\d.]+)[ ,]+([\d.]+)/i);
  if (viewBox?.[1] && viewBox[2]) {
    return { width: Math.round(Number(viewBox[1])), height: Math.round(Number(viewBox[2])) };
  }

  const width = text.match(/\bwidth\s*=\s*["']([\d.]+)/i);
  const height = text.match(/\bheight\s*=\s*["']([\d.]+)/i);
  if (width?.[1] && height?.[1]) {
    return { width: Math.round(Number(width[1])), height: Math.round(Number(height[1])) };
  }
  return undefined;
}
