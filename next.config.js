/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["res.cloudinary.com"],
    loader: "custom",
    loaderFile: "./lib/cloudinary-loader.js",
    unoptimized: true,
  },
  allowedDevOrigins: ['*'],
}

module.exports = nextConfig
