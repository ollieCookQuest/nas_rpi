/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '10gb',
    },
  },
  images: {
    remotePatterns: [],
  },
}

module.exports = nextConfig

