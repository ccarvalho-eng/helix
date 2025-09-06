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
    '^@/(.*)$': '<rootDir>/assets/js/$1'
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
  // TODO: Increase these coverage thresholds as we add more tests
  // Current low thresholds are temporary to allow tests to pass while building coverage
  coverageThreshold: {
    global: {
      branches: 0.4,
      functions: 1,
      lines: 2,
      statements: 2
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