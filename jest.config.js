module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['jest-partial'],
  coverageDirectory: './.coverage',
  modulePathIgnorePatterns: ['<rootDir>/docs', '<rootDir>/lib'],
};
