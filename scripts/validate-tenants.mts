/**
 * Validates every tenant config, in seconds, without a bundler.
 *
 * The failure it exists for: `apps/multi/config/index.ts` has to import each config and list it
 * in `tenants`. Miss that and nothing complains — the file typechecks, `next build` succeeds,
 * the test suite passes, and the tenant's domain serves a 404. It is the one step in adding an
 * app whose omission is completely silent.
 *
 * Everything else here is the same shape of problem: true at build time, invisible until
 * someone looks at the live site. A locale with no UI dictionary. A blog switched on with no
 * posts directory. An asset the config names and the folder does not have.
 *
 * Run it directly (`pnpm validate`) after writing a config. `pnpm check` runs it first, so a
 * config that was never going to work fails before the minutes-long tasks start.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import type { AppConfig } from "../packages/landing-kit/src/config/schema";
import { dictionaries } from "../packages/landing-kit/src/i18n/resolve";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const configDir = path.join(root, "apps/multi/config");

const problems: string[] = [];

/**
 * Every import here can throw — `defineAppConfig` is meant to, on a bad config. Caught and
 * collected rather than allowed to crash, so one broken tenant does not hide the next one's
 * problem, and the reader gets the message instead of a stack trace through the module loader.
 */
async function load(file: string): Promise<Record<string, unknown> | string> {
  try {
    return (await import(file)) as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return message.replace(/^Invalid AppConfig \(".*?"\):\s*/, "").trim();
  }
}

const files = readdirSync(configDir)
  .filter((file) => file.endsWith(".ts") && file !== "index.ts")
  .map((file) => file.replace(/\.ts$/, ""))
  .sort();

if (files.length === 0) problems.push("No tenant configs found in apps/multi/config/.");

/**
 * Registration is checked by reading `index.ts`, not by importing it.
 *
 * Importing would be the obvious way, but one broken config takes the whole module down with
 * it — and the reader would then be told nothing about which file, or that the registration
 * they came here to check was fine all along. Reading the source cannot fail.
 */
const indexSource = readFileSync(path.join(configDir, "index.ts"), "utf8");
const tenantList = indexSource.match(/tenants:\s*readonly AppConfig\[\]\s*=\s*\[([^\]]*)\]/)?.[1] ?? "";
const listed = new Set(tenantList.split(",").map((entry) => entry.trim()).filter(Boolean));

const configs: AppConfig[] = [];

for (const file of files) {
  const source = readFileSync(path.join(configDir, `${file}.ts`), "utf8");

  // A freshly scaffolded config fails the schema on its placeholders. Saying so beats leaving
  // someone to work out that "appId consists of digits only" means "you have not filled it in".
  const hasPlaceholders = /\bTODO\b/.test(source);
  if (hasPlaceholders) {
    problems.push(
      `${file}.ts still has TODO placeholders — fill them in. Every field is in ` +
        `docs/config-reference.md. Any schema errors below are probably these.`,
    );
  }

  const imported = indexSource.includes(`from "./${file}"`);
  const exportName = source.match(/export const (\w+) = defineAppConfig/)?.[1];

  if (!imported || !exportName || !listed.has(exportName)) {
    problems.push(
      `"${file}" is not registered in apps/multi/config/index.ts. Import it and add it to ` +
        `\`tenants\` — until you do, its domain serves a 404 and nothing else complains.`,
    );
  }

  const module = await load(path.join(configDir, `${file}.ts`));
  if (typeof module === "string") {
    // The placeholder note above already explains a scaffold's errors; don't say it twice.
    if (!hasPlaceholders) problems.push(`${file}.ts — ${module}`);
    continue;
  }

  const config = Object.values(module).find(
    (value): value is AppConfig =>
      Boolean(value) && typeof value === "object" && "slug" in (value as object),
  );

  if (!config) {
    problems.push(`${file}.ts exports no config — is the \`export const\` missing?`);
    continue;
  }

  if (config.slug !== file) {
    problems.push(
      `${file}.ts declares slug "${config.slug}". The two must match: the slug names the ` +
        `public/apps/ folder the OG image reads from.`,
    );
  }

  configs.push(config);
}

for (const config of configs) {
  // A missing asset is silent in its own way: the page renders, with broken images.
  const assetDir = path.join(root, "apps/multi/public/apps", config.slug);
  let present: string[] = [];

  try {
    present = readdirSync(assetDir);
  } catch {
    problems.push(`"${config.slug}" has no public/apps/${config.slug}/ folder.`);
    present = [];
  }

  for (const asset of ["icon", "logo", "mockup"] as const) {
    const file = config.assets[asset].split("/").pop();
    if (present.length > 0 && file && !present.includes(file)) {
      problems.push(
        `"${config.slug}" is missing public/apps/${config.slug}/${file} (assets.${asset}).`,
      );
    }
  }

  // A locale in `i18n.locales` translates the tenant's own copy. The interface strings — nav,
  // buttons, the cookie banner — come from a dictionary in the kit, and `getDictionary` falls
  // back to English when there is none. The page then ships half translated, which nothing
  // else notices: it renders, it passes, it just reads wrong to the person it was for.
  for (const locale of Object.keys(config.i18n.locales)) {
    if (!dictionaries[locale]) {
      problems.push(
        `"${config.slug}" serves "${locale}" but there is no UI dictionary for it. Add ` +
          `packages/landing-kit/src/i18n/dictionaries/${locale}.ts, or the interface stays ` +
          `English while the copy is not.`,
      );
    }
  }

  // `features.blog` opens the routes; the posts come off disk.
  if (config.features.blog && !existsSync(path.join(root, "apps/multi/content", config.slug, "blog"))) {
    problems.push(
      `"${config.slug}" has features.blog enabled but no apps/multi/content/${config.slug}/blog/ ` +
        `directory. The blog index would render empty and the sitemap would advertise it.`,
    );
  }
}

if (problems.length > 0) {
  console.error(`\n${problems.length} problem${problems.length === 1 ? "" : "s"}:\n`);
  for (const problem of problems) console.error(`  • ${problem}`);
  console.error("");
  process.exit(1);
}

const slugs = configs.map((config) => config.slug).sort();
console.log(`${slugs.length} tenant${slugs.length === 1 ? "" : "s"} valid and registered: ${slugs.join(", ")}`);
