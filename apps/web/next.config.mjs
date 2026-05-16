import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@sir/ai', '@sir/db', '@sir/shared', 'reactflow', '@reactflow/core', '@reactflow/background', '@reactflow/controls', '@reactflow/minimap'],
  async redirects() {
    return [
      { source: '/dashboard',  destination: '/inicio',   permanent: true },
      { source: '/people',     destination: '/red',      permanent: true },
      { source: '/people/:id', destination: '/red/:id',  permanent: true },
      { source: '/memories',   destination: '/memorias', permanent: true },
      { source: '/signals',    destination: '/senales',  permanent: true },
      { source: '/state',      destination: '/estado',   permanent: true },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org:       process.env['SENTRY_ORG'],
  project:   process.env['SENTRY_PROJECT'],
  authToken: process.env['SENTRY_AUTH_TOKEN'],
  silent:    true,
  telemetry: false,
  sourcemaps: {
    disable: !process.env['SENTRY_AUTH_TOKEN'],
  },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: false,
  },
});
