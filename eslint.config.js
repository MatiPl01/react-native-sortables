// CONFIGS
import eslintConfig from 'eslint-config-react-native-matipl01';
import globals from 'globals';

const ignores = [
  // Top-level directories and their contents
  'node_modules/**/*',
  '.yarn/**/*',
  'dist/**/*',
  // Top-level files
  'babel.config.cjs',
  'metro.config.js',
  'jest.setup.js',
  'bob.config.cjs',
  'eslint.config.js',
  'README.md',
  // Test configs
  'test/**/*',
  // Example app
  'example/**/*',
  '!example/app/**/*'
];

const configs = [
  // Expect any eslint
  ...eslintConfig,
  {
    languageOptions: {
      globals: {
        ...globals.jest
      },
      parserOptions: {
        project: ['./tsconfig.json', './example/app/tsconfig.json']
      }
    },
    rules: {
      'no-relative-import-paths/no-relative-import-paths': 'off',
      'import/namespace': 'off' // TODO - enable this rule when import module is adjusted to work with ESLint 9
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['./tsconfig.json', './example/app/tsconfig.json']
        }
      }
    }
  },
  {
    ignores
  }
];

export default configs;
