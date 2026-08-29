import { defineConfig, devices } from "@playwright/test";

/**
 * The graduated app is tested against the shared deploy, not on its own: the claim worth
 * verifying is that graduation changes no URL, and that is only checkable by running both and
 * comparing. Both servers are started here for that reason.
 */
export const GRADUATED = "http://localhost:3101";
export const SHARED = "http://aurora.localhost:3100";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? "line" : "list",
  use: { baseURL: GRADUATED, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    { command: "pnpm start", url: GRADUATED, reuseExistingServer: !process.env.CI, timeout: 120_000 },
    {
      command: "pnpm --filter multi start",
      url: SHARED,
      cwd: "../..",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
