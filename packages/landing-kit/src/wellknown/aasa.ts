import type { AppConfig } from "../config/schema";

export type Aasa = {
  applinks: {
    details: Array<{ appIDs: string[]; components: Array<Record<string, unknown>> }>;
  };
  webcredentials?: { apps: string[] };
};

/**
 * Without `teamId` and `bundleId` Universal Links cannot be set up — instead of serving
 * an empty file we return `null` and the route 404s. An AASA with the wrong contents is
 * harder to diagnose than a missing one.
 */
export function buildAasa(config: AppConfig): Aasa | null {
  const ios = config.store.ios;
  if (!ios?.teamId || !ios.bundleId) return null;

  const appId = `${ios.teamId}.${ios.bundleId}`;

  return {
    applinks: {
      details: [
        {
          appIDs: [appId],
          components: [
            // The attribution route belongs to the web, not the app; the app must not capture it.
            { "/": "/go/*", exclude: true, comment: "attribution redirect stays on the web" },
            { "/": "/.well-known/*", exclude: true, comment: "verification files" },
            { "/": "/*", comment: "every other path opens in the app" },
          ],
        },
      ],
    },
    webcredentials: { apps: [appId] },
  };
}
