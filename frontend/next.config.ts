import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Proxy : le serveur Next.js redirige /api/backend/* → backend:3000/*
  async rewrites() {
    const internalUrl = process.env.INTERNAL_API_URL ?? 'http://backend:3000';
    return [
      {
        source: '/api/backend/:path*',
        destination: `${internalUrl}/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${internalUrl}/uploads/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'backend',
        port: '3000',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

