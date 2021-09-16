// This babel config is only used by playwright. Not to build next-runtime

const config = {
  presets: ['next/babel'],
  plugins: [],
};

if (process.env.NODE_ENV === 'test') {
  config.plugins.push('babel-plugin-istanbul');
}

module.exports = config;
