import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    ppr: 'incremental',
    optimizePackageImports: [
      'react-tweet',
      'echarts-for-react',
      '@lobehub/icons',
    ],
    // Enable external packages for server components to allow pino transports
  },
  serverExternalPackages: ['pino', 'pino-pretty'],
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '**',
      },
      {
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  /**
   * During tests we disable heavy optional deps to avoid module-not-found stalls.
   */
  webpack: (config, { isServer }) => {
    config.resolve = config.resolve || {};
    const fallback = config.resolve.fallback || {};
    // Stub echarts in test to avoid installing full package
    if (process.env.PLAYWRIGHT || process.env.CI) {
      fallback.echarts = false as unknown as undefined;
    }
    config.resolve.fallback = fallback;
    return config;
  },
};

export default nextConfig;
