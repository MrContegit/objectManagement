import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Proxy : le serveur Next.js redirige /api/backend/* → backend:3000/*
  async rewrites() {
    const rawBackendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const backendUrl = rawBackendUrl.replace(/\/$/, '');
    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl}/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
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
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.onrender.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

