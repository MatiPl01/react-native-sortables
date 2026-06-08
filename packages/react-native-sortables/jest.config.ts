import { type JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  clearMocks: true,
  fakeTimers: {
    enableGlobally: true
  },
  moduleDirectories: ['node_modules', '../../node_modules', '<rootDir>'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  preset: '@react-native/jest-preset',
  resolver: 'react-native-worklets/jest/resolver.js',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.jsx?$': [
      'babel-jest',
      {
        configFile: '../../test/babel.config.cjs'
      }
    ],
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        configFile: '../../test/babel.config.cjs',
        diagnostics: false
      }
    ]
  },
  transformIgnorePatterns: ['jest-runner'],
  verbose: true
};

export default config;
