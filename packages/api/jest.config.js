/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  moduleNameMapper: { '@travel/shared': '<rootDir>/../shared/src/index.ts' },
};
