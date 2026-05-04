/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@travel/shared'] = require('path').resolve(__dirname, 'src/shared');
    return config;
  },
};

module.exports = nextConfig;
