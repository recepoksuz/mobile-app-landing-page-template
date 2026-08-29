import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { assetDataUri } from "./asset-data-uri";

let root: string;

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), "landing-assets-"));
  await mkdir(path.join(root, "acme"), { recursive: true });
  await writeFile(path.join(root, "acme", "icon.svg"), "<svg/>");
  await writeFile(path.join(root, "acme", "icon.png"), Buffer.from([0x89, 0x50]));
});

describe("assetDataUri", () => {
  it("inlines an SVG with the right mime type", async () => {
    const uri = await assetDataUri("/apps/acme/icon.svg", root);
    expect(uri).toBe(`data:image/svg+xml;base64,${Buffer.from("<svg/>").toString("base64")}`);
  });

  it("inlines a PNG with the right mime type", async () => {
    expect(await assetDataUri("/apps/acme/icon.png", root)).toMatch(/^data:image\/png;base64,/);
  });

  it("returns undefined for a file that does not exist", async () => {
    // The OG image must be producible without an icon; a missing file must not fail the request.
    expect(await assetDataUri("/apps/acme/missing.svg", root)).toBeUndefined();
  });

  it("returns undefined for an unsupported extension", async () => {
    expect(await assetDataUri("/apps/acme/icon.ico", root)).toBeUndefined();
  });

  it("rejects a path that escapes the root directory", async () => {
    expect(await assetDataUri("/apps/../../etc/hosts.png", root)).toBeUndefined();
  });
});
