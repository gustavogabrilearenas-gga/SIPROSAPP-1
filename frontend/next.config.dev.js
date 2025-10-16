/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizaciones específicas para desarrollo
  experimental: {
    optimizePackageImports: [
      '@heroicons/react',
      '@tremor/react',
      'framer-motion',
      'recharts',
      '@headlessui/react',
      'lucide-react'
    ],
    // Mantener el compilador en memoria
    isrMemoryCacheSize: 0,
    // Precargar rutas en segundo plano
    prefetchRegex: true,
  },
  // Configuración de webpack para desarrollo
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Optimizaciones para desarrollo
      config.optimization = {
        ...config.optimization,
        // Mantener módulos en memoria
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Mantener módulos comunes en caché
            commons: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              maxInitialRequests: 10,
              minSize: 0,
            },
          },
        },
      };

      // Configuración de caché
      config.cache = {
        type: 'filesystem',
        // Usar /tmp para mejor rendimiento en desarrollo
        cacheDirectory: '/tmp/.next/cache',
        buildDependencies: {
          config: [__filename],
        },
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
      };
    }
    return config;
  },
  // Deshabilitar minificación en desarrollo
  swcMinify: false,
  // Optimizaciones de construcción
  compiler: {
    removeConsole: false,
  },
  // Configuración de rutas estáticas
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;