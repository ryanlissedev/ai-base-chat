/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Use partial prerendering for performance
    ppr: 'incremental',
  },
  
  // Skip trailing slash redirect (moved out of experimental)
  skipTrailingSlashRedirect: true,
  
  // Skip page data collection for API routes during build
  async redirects() {
    return [];
  },

  // Output file tracing configuration to silence workspace warnings
  outputFileTracingRoot: process.cwd(),

  // Environment variables available to the browser
  env: {
    SKIP_BUILD_API_VALIDATION: process.env.SKIP_BUILD_API_VALIDATION,
  },

  // Webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Skip certain modules during build to prevent API key initialization
    if (isServer && !dev && process.env.SKIP_BUILD_API_VALIDATION === 'true') {
      config.externals = config.externals || [];
      config.externals.push({
        // Prevent AI SDK from being processed during build
        '@ai-sdk/gateway': 'commonjs @ai-sdk/gateway',
      });
    }
    
    return config;
  },
};

module.exports = nextConfig;