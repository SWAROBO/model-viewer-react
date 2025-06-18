import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // Temporarily disable Strict Mode for testing
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
