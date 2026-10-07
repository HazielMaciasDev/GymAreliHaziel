/** @type {import('next').NextConfig} */
const repo = 'GymAreliHaziel';

const nextConfig = {
  reactStrictMode: false,
  output: 'export',
  basePath: `/${repo}`,
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;