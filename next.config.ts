/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Disable strict mode to prevent double renders in development
  reactStrictMode: true,
};

export default nextConfig;
