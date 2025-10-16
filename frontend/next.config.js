/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Optimizes for containerized environments
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: false,
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
    if (dev && !isServer) {
      // Fast Refresh optimizations
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
        chunkIds: 'named',
        runtimeChunk: 'single',
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false
      };

      // Minimal stats output
      config.stats = 'minimal';

      // Development-specific optimizations
      config.mode = 'development';
      config.devtool = 'eval';

      // Fast file watching
      config.watchOptions = {
        ...config.watchOptions,
        poll: false,
        ignored: /node_modules/,
      };
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
