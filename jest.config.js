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
  // Coverage thresholds updated to reflect improved test coverage
  // These thresholds ensure we maintain good coverage for critical components
  coverageThreshold: {
    global: {
      branches: 8,     // Current: 8.56% - Set slightly below to allow minor fluctuations
      functions: 10,   // Current: 11.58% - Set below current to allow room for new untested functions  
      lines: 12,       // Current: 14.11% - Set below current with buffer
      statements: 12   // Current: 14.18% - Set below current with buffer
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