/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow LeetCode images if any are embedded
  images: {
    domains: ["assets.leetcode.com", "leetcode.com"],
  },
  // Increase payload limits for Claude responses
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
