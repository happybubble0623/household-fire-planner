import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {},
  turbopack: {
    root: __dirname
  },
  async redirects() {
    return [
      {
        source: "/contact",
        destination: "/about",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
