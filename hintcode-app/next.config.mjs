import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  // Allow LeetCode images if any are embedded
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.leetcode.com",
      },
      {
        protocol: "https",
        hostname: "leetcode.com",
      },
    ],
  },
  // Increase payload limits for Claude responses
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
