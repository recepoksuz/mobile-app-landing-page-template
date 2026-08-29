import { defineConfig } from "vitest/config";

export default defineConfig({
  // The repo sets `jsx: "preserve"` because Next does the transform. Vitest has no Next in
  // front of it, so a test importing a `.tsx` — adding a translated legal document means one
  // will — needs the transform here. Vite 8 transforms with Oxc, not esbuild.
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
