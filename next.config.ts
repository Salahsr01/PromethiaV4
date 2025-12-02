import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Image optimization
  images: {
    domains: [],
    unoptimized: process.env.NODE_ENV === 'development'
  },
  
  // Security headers
  async headers() {
    const isDev = process.env.NODE_ENV === 'development'
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Désactiver le cache en développement
          ...(isDev ? [{
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }] : [])
        ]
      }
    ]
  },
  
  // Environment variables available to the client
  env: {
    NEXT_PUBLIC_APP_NAME: 'Promethia',
    NEXT_PUBLIC_APP_VERSION: '0.1.0',
    NEXT_PUBLIC_DISABLE_SW: process.env.NODE_ENV === 'development' ? 'true' : 'false'
  }
};

export default nextConfig;
