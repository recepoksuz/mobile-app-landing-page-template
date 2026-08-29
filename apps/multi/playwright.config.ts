import { defineConfig, devices } from "@playwright/test";

/**
 * Tenants are separated by `{slug}.localhost`. Chrome, Firefox and Safari resolve
 * `*.localhost` to 127.0.0.1 on their own; in an environment that does not, adding
 * `127.0.0.1 aurora.localhost atlas.localhost` to /etc/hosts is enough.
 */
export const PORT = 3100;
export const AURORA = `http://aurora.localhost:${PORT}`;
export const ATLAS = `http://atlas.localhost:${PORT}`;

/**
 * The graduated app, started alongside the shared deploy.
 *
 * Both live in this one suite because the parity tests compare them against each other, and a
 * comparison needs both ends up at once. Splitting them into two suites meant two Playwright
 * configs both binding port 3100 and both assuming the other app was already built — which
 * passed by luck in a warm checkout and failed on a fresh clone.
 */
export const GRADUATED = "http://localhost:3101";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: AURORA,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    // Production behaviour is what matters here: the proxy, the dynamic routes and the cache
    // headers all differ under `next dev`.
    {
      command: "pnpm start",
      url: AURORA,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter aurora start",
      url: GRADUATED,
      cwd: "../..",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
