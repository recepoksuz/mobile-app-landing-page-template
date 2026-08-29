import next from "eslint-config-next";
import coreWebVitals from "eslint-config-next/core-web-vitals";

const config = [...next, ...coreWebVitals, { ignores: [".next/**", "node_modules/**"] }];

export default config;
