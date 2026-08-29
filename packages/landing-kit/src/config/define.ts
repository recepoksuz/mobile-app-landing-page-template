import { appConfigSchema, type AppConfig, type AppConfigInput } from "./schema";

/**
 * Validates the config at module load time. Throws on error — so a broken tenant
 * config takes `next build` down instead of silently shipping to production.
 */
export function defineAppConfig(input: AppConfigInput): AppConfig {
  const result = appConfigSchema.safeParse(input);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid AppConfig${typeof input.slug === "string" ? ` ("${input.slug}")` : ""}:\n${issues}`,
    );
  }

  return result.data;
}
