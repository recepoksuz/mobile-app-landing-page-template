import { afterEach, describe, expect, it, vi } from "vitest";
import { defineAppConfig } from "../config/define";
import { validConfigInput } from "../config/fixtures";
import { resolveStoreStats } from "./stats";

function config(patch: (c: typeof validConfigInput) => void) {
  const input = structuredClone(validConfigInput);
  patch(input);
  return defineAppConfig(input);
}

function mockLookup(body: unknown, ok = true) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok,
    json: async () => body,
  } as Response);
}

afterEach(() => vi.restoreAllMocks());

describe("resolveStoreStats", () => {
  it("uses the pinned figures without calling the store", async () => {
    const spy = mockLookup({});
    const stats = await resolveStoreStats(config(() => {}));

    expect(stats).toMatchObject({ rating: 4.7, reviewCount: 12400 });
    expect(spy).not.toHaveBeenCalled();
  });

  it("looks the rating up when it is not pinned", async () => {
    mockLookup({ results: [{ averageUserRating: 4.63219, userRatingCount: 8421 }] });

    const stats = await resolveStoreStats(
      config((c) => {
        delete c.store.rating;
        delete c.store.reviewCount;
      }),
    );

    // Rounded to one decimal, which is how a store displays it.
    expect(stats).toMatchObject({ rating: 4.6, reviewCount: 8421 });
  });

  it("asks the configured storefront", async () => {
    const spy = mockLookup({ results: [{ averageUserRating: 4.5, userRatingCount: 10 }] });

    await resolveStoreStats(
      config((c) => {
        delete c.store.rating;
        delete c.store.reviewCount;
        c.store.ios!.country = "tr";
      }),
    );

    // A rating published for the wrong storefront is simply the wrong number.
    expect(String(spy.mock.calls[0]?.[0])).toContain("country=tr");
  });

  it("returns nothing when the lookup fails, rather than throwing", async () => {
    // A page must still build when a third party is down.
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));

    const stats = await resolveStoreStats(
      config((c) => {
        delete c.store.rating;
        delete c.store.reviewCount;
      }),
    );

    expect(stats.rating).toBeUndefined();
    expect(stats.reviewCount).toBeUndefined();
  });

  it("ignores a half-answer, so aggregateRating is never partial", async () => {
    mockLookup({ results: [{ averageUserRating: 4.8 }] });

    const stats = await resolveStoreStats(
      config((c) => {
        delete c.store.rating;
        delete c.store.reviewCount;
      }),
    );

    expect(stats.rating).toBeUndefined();
  });

  it("treats zero reviews as nothing to show", async () => {
    mockLookup({ results: [{ averageUserRating: 0, userRatingCount: 0 }] });

    const stats = await resolveStoreStats(
      config((c) => {
        delete c.store.rating;
        delete c.store.reviewCount;
      }),
    );

    expect(stats.rating).toBeUndefined();
  });

  it("does not call out when autoFetch is off", async () => {
    const spy = mockLookup({});

    const stats = await resolveStoreStats(
      config((c) => {
        delete c.store.rating;
        delete c.store.reviewCount;
        c.store.autoFetch = false;
      }),
    );

    expect(spy).not.toHaveBeenCalled();
    expect(stats.rating).toBeUndefined();
  });

  it("keeps the download figure, which no API exposes", async () => {
    mockLookup({ results: [{ averageUserRating: 4.5, userRatingCount: 10 }] });

    const stats = await resolveStoreStats(
      config((c) => {
        delete c.store.rating;
        delete c.store.reviewCount;
      }),
    );

    expect(stats.downloads).toBe("2M+");
  });
});
