import path from 'path';
import { type JestConfigWithTsJest, pathsToModuleNameMapper } from 'ts-jest';

import { compilerOptions } from './tsconfig.json';

// react-native-sortables imports gesture-handler too, so it and the app must
// resolve the same copy for one jest mock to cover both. Resolve this app's own
// version hoist-proof via require.resolve: it finds it whether it sits in this
// app's node_modules or the hoisted monorepo root.
const gestureHandlerPath = path
  .dirname(
    require.resolve('react-native-gesture-handler/package.json', {
      paths: [__dirname]
    })
  )
  .split(path.sep)
  .join('/');

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
    '^react-native-gesture-handler$': gestureHandlerPath
  },
  preset: '@react-native/jest-preset',
  resolver: 'react-native-reanimated/jest/resolver.js',
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
