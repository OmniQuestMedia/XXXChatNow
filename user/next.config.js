/** @type {import('next').NextConfig} */
const withPlugins = require('next-compose-plugins');
const withLess = require('next-with-less');

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
  // custom config, just need to update next.config file. use in many cases

  serverRuntimeConfig: {
    // Will only be available on the server side
    API_ENDPOINT: process.env.API_SERVER_ENDPOINT || process.env.API_ENDPOINT
  },

  publicRuntimeConfig: {
    API_ENDPOINT: process.env.API_ENDPOINT,
    SOCKET_ENDPOINT: process.env.SOCKET_ENDPOINT || process.env.API_ENDPOINT,
    // Will be available on both server and client
    MAX_VIDEO_BITRATE_KBPS: 900,
    IMAGE_ACCPET: '.jpeg, .jpg, .png',
    MAXIMUM_SIZE_UPLOAD_AVATAR: '2',
    DEBUG: false
  },

  async redirects() {
    return [
      // VIP MODELS redirects
      { source: '/vip', destination: '/vip-models', permanent: true },
      { source: '/vipmodels', destination: '/vip-models', permanent: true },

      // ALL MODELS redirects
      { source: '/models', destination: '/all-models', permanent: true },
      { source: '/allmodels', destination: '/all-models', permanent: true },

      // TERMS & PRIVACY redirects
      { source: '/terms', destination: '/page/terms-of-use', permanent: true },
      { source: '/terms-and-conditions', destination: '/page/terms-of-use', permanent: true },
      { source: '/terms-of-use', destination: '/page/terms-of-use', permanent: true },
      { source: '/privacy', destination: '/page/privacy-policy', permanent: true },
      { source: '/privacy-policy', destination: '/page/privacy-policy', permanent: true },

      // SIGNUP redirects
      { source: '/signup/member', destination: '/auth/register/user', permanent: true },
      { source: '/signup/model', destination: '/auth/register/model', permanent: true }
    ];
  },

  async rewrites() {
    return [
    // Home & models pages
      { source: '/', destination: '/cams' },
      { source: '/all-models', destination: '/cams' },

      // VIP models page
      { source: '/vip-models', destination: '/search/models' },

      // Auth routes
      { source: '/auth/login', destination: '/auth/login/user' },
      { source: '/auth/login/studio', destination: '/studio/login' },

      // Categories & tags
      { source: '/category/:category', destination: '/search/models' },
      { source: '/tag/:tag', destination: '/search/models' },
      { source: '/cams-aggregator/category/:category', destination: '/cams' },
      { source: '/cams-aggregator/category', destination: '/cams' },

      // Performer content management
      { source: '/account/performer/galleries/:id/update', destination: '/account/performer/galleries/update' },
      { source: '/account/performer/photos/:id/update', destination: '/account/performer/photos/update' },
      { source: '/account/performer/products/:id/update', destination: '/account/performer/products/update' },
      { source: '/account/performer/videos/:id/update', destination: '/account/performer/videos/update' },

      // Live chat & video
      { source: '/live/webrtc/privatechat/:id', destination: '/live/webrtc/privatechat' },
      { source: '/live/privatechat/:id', destination: '/live/privatechat' },
      { source: '/live/:model', destination: '/live' },
      { source: '/community-chat/:id', destination: '/community-chat/:id' }
    ];
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
