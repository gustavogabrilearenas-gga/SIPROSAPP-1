/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },
  // Add performance optimizations
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  swcMinify: true,
  // Optimize module loading
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@heroicons/react',
      '@tremor/react',
      'framer-motion',
      'recharts',
      '@headlessui/react',
      'lucide-react'
    ],
    turbotrace: {
      logLevel: "error",
      contextDirectory: __dirname,
      memoryLimit: 4096
    },
    serverActions: {
      bodySizeLimit: '2mb'
    },
    optimizeServerReact: true,
    preferredRegion: 'auto',
    mdxRs: true,
    webpackBuildWorker: true,
    optimizeMultiplePages: true
  },
  // Docker-specific optimizations
  output: 'standalone', // Optimizes for containerized environments
  webpack: (config, { dev, isServer }) => {
    // Optimize development performance
    if (dev && !isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 800,
        aggregateTimeout: 300,
      };
      
      // Add cache for development
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
      
      // Optimize module resolution
      config.snapshot = {
        ...config.snapshot,
        managedPaths: [/^(.+?[\\/]node_modules[\\/])/],
        immutablePaths: [],
      };
      
      // Increase parallelization
      config.parallelism = 4;
    }
    
    return config;
  },
  // Cache optimization
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 30 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5,
  }
}
