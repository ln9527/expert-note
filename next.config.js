const basePath = process.env.BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: basePath,
  assetPrefix: basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb', // Increased to support PDF uploads (up to 20MB)
    },
  },
};

module.exports = nextConfig;
