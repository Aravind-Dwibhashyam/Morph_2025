import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Move turbo config to turbopack (Turbopack is now stable)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  // Enable static exports for better performance
  output: 'standalone',
  // Remove telemetry key as it's not recognized in Next.js 15
  // Telemetry is disabled by default in production builds
  // Optimize images telemetry:False,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
