/**
 * Validates every tenant config, in seconds, without a bundler.
 *
 * Two failures this catches that nothing else does:
 *
 * 1. **A config file that is not registered.** `apps/multi/config/index.ts` has to import each
 *    config and list it in `tenants`. Miss that and nothing complains — the file typechecks,
 *    `next build` succeeds, the test suite passes, and the tenant's domain serves a 404. It is
 *    the one step in adding an app whose omission is completely silent, which makes it the one
 *    worth a check of its own.
 *
 * 2. **A config that does not satisfy the schema.** `defineAppConfig` throws on load, so
 *    `next build` would catch it eventually — but a build is minutes and this is seconds, and a
 *    zod error read straight is more use than the same error inside a bundler's output.
 *
 * Run it directly (`pnpm validate`) after writing a config. `pnpm check` runs it first, so a
 * broken or unregistered tenant fails before the slow tasks start.
 */
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import type { AppConfig } from "../packages/landing-kit/src/config/schema";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const configDir = path.join(root, "apps/multi/config");

const problems: string[] = [];

const files = readdirSync(configDir)
  .filter((file) => file.endsWith(".ts") && file !== "index.ts")
  .map((file) => file.replace(/\.ts$/, ""))
  .sort();

if (files.length === 0) {
  problems.push(`No tenant configs found in apps/multi/config/`);
}

/**
 * Every import here can throw — `defineAppConfig` is meant to, on a bad config. Caught and
 * collected rather than allowed to crash, so one broken tenant does not hide the next one's
 * problem, and so the reader gets the message instead of a stack trace through the loader.
 */
async function load(file: string): Promise<Record<string, unknown> | string> {
  try {
    return (await import(file)) as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return message.replace(/^Invalid AppConfig \(".*?"\):\s*/, "").trim();
  }
}

const index = await load(path.join(configDir, "index.ts"));
if (typeof index === "string") {
  console.error(`\napps/multi/config/index.ts could not be loaded:\n\n  ${index}\n`);
  process.exit(1);
}
const { tenants } = index as { tenants: readonly AppConfig[] };

const registered = new Set(tenants.map((tenant) => tenant.slug));

// Every config file has to be reachable from the registry.
for (const file of files) {
  // Importing it directly also runs its `defineAppConfig`, so an unregistered config is still
  // schema-checked rather than skipped along with its registration.
  const module = await load(path.join(configDir, `${file}.ts`));

  if (typeof module === "string") {
    problems.push(`${file}.ts — ${module}`);
    continue;
  }

  const config = Object.values(module).find(
    (value): value is AppConfig => Boolean(value) && typeof value === "object" && "slug" in (value as object),
  );

  if (!config) {
    problems.push(`${file}.ts exports no config — is the export missing?`);
    continue;
  }

  if (config.slug !== file) {
    problems.push(
      `${file}.ts declares slug "${config.slug}". The two must match: the slug names the ` +
        `public/apps/ folder the OG image reads from.`,
    );
  }

  if (!registered.has(config.slug)) {
    problems.push(
      `"${config.slug}" is not in apps/multi/config/index.ts. Import it and add it to ` +
        `\`tenants\` — until you do, its domain serves a 404 and nothing else complains.`,
    );
  }
}

// And every registered tenant has to have its assets, since a missing folder is another
// silent one: the page renders with broken images rather than failing.
for (const tenant of tenants) {
  const assets = path.join(root, "apps/multi/public/apps", tenant.slug);
  let present: string[] = [];
  try {
    present = readdirSync(assets);
  } catch {
    problems.push(`"${tenant.slug}" has no public/apps/${tenant.slug}/ folder.`);
    continue;
  }

  for (const asset of ["icon", "logo", "mockup"] as const) {
    const file = tenant.assets[asset].split("/").pop();
    if (file && !present.includes(file)) {
      problems.push(`"${tenant.slug}" is missing public/apps/${tenant.slug}/${file} (assets.${asset}).`);
    }
  }
}

if (problems.length > 0) {
  console.error(`\n${problems.length} problem${problems.length === 1 ? "" : "s"}:\n`);
  for (const problem of problems) console.error(`  • ${problem}`);
  console.error("");
  process.exit(1);
}

console.log(`${tenants.length} tenant${tenants.length === 1 ? "" : "s"} valid and registered: ${[...registered].sort().join(", ")}`);
