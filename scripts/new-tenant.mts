/**
 * Scaffolds a tenant: `pnpm new-tenant <slug> [--name "My App"] [--domain myapp.com]`
 *
 * Writes the config, registers it, and creates the asset folder with placeholders — the three
 * structural steps, none of which involve a decision. What is left is filling in real values,
 * which is the only part that needs to know anything about the app.
 *
 * Registration is the reason this exists. It lives in a second file, and omitting it fails
 * silently: the config typechecks, the build succeeds, the tests pass, and the domain 404s.
 * `pnpm validate` catches it after the fact; doing it here means it cannot happen.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const configDir = path.join(root, "apps/multi/config");
const assetsDir = path.join(root, "apps/multi/public/apps");

function fail(message: string): never {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

// ---- arguments ----

const argv = process.argv.slice(2);
const slug = argv.find((arg) => !arg.startsWith("--"));

function flag(name: string): string | undefined {
  const index = argv.indexOf(`--${name}`);
  return index === -1 ? undefined : argv[index + 1];
}

if (!slug) {
  fail('Usage: pnpm new-tenant <slug> [--name "My App"] [--domain myapp.com]');
}

// The slug becomes a URL path segment internally, a folder name, and a TypeScript identifier.
if (!/^[a-z][a-z0-9-]*$/.test(slug)) {
  fail(`"${slug}" is not a usable slug. Lowercase letters, digits and hyphens, starting with a letter.`);
}

const identifier = slug.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
const name = flag("name") ?? slug[0]!.toUpperCase() + slug.slice(1);
const domain = flag("domain") ?? `${slug}.example`;

const configPath = path.join(configDir, `${slug}.ts`);
if (existsSync(configPath)) fail(`apps/multi/config/${slug}.ts already exists.`);

// ---- config ----

const config = `import { defineAppConfig } from "@landing/kit/config";

/**
 * TODO before this goes live — every value below marked TODO is a placeholder.
 * Every field there is: docs/config-reference.md
 */
export const ${identifier} = defineAppConfig({
  slug: "${slug}",
  domain: "${domain}",
  name: "${name}",

  // The h1. Say what the app does for someone, not what it is.
  tagline: "TODO: the one-line promise",
  // 70-160 characters. Google truncates around 155.
  description:
    "TODO: what the app does and who it is for, in a sentence someone would recognise themselves in.",

  theme: { accent: "#TODO00", mode: "dark" },

  assets: {
    icon: "/apps/${slug}/icon.svg",
    logo: "/apps/${slug}/logo.svg",
    mockup: "/apps/${slug}/mockup.svg",
  },

  store: {
    // At least one of ios / android. Delete the one that does not apply.
    ios: {
      appId: "TODO",
      url: "https://apps.apple.com/app/idTODO",
      // The storefront the rating is read from. Wrong country, wrong number.
      country: "us",
      // Both or neither — they generate apple-app-site-association.
      // teamId: "TODO",
      // bundleId: "TODO",
    },
    android: {
      packageName: "TODO",
      url: "https://play.google.com/store/apps/details?id=TODO",
      // Without this, assetlinks.json is not generated and App Links cannot verify.
      // sha256Fingerprints: ["TODO"],
    },
    // Leave rating / reviewCount / downloads unset for a new app and the ratings strip does
    // not render at all — better than an empty "0 reviews" line.
  },

  legal: {
    companyName: "TODO",
    companyAddress: "TODO",
    supportEmail: "support@${domain}",
    governingLaw: "TODO",
    // true generates /delete-account, which Play requires of any app with sign-in.
    hasAccounts: false,
    // true adds the EULA sections and generates /refund-policy.
    hasSubscriptions: false,
  },

  // \`content\` is omitted, which gives a one-screen hero. Fill features / steps / faq to get
  // the long page — see docs/config-reference.md. A block earns its place by having something
  // real to put in it.

  // attribution: { oneLink: "https://${slug}.onelink.me/TODO" },
  // features: { analytics: true },
});
`;

writeFileSync(configPath, config);

// ---- registration ----

const indexPath = path.join(configDir, "index.ts");
let index = readFileSync(indexPath, "utf8");

const imports = index.match(/^import \{ \w+ \} from "\.\/\w[\w-]*";$/gm) ?? [];
const last = imports[imports.length - 1];
if (!last) fail("Could not find the tenant imports in config/index.ts — register it by hand.");

index = index.replace(last, `${last}\nimport { ${identifier} } from "./${slug}";`);
index = index.replace(/(export const tenants: readonly AppConfig\[\] = \[)([^\]]*)\]/, (_, head, list) => {
  const existing = String(list).trim().replace(/,$/, "");
  return `${head}${existing}, ${identifier}]`;
});

if (!index.includes(`import { ${identifier} }`) || !index.includes(`, ${identifier}]`)) {
  fail("Could not register the tenant automatically — add it to config/index.ts by hand.");
}
writeFileSync(indexPath, index);

// ---- placeholder assets ----

const assetDir = path.join(assetsDir, slug);
mkdirSync(assetDir, { recursive: true });

const initial = name[0]!.toUpperCase();
const placeholder = "#4a4a55";

writeFileSync(
  path.join(assetDir, "icon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="${name} placeholder icon">
  <rect width="512" height="512" rx="114" fill="${placeholder}"/>
  <text x="256" y="256" fill="#fff" font-family="system-ui, sans-serif" font-size="248" font-weight="600"
        text-anchor="middle" dominant-baseline="central">${initial}</text>
</svg>
`,
);

writeFileSync(
  path.join(assetDir, "logo.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 48" role="img" aria-label="${name} placeholder logo">
  <rect width="48" height="48" rx="11" fill="${placeholder}"/>
  <text x="24" y="24" fill="#fff" font-family="system-ui, sans-serif" font-size="24" font-weight="600"
        text-anchor="middle" dominant-baseline="central">${initial}</text>
  <text x="62" y="25" fill="currentColor" font-family="system-ui, sans-serif" font-size="21" font-weight="600"
        dominant-baseline="central">${name}</text>
</svg>
`,
);

writeFileSync(
  path.join(assetDir, "mockup.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 844" role="img" aria-label="${name} placeholder screenshot">
  <rect width="390" height="844" rx="52" fill="#1a1a20"/>
  <rect x="10" y="10" width="370" height="824" rx="44" fill="${placeholder}"/>
  <text x="195" y="422" fill="#fff" font-family="system-ui, sans-serif" font-size="26" font-weight="500"
        text-anchor="middle" opacity="0.75">Replace with the</text>
  <text x="195" y="458" fill="#fff" font-family="system-ui, sans-serif" font-size="26" font-weight="500"
        text-anchor="middle" opacity="0.75">real store screenshot</text>
</svg>
`,
);

console.log(`
  ${slug} scaffolded.

    apps/multi/config/${slug}.ts          written and registered
    apps/multi/public/apps/${slug}/       icon, logo, mockup placeholders

  Next:
    1. Replace every TODO in apps/multi/config/${slug}.ts
    2. Drop the real store screenshot over mockup.svg — any size, the ratio is read from the file
    3. pnpm validate
`);
