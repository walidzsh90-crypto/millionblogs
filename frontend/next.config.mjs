/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    typedRoutes: true
  },
  images: {
    formats: ["image/avif", "image/webp"]
  }
};

export default nextConfig;
