import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { beforeAll, describe, expect, it, vi } from "vitest";

let root: string;

function png(width: number, height: number): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(body) >>> 0);
    return Buffer.concat([length, body, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function jpeg(width: number, height: number): Buffer {
  const sof = Buffer.alloc(11);
  sof.writeUInt16BE(0xffc0, 0);
  sof.writeUInt16BE(9, 2);
  sof[4] = 8;
  sof.writeUInt16BE(height, 5);
  sof.writeUInt16BE(width, 7);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]);
}

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), "landing-images-"));
  await mkdir(path.join(root, "public", "apps", "acme"), { recursive: true });

  const dir = path.join(root, "public", "apps", "acme");
  // A real iPhone 15 Pro Max screenshot.
  await writeFile(path.join(dir, "shot.png"), png(1290, 2796));
  await writeFile(path.join(dir, "photo.jpg"), jpeg(1179, 2556));
  await writeFile(
    path.join(dir, "mock.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 1540"></svg>',
  );
  await writeFile(
    path.join(dir, "sized.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="800"></svg>',
  );
  await writeFile(path.join(dir, "broken.png"), Buffer.from("not really a png"));

  vi.spyOn(process, "cwd").mockReturnValue(root);
});

async function size(assetPath: string) {
  // The module reads `process.cwd()` once at load time, so it is imported after the spy.
  const { imageSize } = await import("./image-size");
  return imageSize(assetPath);
}

describe("imageSize", () => {
  it("reads a PNG header", async () => {
    // Real store screenshots are whatever the device exported; typing those into a config is
    // one more thing to get silently wrong, and a wrong ratio distorts the hero.
    expect(await size("/apps/acme/shot.png")).toEqual({ width: 1290, height: 2796 });
  });

  it("reads a JPEG SOF marker", async () => {
    expect(await size("/apps/acme/photo.jpg")).toEqual({ width: 1179, height: 2556 });
  });

  it("prefers an SVG viewBox", async () => {
    expect(await size("/apps/acme/mock.svg")).toEqual({ width: 760, height: 1540 });
  });

  it("falls back to SVG width/height attributes", async () => {
    expect(await size("/apps/acme/sized.svg")).toEqual({ width: 400, height: 800 });
  });

  it("returns undefined for a file it cannot parse", async () => {
    expect(await size("/apps/acme/broken.png")).toBeUndefined();
  });

  it("returns undefined for a missing file", async () => {
    expect(await size("/apps/acme/nope.png")).toBeUndefined();
  });

  it("refuses to escape the assets directory", async () => {
    expect(await size("/apps/../../etc/hosts.png")).toBeUndefined();
  });
});
