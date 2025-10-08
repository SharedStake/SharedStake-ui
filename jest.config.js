module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Module file extensions
  moduleFileExtensions: [
    'js',
    'json',
    'vue'
  ],
  
  // Transform files
  transform: {
    '^.+\\.vue$': 'vue-jest',
    '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
    '^.+\\.jsx?$': 'babel-jest'
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/(?!(vue-ellipse-progress|vue-notification|@web3-onboard|ethers|bnc-notify)/)'
  ],
  
  // Module name mapping for aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test match patterns
  testMatch: [
    '**/tests/unit/**/*.spec.(js|jsx|ts|tsx)',
    '**/__tests__/*.(js|jsx|ts|tsx)'
  ],
  
  // Coverage configuration
  collectCoverage: false, // Disable coverage for now to focus on getting tests running
  collectCoverageFrom: [
    'src/**/*.{js,vue}',
    '!src/main.js',
    '!src/router/index.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  
  // Global variables
  globals: {
    'vue-jest': {
      babelConfig: {
        presets: [
          ['@babel/preset-env', {
            targets: {
              node: 'current'
            }
          }]
        ]
      }
    }
  }
};