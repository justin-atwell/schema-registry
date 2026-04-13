import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;