import { aliasModuleNameMapper } from './tsconfigAliases.js';

/** @type {import('jest').Config} */
const baseConfig = {
  testEnvironment: 'node',

  globalSetup: '<rootDir>/tests/setup/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.ts',

  setupFiles: ['dotenv/config', '<rootDir>/tests/setup/guard.ts'],

  moduleFileExtensions: ['ts', 'js', 'mjs', 'cjs', 'json', 'node'],

  transform: {
    '^.+\\.[mc]?[jt]sx?$': 'babel-jest',
  },

  moduleNameMapper: {
    // Generated from the tsconfig paths, both the ".js" form the sources use and
    // the ".ts" form the babel rewrite produces.
    ...aliasModuleNameMapper,
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};

/** @type {import('jest').Config} */
export default {
  projects: [
    {
      ...baseConfig,
      displayName: 'unit-tests',
      testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/tests/**/*.test.ts'],
      testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/integration/'],
    },
    {
      ...baseConfig,
      displayName: 'integration-tests',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
    },
  ],
};
