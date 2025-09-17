/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/assets/js/test-setup.ts'],
  testMatch: [
    '<rootDir>/assets/js/**/__tests__/**/*.(ts|tsx)',
    '<rootDir>/assets/js/**/*.(test|spec).(ts|tsx)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/assets/js/$1',
    '\\.(graphql)$': '<rootDir>/assets/js/__mocks__/graphqlMock.js'
  },
  collectCoverageFrom: [
    'assets/js/**/*.(ts|tsx)',
    '!assets/js/**/*.d.ts',
    '!assets/js/test-setup.ts',
    '!assets/js/**/__tests__/**/*',
    '!assets/js/**/*.stories.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 8,
      functions: 10,
      lines: 12,
      statements: 12
    }
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(reactflow)/)'
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx']
};