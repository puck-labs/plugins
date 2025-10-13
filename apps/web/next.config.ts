import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@puck-labs/jsonata"],
};

export default nextConfig;
