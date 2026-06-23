/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@crewora/shared', '@crewora/ui', '@crewora/api-client'],

  // ─── Image Optimization ───────────────────────────────────────────────────
  images: {
    unoptimized: true,
    // Whitelist allowed image domains
    // remotePatterns: [
    //   { protocol: 'https', hostname: '*.supabase.co' },
    //   { protocol: 'https', hostname: '*.amazonaws.com' },
    //   { protocol: 'https', hostname: 'ui-avatars.com' },
    //   { protocol: 'https', hostname: 'images.unsplash.com' },
    // ],
  },

  // ─── Compression ─────────────────────────────────────────────────────────
  compress: true,

  // ─── Security ────────────────────────────────────────────────────────────
  poweredByHeader: false,

  // ─── Static Generation (ISR) ────────────────────────────────────────────
  // Pages that don't need real-time data can be statically generated
  // with on-demand revalidation

  // ─── Headers (security at CDN/edge layer) ────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://crewora.in' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },

  // ─── Bundle Analyzer ─────────────────────────────────────────────────────
  // Run with: ANALYZE=true npm run build
  ...(process.env.ANALYZE === 'true'
    ? {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        ...require('@next/bundle-analyzer')({
          enabled: true,
          openAnalyzer: true,
        }),
      }
    : {}),
};

module.exports = nextConfig;
