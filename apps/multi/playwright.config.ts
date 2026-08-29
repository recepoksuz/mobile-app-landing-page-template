import { defineConfig, devices } from "@playwright/test";

/**
 * Tenants are separated by `{slug}.localhost`. Chrome, Firefox and Safari resolve
 * `*.localhost` to 127.0.0.1 on their own; in an environment that does not, adding
 * `127.0.0.1 aurora.localhost atlas.localhost` to /etc/hosts is enough.
 */
export const PORT = 3100;
export const AURORA = `http://aurora.localhost:${PORT}`;
export const ATLAS = `http://atlas.localhost:${PORT}`;

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
  webServer: {
    // Test the production behaviour: the proxy, the dynamic routes and the cache
    // headers can behave differently on the dev server.
    command: "pnpm start",
    url: AURORA,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
