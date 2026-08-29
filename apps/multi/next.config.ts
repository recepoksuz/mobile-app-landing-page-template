import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // landing-kit is consumed as source without being built (Turborepo JIT package).
  transpilePackages: ["@landing/kit"],
  poweredByHeader: false,
  outputFileTracingIncludes: {
    // The OG route reads an icon off disk to inline it, and the blog reads Markdown. Both
    // resolve their paths at request time, so the tracer cannot follow them and neither
    // directory would be in the serverless function. The failure is silent, not a crash.
    "/**": ["./public/apps/**", "./content/**"],
  },
};

export default nextConfig;
