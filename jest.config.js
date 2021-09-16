const isUnit = process.env.type !== 'e2e';

const sharedConfig = {
  setupFilesAfterEnv: ['jest-partial'],
  modulePathIgnorePatterns: ['<rootDir>/docs', '<rootDir>/lib'],
};

if (isUnit) {
  module.exports = {
    ...sharedConfig,
    preset: 'ts-jest',
    testEnvironment: 'node',
    globals: {
      'ts-jest': {
        tsConfig: './tsconfig.build.json',
      },
    },
  };
} else {
  // e2e
  module.exports = {
    ...sharedConfig,
    preset: 'jest-playwright-preset',
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
  };
}
