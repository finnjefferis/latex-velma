/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['mosaic.scdn.co', 'i.scdn.co'], // Add this line to whitelist the domain
  },
};

module.exports = nextConfig;
