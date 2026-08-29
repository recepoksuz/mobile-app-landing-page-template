import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // landing-kit is consumed as source without being built (Turborepo JIT package).
  transpilePackages: ["@landing/kit"],
  poweredByHeader: false,
};

export default nextConfig;
