const withPlugins = require('next-compose-plugins');
const withLess = require('next-with-less');

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // react 18 about strict mode https://reactjs.org/blog/2022/03/29/react-v18.html#new-strict-mode-behaviors
  // enable for testing purpose
  reactStrictMode: false,
  distDir: 'dist/.next',
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. in development we need to run yarn lint
    ignoreDuringBuilds: true
  },
  poweredByHeader: false,
  swcMinify: false,
  serverRuntimeConfig: {
    // Will only be available on the server side
    API_ENDPOINT: process.env.API_SERVER_ENDPOINT || process.env.API_ENDPOINT
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    API_ENDPOINT: process.env.API_ENDPOINT,
    SITE_URL: process.env.SITE_URL,
    MAX_SIZE_IMAGE: process.env.MAX_SIZE_IMAGE || 5,
    MAX_SIZE_FILE: process.env.MAX_SIZE_FILE || 1000,
    MAX_SIZE_TEASER: process.env.MAX_SIZE_TEASER || 1000,
    MAX_SIZE_VIDEO: process.env.MAX_SIZE_VIDEO || 2000,
    IMAGE_ACCPET: process.env.IMAGE_ACCPET || 'image/*',
    SOUND_ACCEPT: process.env.SOUND_ACCEPT || 'audio/*',
    VIDEO_ACCEPT: process.env.VIDEO_ACCEPT || 'video/*,.mkv'
  }
};

module.exports = withPlugins([
  withLess({
    lessLoaderOptions: {
      lessOptions: {
        javascriptEnabled: true
      }
    }
  }),
  nextConfig
]);
