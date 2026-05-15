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

export default nextConfig;
