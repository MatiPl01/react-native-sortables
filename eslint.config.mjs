import baseConfig from 'eslint-config-react-native-matipl01';

export default [
  {
    ignores: [
      '.yarn/**',
      'example/**',
      '!example/app/**',
      'packages/docs/**',
      'scripts/**',
      '**/bob.config.cjs',
      '**/babel.config.cjs',
      '**/jest.setup.js',
      '**/dist',
      '**/README.md',
      '**/CONTRIBUTING.md',
      '**/CHANGELOG.md'
    ]
  },
  {
    files: ['.github/actions/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
        module: 'readonly',
        process: 'readonly',
        require: 'readonly'
      },
      sourceType: 'script'
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'import/no-commonjs': 'off'
    }
  },
  ...baseConfig
];
