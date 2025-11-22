import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Set explicit Turbopack root to silence warnings
  turbopack: {
    root: __dirname,
  },
  // Allow ngrok domains for development
  allowedDevOrigins: [
    'phonesthemic-unentranced-gema.ngrok-free.dev',
    // Add any other ngrok domains you might use
    '*.ngrok-free.dev',
    '*.ngrok.io'
  ],
  // Proxy API calls to backend
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8001/api/v1/:path*',
      },
    ];
  },
  // Also configure for better CORS handling
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://phonesthemic-unentranced-gema.ngrok-free.dev',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
