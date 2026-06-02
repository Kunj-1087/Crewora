/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  transpilePackages: ['@crewora/shared', '@crewora/ui', '@crewora/api-client'],
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
