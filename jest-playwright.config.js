const PORT = 4000;

module.exports = {
  browsers: ['chromium'],
  serverOptions: {
    command: `npx next dev -p ${PORT}`,
    port: PORT,
    launchTimeout: 30_000,
    debug: false,
    options: {
      env: {
        E2E_TESTS: 'true',
      },
    },
  },
  launchOptions: {
    headless: true,
    // slowMo: 25,
  },
  collectCoverage: false, // doesn't really do what we need
};
