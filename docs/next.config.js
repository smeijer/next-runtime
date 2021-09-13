module.exports = {
  target: 'serverless',

  async redirects() {
    return [
      {
        source: '/',
        destination: '/getting-started',
        permanent: true,
      },
      {
        source: '/getting-started',
        destination: '/getting-started/1-introduction',
        permanent: true,
      },
    ];
  },
};
