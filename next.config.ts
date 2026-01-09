import type { NextConfig } from 'next'
import { validateEnv } from './src/lib/env'

// Validate environment variables at build time
// This will throw an error if required vars are missing or invalid
if (process.env.NODE_ENV !== 'test') {
  validateEnv()
}

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  /**
   * Output Configuration for Docker
   *
   * 'standalone' mode creates a minimal production build with only required dependencies
   * This significantly reduces Docker image size
   * @see https://nextjs.org/docs/app/api-reference/next-config-js/output
   */
  output: 'standalone',

  /**
   * Security Headers
   *
   * Implements security best practices to protect against common vulnerabilities
   * @see https://nextjs.org/docs/app/api-reference/next-config-js/headers
   */
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Control which features and APIs can be used
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Content Security Policy - Prevents XSS attacks
          // Note: This is a strict policy. Adjust based on your needs.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval and unsafe-inline
              "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' " + (process.env.NEXT_PUBLIC_BACKEND_API_URL || ''),
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
  // Allow cross-origin requests in development (for accessing from other devices/IPs)
  allowedDevOrigins: [
    'http://10.29.243.85:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://app.rediver.io',
    'https://app.rediver.io:3000',
    'http://app.rediver.io:3000',
    'https://app.rediver.io:443',
    'http://app.rediver.io:80',
  ],
}

export default nextConfig
