import next from "eslint-config-next";
import coreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * The package is not a Next application in its own right, but it does contain React
 * components and hooks; linting it with the same rule set keeps it consistent with apps/*.
 */
const config = [
  ...next,
  ...coreWebVitals,
  {
    rules: {
      // The package has no pages/app directory of its own; this rule is meaningless here.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  { ignores: ["node_modules/**"] },
];

export default config;
