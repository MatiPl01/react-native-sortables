import { type JestConfigWithTsJest, pathsToModuleNameMapper } from 'ts-jest';

import { compilerOptions } from './tsconfig.json';

const config: JestConfigWithTsJest = {
  clearMocks: true,
  fakeTimers: {
    enableGlobally: true
  },
  moduleDirectories: ['node_modules', '../../node_modules', '<rootDir>'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths ?? {}, {
      prefix: '<rootDir>/'
    }),
    // react-native-sortables is built against gesture-handler v3, but the app's
    // jest mock targets v2; pin every import to the single mocked instance.
    '^react-native-gesture-handler$':
      '<rootDir>/../../node_modules/react-native-gesture-handler'
  },
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
