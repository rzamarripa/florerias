import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // ... existing code ...
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(css)$/,
      use: ["style-loader", "css-loader"],
    });
    return config;
  },
};

export default nextConfig;
