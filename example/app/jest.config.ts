import { type JestConfigWithTsJest, pathsToModuleNameMapper } from 'ts-jest';

import { compilerOptions } from './tsconfig.json';

const config: JestConfigWithTsJest = {
  clearMocks: true,
  fakeTimers: {
    enableGlobally: true
  },
  moduleDirectories: ['node_modules', '../../node_modules', '<rootDir>'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths ?? {}, {
    prefix: '<rootDir>/'
  }),
  preset: '@react-native/jest-preset',
  resolver: 'react-native-worklets/jest/resolver.js',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        configFile: '../../test/babel.config.cjs'
      }
    ]
  },
  transformIgnorePatterns: ['jest-runner'],
  verbose: true
};

export default config;
