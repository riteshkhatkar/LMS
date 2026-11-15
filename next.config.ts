import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // In production, unsafe-eval is eliminated; unsafe-inline is retained for Next.js hydration scripts
      `script-src 'self' ${isProd ? "'unsafe-inline'" : "'unsafe-eval' 'unsafe-inline'"}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://www.orelse.ai https://*.googleusercontent.com",
      "font-src 'self' data:",
      // Development EVM RPC (127.0.0.1:8545) is strictly excluded in production builds
      `connect-src 'self' ${isProd ? "https://rpc-amoy.polygon.technology" : "http://127.0.0.1:8545 https://rpc-amoy.polygon.technology"}`,
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/webp", "image/avif"],
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // OWASP & Phase 8 Caching Rule: Private APIs must never be cached by shared proxies or browsers
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, no-cache, must-revalidate, max-age=0",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
