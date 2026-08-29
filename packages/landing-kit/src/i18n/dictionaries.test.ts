import { describe, expect, it } from "vitest";
import { dictionaries } from "./resolve";
import type { Dictionary } from "./types";

/** Every leaf path in an object, e.g. "nav.menu". */
function paths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    paths(child, prefix ? `${prefix}.${key}` : key),
  );
}

const english = dictionaries.en as Dictionary;
const expected = paths(english).sort();

describe("dictionaries", () => {
  it.each(Object.keys(dictionaries))("%s has every key English has", (locale) => {
    // A missing key would render as `undefined` in the page rather than falling back, so the
    // shape is checked here instead of being discovered in production.
    expect(paths(dictionaries[locale]).sort()).toEqual(expected);
  });

  it.each(Object.keys(dictionaries))("%s leaves no value blank", (locale) => {
    const blanks = paths(dictionaries[locale]).filter((path) => {
      const value = path
        .split(".")
        .reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], dictionaries[locale]);
      return typeof value !== "string" || value.trim() === "";
    });

    expect(blanks).toEqual([]);
  });

  it.each(Object.keys(dictionaries))("%s keeps the placeholders English declares", (locale) => {
    const placeholders = (text: string) => (text.match(/\{(\w+)\}/g) ?? []).sort();

    for (const path of expected) {
      const read = (dict: unknown) =>
        path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], dict);

      // Dropping a `{name}` in a translation silently loses the app name from the sentence.
      expect({ path, of: placeholders(read(dictionaries[locale]) as string) }).toEqual({
        path,
        of: placeholders(read(english) as string),
      });
    }
  });

  it("declares its own locale tag consistently", () => {
    for (const [code, dict] of Object.entries(dictionaries)) {
      expect(dict.locale).toBe(code);
    }
  });
});
