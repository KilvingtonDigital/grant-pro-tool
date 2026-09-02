import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow iframe embedding from any origin
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors *" },
        ],
      },
    ];
  },
  // Allow Google Maps Static image domain
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'maps.googleapis.com' },
      { protocol: 'https', hostname: 'maps.gstatic.com' },
    ],
  },
};

export default nextConfig;
