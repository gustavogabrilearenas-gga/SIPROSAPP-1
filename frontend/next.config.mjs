/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
  async rewrites() {
    // Opcional: llamadas desde el cliente a /drf/* proxy a Django
    return [
      {
        source: "/drf/:path*",
        destination: "http://localhost:8000/:path*",
      },
    ];
  },
};
export default nextConfig;
