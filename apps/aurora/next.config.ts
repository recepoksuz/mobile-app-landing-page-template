import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // landing-kit is consumed as source without a build step (Turborepo JIT package).
  transpilePackages: ["@landing/kit"],
  poweredByHeader: false,
};

export default nextConfig;
