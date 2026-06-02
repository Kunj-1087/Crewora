/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@crewora/shared', '@crewora/ui', '@crewora/api-client'],
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
