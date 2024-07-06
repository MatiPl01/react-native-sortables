/* eslint-disable import/no-unused-modules */
import { type JestConfigWithTsJest, pathsToModuleNameMapper } from 'ts-jest';

import { compilerOptions } from './tsconfig.json';

const config: JestConfigWithTsJest = {
  clearMocks: true,
  fakeTimers: {
    enableGlobally: true
  },
  moduleDirectories: ['../../node_modules'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths ?? {}),
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup.js'],
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
        configFile: '../../test/babel.config.cjs'
      }
    ]
  },
  transformIgnorePatterns: ['jest-runner'],
  verbose: true
};

export default config;
