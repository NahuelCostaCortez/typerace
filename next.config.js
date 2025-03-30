/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Using server components for API routes
  experimental: {
    // No experimental features needed
  }
};

module.exports = nextConfig; 